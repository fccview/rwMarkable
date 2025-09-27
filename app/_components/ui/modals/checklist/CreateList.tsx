"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Folder,
  ListTodo,
  Plus,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import {
  createListAction,
  createCategoryAction,
} from "@/app/_server/actions/data/actions";
import { Checklist, ChecklistType } from "@/app/_types";
import { Button } from "@/app/_components/ui/elements/button";
import { CategoryTreeSelector } from "@/app/_components/ui/elements/category-tree-selector";
import { Modal } from "@/app/_components/ui/elements/modal";

interface Category {
  name: string;
  count: number;
  path: string;
  parent?: string;
  level: number;
}

interface CreateListModalProps {
  onClose: () => void;
  onCreated: (checklist?: Checklist) => void;
  categories: Category[];
  initialCategory?: string;
}

export function CreateListModal({
  onClose,
  onCreated,
  categories,
  initialCategory = "",
}: CreateListModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [type, setType] = useState<ChecklistType>("simple");
  const [isLoading, setIsLoading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);

    try {
      if (showNewCategory && newCategory.trim()) {
        const categoryFormData = new FormData();
        categoryFormData.append("name", newCategory.trim());
        if (category) {
          categoryFormData.append("parent", category);
        }
        await createCategoryAction(categoryFormData);
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append(
        "category",
        showNewCategory ? (category ? `${category}/${newCategory.trim()}` : newCategory.trim()) : category || ""
      );
      formData.append("type", type);

      const result = await createListAction(formData);

      if (result.success && result.data) {
        onCreated(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create New Checklist"
      titleIcon={<ListTodo className="h-5 w-5 text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Checklist Name *
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter checklist name..."
            className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Checklist Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("simple")}
              className={`p-4 rounded-lg border-2 transition-all ${type === "simple"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
                }`}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center gap-2">
                <CheckSquare className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium text-sm">Simple Checklist</div>
                  <div className="text-xs text-muted-foreground">
                    Basic todo items
                  </div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setType("task")}
              className={`p-4 rounded-lg border-2 transition-all ${type === "task"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
                }`}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium text-sm">Task Project</div>
                  <div className="text-xs text-muted-foreground">
                    With time tracking
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Category
          </label>
          {!showNewCategory ? (
            <div className="flex gap-2 items-center">
              <CategoryTreeSelector
                categories={categories}
                selectedCategory={category}
                onCategorySelect={setCategory}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCategory(true)}
                className="px-3"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Enter new category name..."
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategory("");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                New category will be created in: {category ? categories.find(cat => cat.path === category)?.name || category : "Root level"}
              </div>
            </div>
          )}
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
            disabled={isLoading || !title.trim()}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Creating..." : "Create Checklist"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
