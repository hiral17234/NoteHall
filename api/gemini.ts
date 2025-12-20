// Vercel Serverless Function for Gemini AI
// API key is read from process.env.GEMINI_API_KEY (set in Vercel dashboard)

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `You are Gemini, an AI study assistant integrated into NoteHall - a platform for college students to share and find academic notes.

Your personality:
- Friendly and helpful, like a knowledgeable senior student or tutor
- Enthusiastic about learning and helping others succeed academically
- Clear, concise, and focused on practical value

Your capabilities:
1. **General Chat**: Respond naturally to greetings, questions about yourself, and casual conversation
2. **Note Summarization**: Summarize study materials into bullet points, key concepts, or exam-focused highlights
3. **Doubt Solving**: Explain concepts step-by-step at the appropriate difficulty level
4. **Study Recommendations**: Suggest related topics, next concepts to study, and provide study tips
5. **Exam Preparation**: Generate practice questions, important questions, and exam tips

Rules:
- Keep responses focused and actionable for students
- Use formatting (bullet points, headers) when helpful
- Personalize responses based on user's context when available
- NEVER ask for or reference personal information like email, phone, or private data

Response formatting:
- Use markdown for better readability
- Keep responses concise unless detailed explanations are requested
- Use bullet points for lists
- Use code blocks for any code or formulas`;

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

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "Gemini API key is not configured on server" }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { prompt, context, history } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt is required and must be a non-empty string" }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Build context string
    const contextParts: string[] = [];
    if (context?.subject) contextParts.push(`Subject: ${context.subject}`);
    if (context?.noteTitle) contextParts.push(`Note: "${context.noteTitle}"`);
    if (context?.userBranch) contextParts.push(`User's branch: ${context.userBranch}`);
    if (context?.userYear) contextParts.push(`User's year: ${context.userYear}`);
    if (context?.noteContent) contextParts.push(`Note content:\n${context.noteContent}`);
    
    const contextString = contextParts.length > 0 
      ? `\n\nContext:\n${contextParts.join("\n")}` 
      : "";

    // Build conversation contents
    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT + contextString }],
      },
      {
        role: "model",
        parts: [{ text: "I understand. I'm Gemini, your AI study assistant for NoteHall. I'm ready to help with summarizing notes, explaining concepts, answering doubts, and providing study recommendations. How can I assist you today?" }],
      },
    ];

    // Add conversation history if provided
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
      headers: {
        "Content-Type": "application/json",
      },
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
      console.error("Gemini API error:", response.status, errorData);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          {
            status: 429,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: "Invalid request. Please try rephrasing your question." }),
          {
            status: 400,
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}` }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return new Response(
        JSON.stringify({ error: "Invalid response from Gemini API" }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const text = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
