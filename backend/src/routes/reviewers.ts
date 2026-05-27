import { Router, Response, RequestHandler, Request } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(requireAuth as RequestHandler);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Wraps AuthRequest handlers so TypeScript's overload resolver is satisfied
function h(fn: (req: AuthRequest, res: Response) => Promise<void>): RequestHandler {
  return fn as unknown as RequestHandler;
}

// ── Gemini key + model rotation ───────────────────────────────────────────────

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter((k): k is string => Boolean(k));

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("resource has been exhausted") ||
      msg.includes("resource_exhausted") ||
      msg.includes("rate_limit_exceeded") ||
      msg.includes("rate limit") ||
      msg.includes("503") ||
      msg.includes("overloaded")
    );
  }
  return false;
}

function isModelUnavailable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("404") ||
      msg.includes("not found") ||
      msg.includes("model not found") ||
      msg.includes("403") ||
      msg.includes("permission denied") ||
      msg.includes("not supported")
    );
  }
  return false;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

type GeminiPart =
  | { text: string }
  | { inlineData: { data: string; mimeType: string } };

async function callGemini(parts: GeminiPart[]): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured. Please add GEMINI_API_KEY to your environment.");
  }

  // Try every model × key combination before giving up
  for (const modelName of GEMINI_MODELS) {
    for (let i = 0; i < GEMINI_KEYS.length; i++) {
      if (i > 0) await delay(1500);

      const genAI = new GoogleGenerativeAI(GEMINI_KEYS[i]);
      const model = genAI.getGenerativeModel({ model: modelName });

      try {
        const result = await model.generateContent(parts);
        return result.response.text();
      } catch (err) {
        if (isRetryableError(err)) {
          console.warn(`[reviewers] ${modelName} key ${i + 1} quota/rate limit — trying next...`);
          continue;
        }
        if (isModelUnavailable(err)) {
          console.warn(`[reviewers] ${modelName} key ${i + 1} unavailable — skipping model...`);
          break; // skip remaining keys for this model, try next model
        }
        throw err; // unexpected error — surface immediately
      }
    }
  }

  throw new Error(
    "All AI models are currently unavailable or quota-exhausted. Please wait a few minutes and try again, or try again tomorrow if you have hit your daily limit.",
  );
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildPrompt(source: string): string {
  return `${source}

Generate a student study reviewer. Return ONLY a valid JSON object — no markdown, no code blocks:
{
  "summary": "2-3 paragraph overview",
  "studyNotes": "Study notes in markdown with ## headers and bullet points",
  "keyConcepts": [{"term": "term", "definition": "definition"}],
  "flashcards": [{"front": "question", "back": "answer"}],
  "quizzes": [{"question": "question", "choices": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "why correct"}],
  "examQuestions": ["exam question"]
}

Requirements: 6-8 keyConcepts, 8-10 flashcards, 5-6 quiz questions (A/B/C/D), 4-5 exam questions.`;
}

async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === "application/pdf") return "";

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return (result.value as string).trim();
  }

  if (
    mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimetype === "application/vnd.ms-powerpoint"
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const JSZip = require("jszip");
    const zip = await (JSZip as { loadAsync: (b: Buffer) => Promise<{ files: Record<string, { async: (t: string) => Promise<string> }> }> }).loadAsync(buffer);
    const texts: string[] = [];
    for (const filename of Object.keys(zip.files)) {
      if (/^ppt\/slides\/slide\d+\.xml$/.test(filename)) {
        const xml = await zip.files[filename].async("text");
        const matches = xml.match(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g) ?? [];
        texts.push(...matches.map((t: string) => t.replace(/<[^>]+>/g, "").trim()).filter(Boolean));
      }
    }
    return texts.join("\n").trim();
  }

  return "";
}

