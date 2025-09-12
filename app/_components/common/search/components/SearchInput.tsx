"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { cn } from "@/app/_utils/utils";

interface SearchInputProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function SearchInput({
  query,
  onQueryChange,
  onClear,
  onFocus,
  onKeyDown,
  placeholder = "Search checklists and notes...",
  className,
  inputRef,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
