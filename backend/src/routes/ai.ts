import { Router, Response, RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth as RequestHandler);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SYSTEM_PROMPT = `You are TaskZen's AI Study Assistant — a friendly, knowledgeable tutor and productivity coach for students.

Your role:
- Help students with studying, explaining difficult concepts, and creating study plans
- Give productivity and focus tips tailored to students
- Motivate and encourage without being over the top
- Answer academic questions across all subjects (math, science, history, coding, languages, etc.)
- Keep responses concise and scannable — use bullet points or short paragraphs when helpful

Tone: warm, clear, supportive. Never robotic or overly formal.
Limit responses to 3-4 short paragraphs or equivalent bullet points unless the topic genuinely requires more depth.`;

router.post("/", (async (req, res: Response): Promise<void> => {
  const { messages } = req.body as unknown as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array required" });
    return;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    res.json({ content: text });
  } catch (err: unknown) {
    console.error("[AI route]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
}) as RequestHandler);

export default router;
