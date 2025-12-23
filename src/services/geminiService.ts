// Gemini AI Service for NoteHall
// Uses backend API route for secure API key handling

export interface GeminiMessage {
  role: "user" | "assistant";
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

const API_ENDPOINT = "/api/gemini";

class GeminiService {
  private conversationHistory: GeminiMessage[] = [];
  private context: GeminiContext = {};

  isConfigured(): boolean {
    return true;
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

  async sendMessage(
    userMessage: string,
    images?: {
      base64: string;
      mimeType: string;
    }[]
  ): Promise<string> {
this.conversationHistory.push({
  role: "user",
  content:
    userMessage?.trim() || "User sent image(s) for analysis.",
});

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage,
          images, // ✅ FIX
          context: {
            subject: this.context.selectedSubject,
            noteTitle: this.context.noteTitle,
            noteContent: this.context.noteContent,
            userBranch: this.context.userBranch,
            userYear: this.context.userYear,
          },
          history: this.conversationHistory.slice(0, -1),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.text;

      this.conversationHistory.push({
  role: "assistant",
  content: assistantMessage,
});

      return assistantMessage;
    } catch (error) {
      this.conversationHistory.pop();
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
