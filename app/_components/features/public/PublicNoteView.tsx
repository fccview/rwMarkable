"use client";

import { Note } from "@/app/_types";
import { FileText, User, Clock } from "lucide-react";
import { UnifiedMarkdownRenderer } from "@/app/_components/features/notes/components/UnifiedMarkdownRenderer";

interface PublicNoteViewProps {
  note: Note;
}

export function PublicNoteView({ note }: PublicNoteViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {note.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>by {note.owner}</span>
                </div>
                {note.category && <span>• {note.category}</span>}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <UnifiedMarkdownRenderer content={note.content} />
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            This note is shared publicly by {note.owner}
          </p>
        </div>
      </div>
    </div>
  );
}
