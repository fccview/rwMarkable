"use client";

import { useState, useEffect } from "react";
import { FileText, Folder } from "lucide-react";
import { Modal } from "@/app/_components/ui/elements/modal";
import { Button } from "@/app/_components/ui/elements/button";
import { Dropdown } from "@/app/_components/ui/elements/dropdown";
import { updateDocAction } from "@/app/_server/actions/data/notes-actions";
import { getCurrentUser } from "@/app/_server/actions/auth/utils";
import { Note, Category } from "@/app/_types";

interface EditNoteModalProps {
  note: Note;
  categories: Category[];
  onClose: () => void;
  onUpdated: () => void;
}

export function EditNoteModal({
  note,
  categories,
  onClose,
  onUpdated,
}: EditNoteModalProps) {
  const [title, setTitle] = useState(note.title);
  const [category, setCategory] = useState(note.category || "");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user?.username || null);
        setIsOwner(user?.username === note.owner);
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };
    checkOwnership();
  }, [note.owner]);

  const categoryOptions = [
    { id: "", name: "Uncategorized", icon: FileText },
    ...categories.map((cat) => ({
      id: cat.name,
      name: `${cat.name} (${cat.count})`,
      icon: Folder,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("id", note.id);
    formData.append("title", title.trim());
    if (isOwner) {
      formData.append("category", category || "");
    }
    const result = await updateDocAction(formData);
    setIsLoading(false);

    if (result.success) {
      onUpdated();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Note"
      titleIcon={<FileText className="h-5 w-5 text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Note Name *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note name..."
            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            required
            disabled={isLoading}
          />
        </div>

        {isOwner && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <Dropdown
              value={category}
              options={categoryOptions}
              onChange={setCategory}
              className="w-full"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="flex-1"
          >
            {isLoading ? "Updating..." : "Update Note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
