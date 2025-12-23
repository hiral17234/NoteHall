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
      return res.status(500).json({ error: "API key missing" });
    }

    const { prompt, image } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ Image-capable model
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash"
    });

    const parts: any[] = [{ text: prompt }];

    // ✅ Attach image if present
    if (image) {
      parts.push({
        inlineData: {
          mimeType: "image/png", // or image/jpeg
          data: image
        }
      });
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts
        }
      ]
    });

    const text = result.response.text();
    return res.status(200).json({ text });

  } catch (err) {
    console.error("FULL GEMINI ERROR:", err);
    return res.status(500).json({ error: "Gemini failed" });
  }
}

