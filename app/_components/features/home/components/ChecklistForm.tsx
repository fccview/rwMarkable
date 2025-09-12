"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";

interface ChecklistFormProps {
  onSubmit: (text: string) => void;
  onBulkSubmit?: (itemsText: string) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  focusKey?: number;
}

export function ChecklistForm({
  onSubmit,
  onBulkSubmit,
  isLoading = false,
  autoFocus = false,
  focusKey = 0,
}: ChecklistFormProps) {
  const [newItemText, setNewItemText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    onSubmit(newItemText.trim());
    setNewItemText("");
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusKey]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 lg:p-6">
      <input
        ref={inputRef}
        type="text"
        value={newItemText}
        onChange={(e) => setNewItemText(e.target.value)}
        placeholder="Add new item..."
        className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        disabled={isLoading}
      />
      {onBulkSubmit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onBulkSubmit("")}
          disabled={isLoading}
          title="Bulk add items"
        >
          <ClipboardList className="h-4 w-4" />
        </Button>
      )}
      <Button
        type="submit"
        size="sm"
        disabled={isLoading || !newItemText.trim()}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
