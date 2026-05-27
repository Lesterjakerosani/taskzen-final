import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// ── Multer setup ──────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Use PDF, DOCX, or PPTX.`));
    }
  },
});

// ── Text extraction ───────────────────────────────────────────────────────────

async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  // PDF
  if (mimetype === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return (data.text as string).trim();
  }

  // DOCX / DOC
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return (result.value as string).trim();
  }

  // PPTX / PPT — parse as ZIP and extract slide text nodes
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimetype === "application/vnd.ms-powerpoint"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const JSZip = require("jszip");
    const zip = await (JSZip as { loadAsync: (b: Buffer) => Promise<any> }).loadAsync(buffer);
    const texts: string[] = [];

    for (const filename of Object.keys(zip.files)) {
      if (/^ppt\/slides\/slide\d+\.xml$/.test(filename)) {
        const xml: string = await zip.files[filename].async("text");
        const matches = xml.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) ?? [];
        texts.push(
          ...matches
            .map((t: string) => t.replace(/<[^>]+>/g, "").trim())
            .filter(Boolean),
        );
      }
    }

    return texts.join("\n").trim();
  }

  return "";
}

// ── AI prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(topic: string | null, extractedText: string | null): string {
  const source = topic
    ? `Topic: ${topic}`
    : `Study Material:\n\n${(extractedText ?? "").slice(0, 14000)}`;

  return `You are an expert educational content creator. Generate a comprehensive student reviewer.

${source}

Return ONLY a valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "topic": "Clear subject/topic title",
  "summary": "Concise 2-3 paragraph overview of the subject",
  "reviewerContent": "Comprehensive study notes using ## for headers and bullet points. Use \\n for line breaks.",
  "keyConcepts": [
    { "term": "Term", "definition": "Clear, student-friendly definition" }
  ],
  "flashcards": [
    { "front": "Question or concept prompt", "back": "Answer or explanation" }
  ],
  "quizzes": [
    {
      "question": "Question text",
      "choices": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "answer": "A",
      "explanation": "Why this answer is correct"
    }
  ],
  "examQuestions": ["Possible essay or short-answer exam question?"]
}

Requirements:
- Minimum 10 key concepts
- Minimum 15 flashcards
- Exactly 10 multiple choice questions (answer must be A, B, C, or D)
- Minimum 10 exam questions
- reviewerContent must have clear ## section headers and be comprehensive`;
}

// ── Gemini caller ─────────────────────────────────────────────────────────────

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  };
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function parseGeminiJson(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/reviewers/generate
router.post(
  "/generate",
  requireAuth,
  upload.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY not configured" });
      return;
    }

    const userId = req.user!.userId;
    const topic: string | undefined = req.body?.topic?.trim();
    const file = req.file;

    if (!topic && !file) {
      res.status(400).json({ error: "Provide a topic or upload a file." });
      return;
    }

    try {
      let extractedText: string | null = null;
      let originalFileName: string | null = null;
      let fileType: string | null = null;

      if (file) {
        extractedText = await extractTextFromBuffer(file.buffer, file.mimetype);
        originalFileName = file.originalname;
        fileType = file.mimetype;

        if (!extractedText) {
          res.status(422).json({ error: "Could not extract text from the uploaded file." });
          return;
        }
      }

      const raw = await callGemini(buildPrompt(topic ?? null, extractedText), apiKey);

      let parsed: Record<string, unknown>;
      try {
        parsed = parseGeminiJson(raw);
      } catch {
        console.error("[Reviewer] Bad JSON from Gemini:", raw.slice(0, 300));
        res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
        return;
      }

      const reviewer = await prisma.reviewer.create({
        data: {
          userId,
          topic: (parsed.topic as string) || topic || originalFileName || "Untitled",
          originalFileName,
          fileType,
          generatedSummary: (parsed.summary as string) ?? "",
          reviewerContent: (parsed.reviewerContent as string) ?? "",
          keyConcepts: (parsed.keyConcepts as object[]) ?? [],
          flashcards: (parsed.flashcards as object[]) ?? [],
          quizzes: (parsed.quizzes as object[]) ?? [],
          examQuestions: (parsed.examQuestions as string[]) ?? [],
        },
      });

      res.json({ reviewer });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[Reviewer generate]", msg);
      res.status(500).json({ error: msg });
    }
  },
);

// GET /api/reviewers
router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const rawSearch = req.query.search;
  const search = (typeof rawSearch === "string" ? rawSearch : "").trim();

  try {
    const reviewers = await prisma.reviewer.findMany({
      where: {
        userId,
        ...(search ? { topic: { contains: search, mode: "insensitive" as const } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        topic: true,
        originalFileName: true,
        fileType: true,
        generatedSummary: true,
        bookmarked: true,
        createdAt: true,
        flashcards: true,
        quizzes: true,
        keyConcepts: true,
      },
    });

    res.json({ reviewers });
  } catch (err) {
    console.error("[Reviewer list]", err);
    res.status(500).json({ error: "Failed to fetch reviewers" });
  }
});

// GET /api/reviewers/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  try {
    const reviewer = await prisma.reviewer.findFirst({ where: { id, userId } });
    if (!reviewer) {
      res.status(404).json({ error: "Reviewer not found" });
      return;
    }
    res.json({ reviewer });
  } catch (err) {
    console.error("[Reviewer get]", err);
    res.status(500).json({ error: "Failed to fetch reviewer" });
  }
});

// PATCH /api/reviewers/:id/bookmark — toggle bookmark
router.patch("/:id/bookmark", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  try {
    const existing = await prisma.reviewer.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Reviewer not found" });
      return;
    }

    const updated = await prisma.reviewer.update({
      where: { id },
      data: { bookmarked: !existing.bookmarked },
    });

    res.json({ reviewer: updated });
  } catch (err) {
    console.error("[Reviewer bookmark]", err);
    res.status(500).json({ error: "Failed to update bookmark" });
  }
});

// DELETE /api/reviewers/:id
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  try {
    const existing = await prisma.reviewer.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Reviewer not found" });
      return;
    }

    await prisma.reviewer.delete({ where: { id } });
    res.json({ message: "Reviewer deleted" });
  } catch (err) {
    console.error("[Reviewer delete]", err);
    res.status(500).json({ error: "Failed to delete reviewer" });
  }
});

export default router;
