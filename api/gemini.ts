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
    console.log("ENV KEY EXISTS:", !!apiKey);

    if (!apiKey) {
      return res.status(500).json({ error: "API key missing" });
    }

    const { prompt, image } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ error: "Prompt or image required" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ MODEL CONFIRMED FROM YOUR LIST
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    // ✅ CRITICAL FIX: use parts[]
    const parts: any[] = [];

    if (prompt) {
      parts.push({ text: prompt });
    }

    if (image?.base64 && image?.mimeType) {
      parts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const text = result.response.text();

    return res.status(200).json({ text });
  } catch (err) {
    console.error("FULL GEMINI ERROR:", err);
    return res.status(500).json({ error: "Gemini failed" });
  }
}

