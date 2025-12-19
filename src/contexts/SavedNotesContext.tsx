import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface SavedNote {
  id: string;
  title: string;
  subject: string;
  savedAt: string;
}

interface SavedNotesContextType {
  savedNoteIds: string[];
  savedNotes: SavedNote[];
  isNoteSaved: (noteId: string) => boolean;
  saveNote: (note: { id: string; title: string; subject: string }) => void;
  unsaveNote: (noteId: string) => void;
  toggleSave: (note: { id: string; title: string; subject: string }) => void;
}

const STORAGE_KEY = "notehall_saved_notes_data";

const SavedNotesContext = createContext<SavedNotesContextType | undefined>(undefined);

export function SavedNotesProvider({ children }: { children: ReactNode }) {
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedNotes(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading saved notes:", error);
    }
  }, []);

  // Persist to localStorage whenever saved notes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedNotes));
  }, [savedNotes]);

  const savedNoteIds = savedNotes.map(n => n.id);

  const isNoteSaved = useCallback((noteId: string) => {
    return savedNoteIds.includes(noteId);
  }, [savedNoteIds]);

  const saveNote = useCallback((note: { id: string; title: string; subject: string }) => {
    setSavedNotes(prev => {
      if (prev.some(n => n.id === note.id)) return prev;
      return [...prev, { ...note, savedAt: new Date().toISOString() }];
    });
    toast({
      title: "Saved!",
      description: "Note added to your collection",
    });
  }, []);

  const unsaveNote = useCallback((noteId: string) => {
    setSavedNotes(prev => prev.filter(n => n.id !== noteId));
    toast({
      title: "Removed",
      description: "Note removed from your collection",
    });
  }, []);

  const toggleSave = useCallback((note: { id: string; title: string; subject: string }) => {
    if (isNoteSaved(note.id)) {
      unsaveNote(note.id);
    } else {
      saveNote(note);
    }
  }, [isNoteSaved, saveNote, unsaveNote]);

  return (
    <SavedNotesContext.Provider
      value={{
        savedNoteIds,
        savedNotes,
        isNoteSaved,
        saveNote,
        unsaveNote,
        toggleSave,
      }}
    >
      {children}
    </SavedNotesContext.Provider>
  );
}

export function useSavedNotes() {
  const context = useContext(SavedNotesContext);
  if (!context) {
    throw new Error("useSavedNotes must be used within a SavedNotesProvider");
  }
  return context;
}
