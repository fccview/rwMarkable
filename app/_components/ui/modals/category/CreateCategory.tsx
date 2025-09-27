"use client";

import { useState } from "react";
import { createCategoryAction } from "@/app/_server/actions/data/actions";
import { createDocsCategoryAction } from "@/app/_server/actions/data/notes-actions";
import { Button } from "@/app/_components/ui/elements/button";
import { CategoryTreeSelector } from "@/app/_components/ui/elements/category-tree-selector";
import { Modal } from "@/app/_components/ui/elements/modal";
import { Folder } from "lucide-react";
import { useToast } from "@/app/_providers/ToastProvider";
import { AppMode, Category } from "@/app/_types";

interface CreateCategoryModalProps {
  onClose: () => void;
  onCreated: (category?: { name: string; count: number }) => void;
  mode?: AppMode;
  categories?: Category[];
  initialParent?: string;
}

export function CreateCategoryModal({
  onClose,
  onCreated,
  mode = "checklists",
  categories = [],
  initialParent = "",
}: CreateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [parentCategory, setParentCategory] = useState(initialParent);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!categoryName.trim()) return;

    const formData = new FormData();
    formData.append("name", categoryName.trim());
    if (parentCategory) {
      formData.append("parent", parentCategory);
    }

    const result =
      mode === "notes"
        ? await createDocsCategoryAction(formData)
        : await createCategoryAction(formData);

    if (result.success) {
      showToast({
        type: "success",
        title: "Category created successfully!",
      });
      onCreated({ name: categoryName.trim(), count: 0 });
      onClose();
    } else {
      showToast({
        type: "error",
        title: "Failed to create category",
        message:
          result.error || "An error occurred while creating the category.",
      });
    }
    setIsLoading(false);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create New Category"
      titleIcon={<Folder className="h-5 w-5 text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Parent Category (Optional)
          </label>
          <CategoryTreeSelector
            categories={categories}
            selectedCategory={parentCategory}
            onCategorySelect={setParentCategory}
            placeholder="No parent (root level)"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Category Name *
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Enter category name..."
            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-border text-foreground hover:bg-muted/50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !categoryName.trim()}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
