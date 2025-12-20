// Gemini AI Service for NoteHall
// Uses Google Generative AI (Gemini) API

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export interface GeminiMessage {
  role: "user" | "model";
  content: string;
}

export interface GeminiContext {
  currentPage?: string;
  selectedSubject?: string;
  userInterests?: string[];
  userBranch?: string;
  userYear?: string;
  noteContent?: string;
  noteTitle?: string;
}

const SYSTEM_PROMPT = `You are Gemini, an AI study assistant integrated into NoteHall - a platform for college students to share and find academic notes.

Your personality:
- Friendly and helpful, like a knowledgeable senior student or tutor
- Enthusiastic about learning and helping others succeed academically
- Clear, concise, and focused on practical value

Your capabilities:
1. **General Chat**: Respond naturally to greetings, questions about yourself, and casual conversation
2. **Note Summarization**: Summarize study materials into bullet points, key concepts, or exam-focused highlights
3. **Doubt Solving**: Explain concepts step-by-step at the appropriate difficulty level (beginner/intermediate/advanced)
4. **Study Recommendations**: Suggest related topics, next concepts to study, and provide study tips
5. **Exam Preparation**: Generate practice questions, important questions, and exam tips

Rules:
- Keep responses focused and actionable for students
- Use formatting (bullet points, headers) when helpful
- If the user provides note content, use it as context for your responses
- Personalize responses based on user's branch, year, and interests when available
- NEVER ask for or reference personal information like email, phone, or private data

Response formatting:
- Use markdown for better readability
- Keep responses concise unless detailed explanations are requested
- Use bullet points for lists
- Use code blocks for any code or formulas`;

class GeminiService {
  private conversationHistory: GeminiMessage[] = [];
  private context: GeminiContext = {};

  isConfigured(): boolean {
    return !!GEMINI_API_KEY;
  }

  setContext(context: GeminiContext) {
    this.context = { ...this.context, ...context };
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory(): GeminiMessage[] {
    return [...this.conversationHistory];
  }

  private buildContextPrompt(): string {
    const parts: string[] = [];
    
    if (this.context.currentPage) {
      parts.push(`The user is currently on the ${this.context.currentPage} page.`);
    }
    if (this.context.selectedSubject) {
      parts.push(`Current subject context: ${this.context.selectedSubject}`);
    }
    if (this.context.userBranch) {
      parts.push(`User's branch: ${this.context.userBranch}`);
    }
    if (this.context.userYear) {
      parts.push(`User's year: ${this.context.userYear}`);
    }
    if (this.context.userInterests?.length) {
      parts.push(`User's interests: ${this.context.userInterests.join(", ")}`);
    }
    if (this.context.noteTitle) {
      parts.push(`Currently viewing note: "${this.context.noteTitle}"`);
    }
    if (this.context.noteContent) {
      parts.push(`Note content:\n${this.context.noteContent}`);
    }

    return parts.length > 0 ? `\n\nContext:\n${parts.join("\n")}` : "";
  }

  async sendMessage(userMessage: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment.");
    }

    // Add user message to history
    this.conversationHistory.push({ role: "user", content: userMessage });

    try {
      // Build the request with conversation history
      const contents = [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + this.buildContextPrompt() }]
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'm Gemini, your AI study assistant for NoteHall. I'm ready to help with summarizing notes, explaining concepts, answering doubts, and providing study recommendations. How can I assist you today?" }]
        },
        ...this.conversationHistory.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }))
      ];

      const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
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
        console.error("Gemini API error:", errorData);
        
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        if (response.status === 400) {
          throw new Error("Invalid request. Please try rephrasing your question.");
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response from Gemini API");
      }

      const assistantMessage = data.candidates[0].content.parts[0].text;
      
      // Add assistant response to history
      this.conversationHistory.push({ role: "model", content: assistantMessage });

      return assistantMessage;
    } catch (error) {
      // Remove the failed user message from history
      this.conversationHistory.pop();
      throw error;
    }
  }

  // Specialized methods for common actions
  async summarize(content: string, format: "short" | "bullets" | "exam"): Promise<string> {
    const prompts = {
      short: `Provide a concise summary (2-3 paragraphs) of the following content:\n\n${content}`,
      bullets: `Summarize the following content as bullet points with key concepts:\n\n${content}`,
      exam: `Extract the most important exam-focused points from this content. Include key definitions, formulas, and concepts likely to appear in exams:\n\n${content}`,
    };
    
    return this.sendMessage(prompts[format]);
  }

  async explainConcept(concept: string, level: "beginner" | "intermediate" | "advanced"): Promise<string> {
    const levelDescriptions = {
      beginner: "Explain this as if I'm completely new to the topic. Use simple language and analogies.",
      intermediate: "Explain this assuming I have basic knowledge. Include more technical details.",
      advanced: "Give me an in-depth explanation with technical details, edge cases, and advanced concepts.",
    };

    return this.sendMessage(`${levelDescriptions[level]}\n\nConcept: ${concept}`);
  }

  async generateQuestions(topic: string, count: number = 5): Promise<string> {
    return this.sendMessage(`Generate ${count} practice questions about "${topic}". Include a mix of:
- 2 conceptual/theory questions
- 2 application/problem-solving questions  
- 1 tricky/challenging question that could appear in exams

Format each question clearly with numbers.`);
  }

  async getStudyTips(subject: string): Promise<string> {
    return this.sendMessage(`Provide practical study tips and strategies for learning ${subject}. Include:
- Recommended approach/methodology
- Common mistakes to avoid
- Key topics to focus on
- Resources or techniques that help`);
  }
}

export const geminiService = new GeminiService();
export default geminiService;
