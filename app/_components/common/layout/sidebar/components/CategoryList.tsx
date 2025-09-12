"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  MoreHorizontal,
  Plus,
  FileText,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { cn } from "@/app/_utils/utils";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/app/_components/ui/elements/dropdown-menu";
import { Category, Checklist, Note } from "@/app/_types";

interface CategoryListProps {
  categories: Category[];
  items: (Checklist | Note)[];
  collapsedCategories: Set<string>;
  onToggleCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onRenameCategory: (categoryName: string) => void;
  onQuickCreate: (categoryName: string) => void;
  onItemClick: (item: Checklist | Note) => void;
  isItemSelected: (item: Checklist | Note) => boolean;
  mode: "checklists" | "docs";
}

export function CategoryList({
  categories,
  items,
  collapsedCategories,
  onToggleCategory,
  onDeleteCategory,
  onRenameCategory,
  onQuickCreate,
  onItemClick,
  isItemSelected,
  mode,
}: CategoryListProps) {
  const getItemsInCategory = (categoryName: string) => {
    return items.filter(
      (item) =>
        (item.category || "Uncategorized") === categoryName && !item.isShared
    );
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const categoryItems = getItemsInCategory(category.name);
        const isCollapsed = collapsedCategories.has(category.name);
        const hasItems = categoryItems.length > 0;

        return (
          <div key={category.name} className="space-y-1">
            <div className="flex items-center justify-between group">
              <button
                onClick={() => onToggleCategory(category.name)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left",
                  hasItems
                    ? "hover:bg-muted/50 cursor-pointer"
                    : "text-muted-foreground cursor-default"
                )}
              >
                {hasItems ? (
                  isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )
                ) : (
                  <div className="w-4" />
                )}
                <Folder className="h-4 w-4" />
                <span className="truncate">{category.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {categoryItems.length}
                </span>
              </button>

              <DropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
                align="right"
              >
                <DropdownMenuItem
                  onClick={() => onQuickCreate(category.name)}
                  icon={<Plus className="h-4 w-4" />}
                >
                  New {mode === "checklists" ? "Checklist" : "Note"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onRenameCategory(category.name)}
                >
                  Rename Category
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteCategory(category.name)}
                  variant="destructive"
                >
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenu>
            </div>

            {!isCollapsed && hasItems && (
              <div className="ml-6 space-y-1">
                {categoryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left truncate",
                      isItemSelected(item)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    {mode === "docs" ? (
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
