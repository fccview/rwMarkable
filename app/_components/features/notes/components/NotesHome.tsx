"use client";

import { Plus, FileText, FolderOpen, BookOpen } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Note, Category } from "@/app/_types";
import { StatsCard } from "@/app/_components/ui/elements/statsCard";
import { EmptyState } from "@/app/_components/ui/cards/EmptyState";
import { NoteCard } from "@/app/_components/ui/cards/NoteCard";

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
  const recentDocs = [...notes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 12);

  const totalCategories = categories.length;

  if (notes.length === 0) {
    return (
      <div className="flex-1 overflow-auto bg-background h-full">
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title="No notes yet"
          description="Create your first note to get started with your knowledge base."
          buttonText="Create New Note"
          onButtonClick={onCreateModal}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background h-full">
      <div className="max-w-full p-4 lg:p-8">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentDocs.map((doc) => (
              <NoteCard key={doc.id} note={doc} onSelect={onSelectDoc} />
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
    </div>
  );
}
