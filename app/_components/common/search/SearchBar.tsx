"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/app/_utils/utils";
import { Checklist, Note, AppMode } from "@/app/_types";
import { SearchInput } from "./components/SearchInput";
import { SearchResults } from "./components/SearchResults";

interface SearchResult {
  id: string;
  title: string;
  type: "checklist" | "doc";
  content?: string;
  category?: string;
  owner?: string;
  isShared?: boolean;
}

interface SearchBarProps {
  mode: AppMode;
  checklists: Checklist[];
  docs: Note[];
  onModeChange?: (mode: AppMode) => void;
  className?: string;
}

export function SearchBar({
  mode,
  checklists,
  docs,
  onModeChange,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      const query = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      checklists.forEach((checklist) => {
        const titleMatch = checklist.title.toLowerCase().includes(query);
        const contentMatch = checklist.items.some((item) =>
          item.text.toLowerCase().includes(query)
        );

        if (titleMatch || contentMatch) {
          searchResults.push({
            id: checklist.id,
            title: checklist.title,
            type: "checklist",
            content: checklist.items.map((item) => item.text).join(" "),
            category: checklist.category,
            owner: checklist.owner,
            isShared: checklist.isShared,
          });
        }
      });

      docs.forEach((doc) => {
        const titleMatch = doc.title.toLowerCase().includes(query);
        const contentMatch = doc.content?.toLowerCase().includes(query);

        if (titleMatch || contentMatch) {
          searchResults.push({
            id: doc.id,
            title: doc.title,
            type: "doc",
            content: doc.content,
            category: doc.category,
            owner: doc.owner,
            isShared: doc.isShared,
          });
        }
      });

      searchResults.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(query);
        const bTitle = b.title.toLowerCase().includes(query);
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
        return 0;
      });

      setResults(searchResults.slice(0, 8));
    },
    [checklists, docs]
  );

  useEffect(() => {
    performSearch(query);
    setSelectedIndex(0);
  }, [query, performSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter" && results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === "checklist") {
      if (mode === "notes" && onModeChange) {
        onModeChange("checklists");
      }
      router.push(`/checklist/${result.id}`);
    } else {
      if (mode === "checklists" && onModeChange) {
        onModeChange("notes");
      }
      router.push(`/note/${result.id}`);
    }
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <SearchInput
        query={query}
        onQueryChange={setQuery}
        onClear={() => {
          setIsOpen(false);
          setQuery("");
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
            setQuery("");
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < results.length - 1 ? prev + 1 : 0
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : results.length - 1
            );
          } else if (e.key === "Enter" && results.length > 0) {
            e.preventDefault();
            handleSelectResult(results[selectedIndex]);
          }
        }}
        placeholder={`Search ${mode}...`}
        inputRef={inputRef}
        className={cn("transition-all", isOpen && "border-primary shadow-md")}
      />

      {isOpen && (query || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg z-50 max-h-[70vh] md:max-h-80">
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onSelectResult={handleSelectResult}
            query={query}
          />
        </div>
      )}
    </div>
  );
}
