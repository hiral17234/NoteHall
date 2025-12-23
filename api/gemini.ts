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

    const { prompt, images } = req.body;

    if (!prompt && (!images || images.length === 0)) {
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

    if (Array.isArray(images)) {
  for (const img of images) {
    if (img?.base64 && img?.mimeType) {
      parts.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType,
        },
      });
    }
  }
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

