"use client";

import { Plus, FileText, Clock, FolderOpen, BookOpen } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Note, Category } from "@/app/_types";
import { StatsCard } from "@/app/_components/ui/elements/statsCard";
import { formatRelativeTime } from "@/app/_utils/date-utils";

interface NotesHomeViewProps {
  notes: Note[];
  categories: Category[];
  onCreateModal: () => void;
  onSelectDoc: (id: string) => void;
}

export function NotesHomeView({
  notes,
  categories,
  onCreateModal,
  onSelectDoc,
}: NotesHomeViewProps) {
  const getPreview = (content: string) => {
    const plainText = content
      .replace(/[#*_`~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    return plainText.length > 100
      ? plainText.substring(0, 100) + "..."
      : plainText;
  };

  const recentDocs = [...notes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 12);

  const totalCategories = categories.length;

  return (
    <div className="flex-1 overflow-auto bg-background h-full">
      {notes.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No notes yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            Create your first note to get started with your knowledge base.
          </p>
          <Button onClick={onCreateModal} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create New Note
          </Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Notes
              </h1>
              <p className="text-lg text-muted-foreground">
                Your most recently updated notes
              </p>
            </div>
            <Button onClick={onCreateModal} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Note
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={<FileText className="h-6 w-6 text-primary" />}
              header="Total Docs"
              value={notes.length}
            />
            <StatsCard
              icon={<FolderOpen className="h-6 w-6 text-primary" />}
              header="Categories"
              value={totalCategories}
            />
            <StatsCard
              icon={<BookOpen className="h-6 w-6 text-primary" />}
              header="Notes"
              value="Active"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Recent Notes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 group relative"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate pr-2">
                        {doc.title}
                      </h3>
                      {doc.category && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex-shrink-0 ml-2">
                          {doc.category}
                        </span>
                      )}
                    </div>

                    {doc.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {getPreview(doc.content)}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>Note</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(doc.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {notes.length > 12 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Showing {recentDocs.length} of {notes.length} notes. Use the
                sidebar to browse all or search above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
