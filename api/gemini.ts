import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

type HistoryMessage = {
  role: "user" | "assistant";
  content?: string;
  images?: { base64: string; mimeType: string }[];
};

const toParts = (text?: string, images?: { base64: string; mimeType: string }[]) => {
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  if (text?.trim()) {
    parts.push({ text: text.trim() });
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

  return parts;
};

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

    const { prompt, images, history } = req.body as {
      prompt?: string;
      images?: { base64: string; mimeType: string }[];
      history?: HistoryMessage[];
    };

    if (!prompt && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Prompt or image required" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;
    }> = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg?.role !== "user" && msg?.role !== "assistant") continue;
        const historyParts = toParts(msg.content, msg.images);
        if (historyParts.length === 0) continue;

        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: historyParts,
        });
      }
    }

    const currentParts = toParts(prompt, images);
    if (currentParts.length === 0) {
      return res.status(400).json({ error: "Prompt or image required" });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    const result = await model.generateContent({ contents });
    const text = result.response.text();

    return res.status(200).json({ text });
  } catch (err) {
    console.error("FULL GEMINI ERROR:", err);
    return res.status(500).json({ error: "Gemini failed" });
  }
}


