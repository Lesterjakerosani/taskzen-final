import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are TaskZen's AI Study Assistant — a friendly, knowledgeable tutor and productivity coach for students.

Your role:
- Help students with studying, explaining difficult concepts, and creating study plans
- Give productivity and focus tips tailored to students
- Motivate and encourage without being over the top
- Answer academic questions across all subjects (math, science, history, coding, languages, etc.)
- Keep responses concise and scannable — use bullet points or short paragraphs when helpful

Tone: warm, clear, supportive. Limit responses to 3-4 paragraphs or equivalent bullet points.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGemini(
  apiKey: string,
  body: object,
  retries = 2
): Promise<{ ok: true; text: string } | { ok: false; status: number; message: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from Gemini.";
      return { ok: true, text };
    }

    // 429 — rate limited: wait and retry
    if (res.status === 429 && attempt < retries) {
      const waitMs = (attempt + 1) * 3000; // 3s, 6s
      console.warn(`[Gemini] Rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1})`);
      await sleep(waitMs);
      continue;
    }

    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    return {
      ok: false,
      status: res.status,
      message: err?.error?.message ?? res.statusText,
    };
  }

  return { ok: false, status: 429, message: "Rate limit exceeded after retries." };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  let messages: { role: "user" | "assistant"; content: string }[];
  try {
    ({ messages } = await req.json());
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("invalid");
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  try {
    const result = await callGemini(apiKey, body);

    if (result.ok) {
      return NextResponse.json({ content: result.text });
    }

    if (result.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment.", content: null },
        { status: 429 }
      );
    }

    console.error("[Gemini API error]", result.status, result.message);
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  } catch (err) {
    console.error("[Gemini fetch error]", err);
    return NextResponse.json(
      { error: "Failed to reach Gemini API." },
      { status: 500 }
    );
  }
}
