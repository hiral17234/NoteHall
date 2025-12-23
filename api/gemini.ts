import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY missing");
      return res.status(500).json({ error: "API key missing" });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ ONLY universally supported model
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.0-pro",
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json({ text });
  } catch (err) {
    console.error("🔥 FULL GEMINI ERROR:", err);
    return res.status(500).json({ error: "Gemini failed" });
  }
}
