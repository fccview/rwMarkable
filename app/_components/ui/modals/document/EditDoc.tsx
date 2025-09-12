"use client";

import { useState, useEffect } from "react";
import { X, FileText, Plus } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import {
  updateDocAction,
  createDocsCategoryAction,
} from "@/app/_server/actions/data/docs-actions";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import { Note, Category } from "@/app/_types";
import { Modal } from "../../elements/modal";

interface EditDocModalProps {
  doc: Note;
  onClose: () => void;
  onUpdated: () => void;
  categories: Category[];
}

export function EditDocModal({
  doc,
  onClose,
  onUpdated,
  categories,
}: EditDocModalProps) {
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category || "");
  const [newCategory, setNewCategory] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setTitle(doc.title);
    setCategory(doc.category || "");
  }, [doc]);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user?.username || null);
        setIsOwner(user?.username === doc.owner);
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };
    checkOwnership();
  }, [doc.owner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUpdating(true);

    try {
      if (isOwner && showNewCategory && newCategory.trim()) {
        const categoryFormData = new FormData();
        categoryFormData.append("name", newCategory.trim());
        await createDocsCategoryAction(categoryFormData);
      }

      const formData = new FormData();
      formData.append("id", doc.id);
      formData.append("title", title.trim());
      if (isOwner) {
        formData.append(
          "category",
          showNewCategory ? newCategory.trim() : category
        );
      }
      formData.append("content", doc.content);

      const result = await updateDocAction(formData);

      if (result.success) {
        onUpdated();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Note"
      titleIcon={<FileText className="h-5 w-5 text-primary" />}
    >
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="text-sm font-medium text-foreground"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="Enter note title..."
            autoFocus
            required
          />
        </div>

        {isOwner && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Category
              </label>
              <div className="flex gap-2">
                <select
                  value={showNewCategory ? "" : category}
                  onChange={(e) => {
                    if (e.target.value === "new") {
                      setShowNewCategory(true);
                      setCategory("");
                    } else {
                      setShowNewCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="new">+ Create New Category</option>
                </select>
              </div>
            </div>

            {showNewCategory && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  New Category Name
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Enter new category name..."
                />
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || isUpdating}
            className="flex-1"
          >
            {isUpdating ? "Updating..." : "Update Note"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
