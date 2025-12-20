import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { notesService } from "@/services/firestoreService";

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
  saveNote: (note: { id: string; title: string; subject: string }) => Promise<void>;
  unsaveNote: (noteId: string) => Promise<void>;
  toggleSave: (note: { id: string; title: string; subject: string }) => Promise<void>;
  loading: boolean;
}

const SavedNotesContext = createContext<SavedNotesContextType | undefined>(undefined);

export function SavedNotesProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(false);

  // Load saved notes from Firestore when user changes
  useEffect(() => {
    const loadSavedNotes = async () => {
      if (!userProfile?.id) {
        setSavedNotes([]);
        return;
      }

      setLoading(true);
      try {
        const notes = await notesService.getSavedNotes(userProfile.id);
        setSavedNotes(notes.map(n => ({
          id: n.id,
          title: n.title,
          subject: n.subject,
          savedAt: n.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        })));
      } catch (error) {
        console.error("Error loading saved notes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedNotes();
  }, [userProfile?.id]);

  const savedNoteIds = savedNotes.map(n => n.id);

  const isNoteSaved = useCallback((noteId: string) => {
    return savedNoteIds.includes(noteId);
  }, [savedNoteIds]);

  const saveNote = useCallback(async (note: { id: string; title: string; subject: string }) => {
    if (!userProfile?.id) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save notes",
        variant: "destructive",
      });
      return;
    }

    try {
      await notesService.saveNote(note.id, userProfile.id);
      setSavedNotes(prev => {
        if (prev.some(n => n.id === note.id)) return prev;
        return [...prev, { ...note, savedAt: new Date().toISOString() }];
      });
      toast({
        title: "Saved!",
        description: "Note added to your collection",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  }, [userProfile?.id]);

  const unsaveNote = useCallback(async (noteId: string) => {
    if (!userProfile?.id) return;

    try {
      await notesService.unsaveNote(noteId, userProfile.id);
      setSavedNotes(prev => prev.filter(n => n.id !== noteId));
      toast({
        title: "Removed",
        description: "Note removed from your collection",
      });
    } catch (error) {
      console.error("Error unsaving note:", error);
      toast({
        title: "Error",
        description: "Failed to remove note",
        variant: "destructive",
      });
    }
  }, [userProfile?.id]);

  const toggleSave = useCallback(async (note: { id: string; title: string; subject: string }) => {
    if (isNoteSaved(note.id)) {
      await unsaveNote(note.id);
    } else {
      await saveNote(note);
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
        loading,
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
