"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  MoreHorizontal,
  Plus,
  FileText,
  CheckSquare,
  BarChart3,
  Edit,
  Users,
  Globe,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { cn } from "@/app/_utils/utils";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/app/_components/ui/elements/dropdown-menu";
import { Category, Checklist, Note } from "@/app/_types";
import { SidebarItem } from "./SidebarItem";

interface SharingStatus {
  isShared: boolean;
  isPubliclyShared: boolean;
  sharedWith: string[];
}

interface CategoryListProps {
  categories: Category[];
  items: (Checklist | Note)[];
  collapsedCategories: Set<string>;
  onToggleCategory: (categoryName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
  onRenameCategory: (categoryName: string) => void;
  onQuickCreate: (categoryName: string) => void;
  onCreateSubcategory?: (categoryPath: string) => void;
  onItemClick: (item: Checklist | Note) => void;
  onEditItem?: (item: Checklist | Note) => void;
  isItemSelected: (item: Checklist | Note) => boolean;
  mode: "checklists" | "notes";
  getSharingStatus: (itemId: string) => SharingStatus | null;
}

export function CategoryList({
  categories,
  items,
  collapsedCategories,
  onToggleCategory,
  onDeleteCategory,
  onRenameCategory,
  onQuickCreate,
  onCreateSubcategory,
  onItemClick,
  onEditItem,
  isItemSelected,
  mode,
  getSharingStatus,
}: CategoryListProps) {
  const getItemsInCategory = (categoryPath: string) => {
    return items.filter(
      (item) =>
        (item.category || "Uncategorized") === categoryPath && !item.isShared
    );
  };

  const getSubCategories = (parentPath: string) => {
    return categories.filter((cat) => cat.parent === parentPath);
  };

  const getTotalItemsInCategory = (categoryPath: string): number => {
    const directItems = getItemsInCategory(categoryPath).length;
    const subCategories = getSubCategories(categoryPath);
    const subCategoryItems = subCategories.reduce((total, subCategory) => {
      return total + getTotalItemsInCategory(subCategory.path);
    }, 0);
    return directItems + subCategoryItems;
  };

  const renderCategory = (category: Category) => {
    const categoryItems = getItemsInCategory(category.path);
    const isCollapsed = collapsedCategories.has(category.path);
    const hasItems = categoryItems.length > 0;
    const subCategories = getSubCategories(category.path);
    const hasSubCategories = subCategories.length > 0;
    const totalItems = getTotalItemsInCategory(category.path);

    return (
      <div key={category.path} className="space-y-1">
        <div className="flex items-center justify-between group">
          <button
            onClick={() => onToggleCategory(category.path)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left",
              hasItems || hasSubCategories
                ? "hover:bg-muted/50 cursor-pointer"
                : "text-muted-foreground cursor-default"
            )}
            style={{ paddingLeft: `${12 + category.level * 16}px` }}
          >
            {hasItems || hasSubCategories ? (
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
              {totalItems}
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
              onClick={() => onQuickCreate(category.path)}
              icon={<Plus className="h-4 w-4" />}
            >
              New {mode === "checklists" ? "Checklist" : "Note"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCreateSubcategory?.(category.path)}
              icon={<Folder className="h-4 w-4" />}
            >
              Create Subcategory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameCategory(category.path)}>
              Rename Category
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteCategory(category.path)}
              variant="destructive"
            >
              Delete Category
            </DropdownMenuItem>
          </DropdownMenu>
        </div>

        {!isCollapsed && (
          <>
            {hasSubCategories && (
              <div className="space-y-1 ml-2 border-l border-border/30 pl-2">
                {subCategories.map((subCategory) =>
                  renderCategory(subCategory)
                )}
              </div>
            )}
            {hasItems && (
              <div className="space-y-0.5 ml-2 border-l border-border/30 pl-2">
                {categoryItems.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    mode={mode}
                    isSelected={isItemSelected(item)}
                    onItemClick={onItemClick}
                    onEditItem={onEditItem}
                    sharingStatus={getSharingStatus(item.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  const rootCategories = categories.filter((cat) => !cat.parent);

  return (
    <div className="space-y-1">
      {rootCategories.map((category) => renderCategory(category))}
    </div>
  );
}
