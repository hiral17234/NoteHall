import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SearchResult {
  id: string;
  title: string;
  subject: string;
  author: string;
  type: "note" | "user" | "request";
  matchedField?: string;
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  search: (query: string, data: any[]) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback((searchQuery: string, data: any[]) => {
    setIsSearching(true);
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    if (!normalizedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce-like delay for UX
    setTimeout(() => {
      const filtered = data.filter(item => {
        const title = (item.title || "").toLowerCase();
        const subject = (item.subject || "").toLowerCase();
        const author = (item.author || "").toLowerCase();
        const topic = (item.topic || "").toLowerCase();
        const branch = (item.branch || "").toLowerCase();

        return (
          title.includes(normalizedQuery) ||
          subject.includes(normalizedQuery) ||
          author.includes(normalizedQuery) ||
          topic.includes(normalizedQuery) ||
          branch.includes(normalizedQuery)
        );
      }).map(item => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        author: item.author,
        type: "note" as const,
        matchedField: getMatchedField(item, normalizedQuery),
      }));

      setResults(filtered);
      setIsSearching(false);
    }, 150);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsSearching(false);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        isSearching,
        search,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

function getMatchedField(item: any, query: string): string {
  if ((item.title || "").toLowerCase().includes(query)) return "title";
  if ((item.subject || "").toLowerCase().includes(query)) return "subject";
  if ((item.author || "").toLowerCase().includes(query)) return "author";
  if ((item.topic || "").toLowerCase().includes(query)) return "topic";
  if ((item.branch || "").toLowerCase().includes(query)) return "branch";
  return "title";
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
