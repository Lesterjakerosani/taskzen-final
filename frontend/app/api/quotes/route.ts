import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const fallbackQuotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "The expert in anything was once a beginner. — Helen Hayes",
  "It always seems impossible until it is done. — Nelson Mandela",
  "Your limitation — it is only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
];

export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return NextResponse.json({ quote });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(
      "Generate one unique, short (1-2 sentences), powerful motivational quote specifically for a student who is studying and trying to stay focused. The quote should feel fresh and original. Return ONLY the quote text, nothing else. You may include a real author attribution at the end if applicable."
    );

    const quote = result.response.text().trim();
    return NextResponse.json({ quote });
  } catch {
    const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return NextResponse.json({ quote });
  }
}
