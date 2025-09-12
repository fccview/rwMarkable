"use client";

import { useState, useEffect } from "react";
import { Folder, ListTodo } from "lucide-react";
import { updateListAction } from "@/app/_server/actions/data/actions";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import { Button } from "@/app/_components/ui/elements/button";
import { Dropdown } from "@/app/_components/ui/elements/dropdown";
import { Modal } from "@/app/_components/ui/elements/modal";

interface Category {
  name: string;
  count: number;
}

interface EditChecklistModalProps {
  checklist: {
    id: string;
    title: string;
    category?: string;
    owner?: string;
    isShared?: boolean;
  };
  categories: Category[];
  onClose: () => void;
  onUpdated: () => void;
}

export function EditChecklistModal({
  checklist,
  categories,
  onClose,
  onUpdated,
}: EditChecklistModalProps) {
  const [title, setTitle] = useState(checklist.title);
  const [category, setCategory] = useState(checklist.category || "");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user?.username || null);
        setIsOwner(user?.username === checklist.owner);
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };
    checkOwnership();
  }, [checklist.owner]);

  const categoryOptions = [
    { id: "", name: "Uncategorized", icon: ListTodo },
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
    formData.append("id", checklist.id);
    formData.append("title", title.trim());
    if (isOwner) {
      formData.append("category", category || "");
    }
    const result = await updateListAction(formData);
    setIsLoading(false);

    if (result.success) {
      onUpdated();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Checklist"
      titleIcon={<ListTodo className="h-5 w-5 text-primary" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Checklist Name *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter checklist name..."
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
            {isLoading ? "Updating..." : "Update Checklist"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
