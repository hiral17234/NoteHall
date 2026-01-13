import type { Note } from "@/services/firestoreService";

export type NoteCardNote = {
  id: string;
  title: string;
  subject: string;
  branch: string;
  year: string;
  fileType: "pdf" | "image" | "video" | "link";
  fileUrl?: string;
  likes: number;
  dislikes: number;
  views: number;
  authorId: string;
  authorName: string;
  timestamp?: string;
  topic?: string;
  isTrusted?: boolean;
  likedBy?: string[];
  dislikedBy?: string[];
  savedBy?: string[];
  ratings?: Note["ratings"];
  difficulty?: "easy" | "medium" | "hard";
  createdAt?: any;
  commentsCount?: number;
  reportCount?: number;
  isHidden?: boolean;
};

const pickDifficultyLabel = (difficulty: Note["difficulty"] | undefined): NoteCardNote["difficulty"] => {
  if (!difficulty) return undefined;
  const entries = Object.entries(difficulty) as Array<["easy" | "medium" | "hard", number]>;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const [label, count] = sorted[0] || ["easy", 0];
  return count > 0 ? label : undefined;
};

export const mapFirestoreNoteToCardNote = (note: Note): NoteCardNote => {
  const timestamp = note.createdAt?.toDate?.()?.toLocaleDateString?.() || undefined;
  return {
    id: note.id,
    title: note.title,
    subject: note.subject,
    branch: note.branch,
    year: note.year,
    fileType: note.fileType,
    fileUrl: note.fileUrl,
    likes: note.likes ?? 0,
    dislikes: note.dislikes ?? 0,
    views: note.views ?? 0,
    authorId: note.authorId,
    authorName: note.authorName,
    timestamp,
    topic: note.topic,
    isTrusted: note.isTrusted,
    likedBy: note.likedBy,
    savedBy: note.savedBy,
    // dislikedBy isn't declared on Note yet in firestoreService, but exists in docs in practice
    dislikedBy: (note as any).dislikedBy,
    ratings: note.ratings,
    difficulty: pickDifficultyLabel(note.difficulty),
    createdAt: note.createdAt,
    commentsCount: (note as any).commentsCount ?? 0,
    reportCount: (note as any).reportCount ?? 0,
    isHidden: (note as any).isHidden ?? false,
  };
};