function parseGeminiJson(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/reviewers/generate
router.post(
  "/generate",
  upload.single("file") as RequestHandler,
  h(async (req, res) => {
    const userId = req.user!.userId;
    const topic = req.body?.topic as string | undefined;
    const file = (req as Request & { file?: Express.Multer.File }).file;

    if (!topic && !file) {
      res.status(400).json({ error: "Provide a topic or upload a file." });
      return;
    }

    try {
      let parts: GeminiPart[];
      let resolvedTopic: string;

      if (file) {
        resolvedTopic = file.originalname.replace(/\.[^/.]+$/, "");
        if (file.mimetype === "application/pdf") {
          parts = [
            { inlineData: { data: file.buffer.toString("base64"), mimeType: file.mimetype } },
            { text: buildPrompt(`Analyze this PDF document "${file.originalname}" and`) },
          ];
        } else {
          const extracted = await extractTextFromBuffer(file.buffer, file.mimetype);
          const source = extracted
            ? `Based on this document content from "${file.originalname}":\n\n${extracted.slice(0, 12000)}`
            : `Topic: ${resolvedTopic}`;
          parts = [{ text: buildPrompt(source) }];
        }
      } else {
        resolvedTopic = topic!;
        parts = [{ text: buildPrompt(`Topic: ${resolvedTopic}`) }];
      }

      const rawText = await callGemini(parts);
      const parsed = parseGeminiJson(rawText);

      const reviewer = await prisma.reviewer.create({
        data: {
          userId,
          topic: resolvedTopic,
          originalFileName: file?.originalname ?? null,
          fileType: file?.mimetype ?? null,
          generatedSummary: (parsed.summary as string) ?? null,
          reviewerContent: (parsed.studyNotes as string) ?? null,
          keyConcepts: parsed.keyConcepts ?? [],
          flashcards: parsed.flashcards ?? [],
          quizzes: parsed.quizzes ?? [],
          examQuestions: parsed.examQuestions ?? [],
        },
      });

      res.json({ reviewer });
    } catch (err: unknown) {
      console.error("[reviewers/generate]", err);
      const msg = err instanceof Error ? err.message : "Generation failed. Please try again.";
      res.status(500).json({ error: msg });
    }
  }),
);

// GET /api/reviewers
router.get("/", h(async (req, res) => {
  const userId = req.user!.userId;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  try {
    const reviewers = await prisma.reviewer.findMany({
      where: {
        userId,
        ...(search
          ? { topic: { contains: search, mode: Prisma.QueryMode.insensitive } }
          : {}),
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
    console.error("[reviewers/list]", err);
    res.status(500).json({ error: "Failed to fetch reviewers." });
  }
}));

// GET /api/reviewers/:id
router.get("/:id", h(async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  try {
    const reviewer = await prisma.reviewer.findFirst({ where: { id, userId } });
    if (!reviewer) {
      res.status(404).json({ error: "Reviewer not found." });
      return;
    }
    res.json({ reviewer });
  } catch (err) {
    console.error("[reviewers/get]", err);
    res.status(500).json({ error: "Failed to fetch reviewer." });
  }
}));

// PATCH /api/reviewers/:id/bookmark
router.patch("/:id/bookmark", h(async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  try {
    const existing = await prisma.reviewer.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Reviewer not found." });
      return;
    }

    const reviewer = await prisma.reviewer.update({
      where: { id },
      data: { bookmarked: !existing.bookmarked },
    });

    res.json({ reviewer });
  } catch (err) {
    console.error("[reviewers/bookmark]", err);
    res.status(500).json({ error: "Failed to update bookmark." });
  }
}));

// DELETE /api/reviewers/:id
router.delete("/:id", h(async (req, res) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  try {
    const existing = await prisma.reviewer.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ error: "Reviewer not found." });
      return;
    }

    await prisma.reviewer.delete({ where: { id } });
    res.json({ message: "Deleted." });
  } catch (err) {
    console.error("[reviewers/delete]", err);
    res.status(500).json({ error: "Failed to delete reviewer." });
  }
}));

export default router;
