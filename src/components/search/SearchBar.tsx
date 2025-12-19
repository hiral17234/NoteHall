import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  subject: string;
  author: string;
  branch?: string;
  topic?: string;
}

interface SearchBarProps {
  notes: Note[];
  onSelectNote?: (note: Note) => void;
  onSearch?: (query: string, results: Note[]) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  notes, 
  onSelectNote, 
  onSearch,
  placeholder = "Search notes, subjects, topics...",
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Note[]>([]);
  const debouncedQuery = useDebounce(query, 200);
  const containerRef = useRef<HTMLDivElement>(null);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      onSearch?.("", []);
      return;
    }

    setIsSearching(true);
    const normalizedQuery = debouncedQuery.toLowerCase();

    const filtered = notes.filter(note => {
      const title = (note.title || "").toLowerCase();
      const subject = (note.subject || "").toLowerCase();
      const author = (note.author || "").toLowerCase();
      const topic = (note.topic || "").toLowerCase();
      const branch = (note.branch || "").toLowerCase();

      return (
        title.includes(normalizedQuery) ||
        subject.includes(normalizedQuery) ||
        author.includes(normalizedQuery) ||
        topic.includes(normalizedQuery) ||
        branch.includes(normalizedQuery)
      );
    });

    setResults(filtered);
    setIsSearching(false);
    onSearch?.(debouncedQuery, filtered);
  }, [debouncedQuery, notes, onSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSelect = (note: Note) => {
    onSelectNote?.(note);
    setIsOpen(false);
    setQuery("");
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    onSearch?.("", []);
  };

  return (
    <div ref={containerRef} className={cn("relative flex-1", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 bg-background border-border"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching for subjects, topics, or authors</p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </div>
              {results.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelect(note)}
                  className="w-full px-3 py-2 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="p-1.5 rounded bg-primary/10 text-primary mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground line-clamp-1">
                      {highlightMatch(note.title, query)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                      <span>{highlightMatch(note.subject, query)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {highlightMatch(note.author, query)}
                      </span>
                    </div>
                    {note.topic && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {highlightMatch(note.topic, query)}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
