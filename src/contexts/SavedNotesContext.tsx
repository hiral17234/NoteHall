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
  // Extracting user to ensure we have the UID for Firestore paths
  const { userProfile, user } = useAuth();
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine the correct ID to use (checks both profile and base auth user)
  const currentUserId = userProfile?.id || userProfile?.uid || user?.uid;

  // Load saved notes from Firestore when user changes
  useEffect(() => {
    const loadSavedNotes = async () => {
      if (!currentUserId) {
        setSavedNotes([]);
        return;
      }

      setLoading(true);
      try {
        const notes = await notesService.getSavedNotes(currentUserId);
        setSavedNotes(notes.map(n => ({
          id: n.id,
          title: n.title,
          subject: n.subject,
          // Safely handle Firebase Timestamps
          savedAt: n.createdAt?.toDate?.()?.toISOString() || n.savedAt || new Date().toISOString(),
        })));
      } catch (error) {
        console.error("Error loading saved notes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedNotes();
  }, [currentUserId]);

  const savedNoteIds = savedNotes.map(n => n.id);

  const isNoteSaved = useCallback((noteId: string) => {
    return savedNoteIds.includes(noteId);
  }, [savedNoteIds]);

  const saveNote = useCallback(async (note: { id: string; title: string; subject: string }) => {
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save notes",
        variant: "destructive",
      });
      return;
    }

    try {
      await notesService.saveNote(note.id, currentUserId);
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
  }, [currentUserId]);

  const unsaveNote = useCallback(async (noteId: string) => {
    if (!currentUserId) return;

    try {
      await notesService.unsaveNote(noteId, currentUserId);
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
  }, [currentUserId]);

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
