// /api/gemini.ts
// Vercel Serverless Function for Gemini AI
// API key is read ONLY from process.env.GEMINI_API_KEY

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ============================
   SYSTEM PROMPT
============================ */
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
- Keep responses focused and actionable
- Use markdown formatting when helpful
- NEVER ask for personal data

Response formatting:
- Use bullet points when useful
- Be concise unless user asks for detail
`;

/* ============================
   TYPES
============================ */
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

/* ============================
   HANDLER
============================ */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  /* ---------- Method Check ---------- */
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  /* ---------- API Key ---------- */
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY missing");
    return res.status(500).json({
      error: "Gemini API key is not configured on server",
    });
  }

  /* ---------- Parse Body ---------- */
  let body: RequestBody;
  try {
    body = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { prompt, context, history } = body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Prompt is required and must be a non-empty string",
    });
  }

  /* ---------- Build Context ---------- */
  const contextLines: string[] = [];
  if (context?.subject) contextLines.push(`Subject: ${context.subject}`);
  if (context?.noteTitle) contextLines.push(`Note: ${context.noteTitle}`);
  if (context?.userBranch) contextLines.push(`Branch: ${context.userBranch}`);
  if (context?.userYear) contextLines.push(`Year: ${context.userYear}`);
  if (context?.noteContent)
    contextLines.push(`Note Content:\n${context.noteContent}`);

  const contextBlock =
    contextLines.length > 0
      ? `\n\nContext:\n${contextLines.join("\n")}`
      : "";

  /* ---------- Build Final Prompt ---------- */
  let finalPrompt = `${SYSTEM_PROMPT}${contextBlock}\n\nUser Question:\n${prompt}`;

  if (history && Array.isArray(history)) {
    const historyText = history
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n");
    finalPrompt = `${SYSTEM_PROMPT}${contextBlock}\n\nConversation so far:\n${historyText}\n\nUser Question:\n${prompt}`;
  }

  /* ---------- Gemini Call ---------- */
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
    });

    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();

    if (!text) {
      return res.status(500).json({
        error: "Empty response from Gemini",
      });
    }

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("🔥 Gemini API Error:", error);

    if (error?.message?.includes("quota")) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
      });
    }

    return res.status(500).json({
      error: "Gemini failed to generate a response",
    });
  }
}
