// /api/gemini.ts
// Vercel Node Serverless Function for Gemini AI
// API key is read from process.env.GEMINI_API_KEY (set in Vercel dashboard)

import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `You are Gemini, an AI study assistant integrated into NoteHall - a platform for college students to share and find academic notes.

Your personality:
- Friendly and helpful, like a knowledgeable senior student or tutor
- Enthusiastic about learning and helping others succeed academically
- Clear, concise, and focused on practical value

Your capabilities:
1. General Chat
2. Note Summarization
3. Doubt Solving
4. Study Recommendations
5. Exam Preparation

Rules:
- Keep responses focused and actionable for students
- Use markdown formatting
- NEVER ask for personal data

Response formatting:
- Use bullet points when helpful
- Be concise unless detail is requested`;

interface RequestBody {
  prompt: string;
  context?: {
    subject?: string;
    noteTitle?: string;
    noteContent?: string;
    userBranch?: string;
    userYear?: string;
  };
  history?: Array<{ role: "user" | "model"; content: string }>;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured");
    return res.status(500).json({
      error: "Gemini API key is not configured on server",
    });
  }

  try {
    const body: RequestBody = req.body;
    const { prompt, context, history } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required and must be a non-empty string",
      });
    }

    // Build context string
    const contextParts: string[] = [];
    if (context?.subject) contextParts.push(`Subject: ${context.subject}`);
    if (context?.noteTitle) contextParts.push(`Note: "${context.noteTitle}"`);
    if (context?.userBranch) contextParts.push(`User's branch: ${context.userBranch}`);
    if (context?.userYear) contextParts.push(`User's year: ${context.userYear}`);
    if (context?.noteContent)
      contextParts.push(`Note content:\n${context.noteContent}`);

    const contextString =
      contextParts.length > 0
        ? `\n\nContext:\n${contextParts.join("\n")}`
        : "";

    // Build Gemini contents
    const contents: any[] = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT + contextString }],
      },
      {
        role: "model",
        parts: [
          {
            text:
              "I understand. I'm Gemini, your AI study assistant for NoteHall. How can I help you?",
          },
        ],
      },
    ];

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current prompt
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return res.status(429).json({
          error: "Rate limit exceeded. Please try again later.",
        });
      }

      return res.status(500).json({
        error: "Gemini API error",
        details: errorData,
      });
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini";

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
