import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `You are Gemini, an AI study assistant integrated into NoteHall.`;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY missing");
    return res.status(500).json({
      error: "Gemini API key is not configured",
    });
  }

  try {
    const { prompt, context, history } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      },
      ...(history || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Invalid Gemini response", data);
      return res.status(500).json({ error: "Invalid Gemini response" });
    }

    return res.status(200).json({
      text: data.candidates[0].content.parts[0].text,
    });
  } catch (err) {
    console.error("Gemini server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
