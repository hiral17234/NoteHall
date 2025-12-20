// Gemini AI Service for NoteHall
// Uses backend API route for secure API key handling

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

// API endpoint - uses relative path for Vercel deployment
const API_ENDPOINT = "/api/gemini";

class GeminiService {
  private conversationHistory: GeminiMessage[] = [];
  private context: GeminiContext = {};

  isConfigured(): boolean {
    // Always configured since backend handles the API key
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

  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({ role: "user", content: userMessage });

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage,
          context: {
            subject: this.context.selectedSubject,
            noteTitle: this.context.noteTitle,
            noteContent: this.context.noteContent,
            userBranch: this.context.userBranch,
            userYear: this.context.userYear,
          },
          history: this.conversationHistory.slice(0, -1), // Exclude current message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.text;

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
