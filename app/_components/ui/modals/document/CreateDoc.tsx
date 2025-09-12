"use client";

import { useState } from "react";
import { X, FileText, Plus, Folder, FileText as DocIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Dropdown } from "@/app/_components/ui/elements/dropdown";
import {
  createDocAction,
  createDocsCategoryAction,
} from "@/app/_server/actions/data/docs-actions";
import { Category, Note } from "@/app/_types";
import { Modal } from "../../elements/modal";

interface CreateDocModalProps {
  onClose: () => void;
  onCreated: (doc?: Note) => void;
  categories: Category[];
  initialCategory?: string;
}

export function CreateDocModal({
  onClose,
  onCreated,
  categories,
  initialCategory = "",
}: CreateDocModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [newCategory, setNewCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);

  const categoryOptions = [
    { id: "", name: "Uncategorized", icon: DocIcon },
    ...categories.map((cat) => ({
      id: cat.name,
      name: `${cat.name} (${cat.count})`,
      icon: Folder,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);

    try {
      if (showNewCategory && newCategory.trim()) {
        const categoryFormData = new FormData();
        categoryFormData.append("name", newCategory.trim());
        await createDocsCategoryAction(categoryFormData);
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append(
        "category",
        showNewCategory ? newCategory.trim() : category
      );
      formData.append("content", "");

      const result = await createDocAction(formData);

      if (result.success && result.data) {
        onCreated(result.data);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create New Note"
      titleIcon={<FileText className="h-5 w-5 text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <label
            htmlFor="category"
            className="text-sm font-medium text-foreground"
          >
            Category
          </label>
          {!showNewCategory ? (
            <div className="flex gap-2">
              <Dropdown
                value={category}
                options={categoryOptions}
                onChange={setCategory}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCategory(true)}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter new category name..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategory("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

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
            disabled={!title.trim() || isCreating}
            className="flex-1"
          >
            {isCreating ? "Creating..." : "Create Note"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
