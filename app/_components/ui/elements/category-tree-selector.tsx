"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/app/_utils/utils";
import { Category } from "@/app/_types";

interface CategoryTreeSelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryPath: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryTreeSelector({
  categories,
  selectedCategory,
  onCategorySelect,
  placeholder = "Select category...",
  className,
}: CategoryTreeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const getRootCategories = () => {
    return categories.filter(cat => !cat.parent);
  };

  const getSubCategories = (parentPath: string) => {
    return categories.filter(cat => cat.parent === parentPath);
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return placeholder;
    const category = categories.find(cat => cat.path === selectedCategory);
    return category ? category.name : selectedCategory;
  };

  const toggleExpanded = (categoryPath: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryPath)) {
        newSet.delete(categoryPath);
      } else {
        newSet.add(categoryPath);
      }
      return newSet;
    });
  };

  const handleCategoryClick = (categoryPath: string) => {
    onCategorySelect(categoryPath);
    setIsOpen(false);
  };

  const renderCategoryNode = (category: Category) => {
    const subCategories = getSubCategories(category.path);
    const isExpanded = expandedCategories.has(category.path);
    const hasSubCategories = subCategories.length > 0;

    return (
      <div key={category.path} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
            selectedCategory === category.path && "bg-primary/10 text-primary"
          )}
          style={{ paddingLeft: `${12 + category.level * 20}px` }}
          onClick={() => handleCategoryClick(category.path)}
        >
          {hasSubCategories ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.path);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}

          <span className="truncate">{category.name}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {category.count}
          </span>
        </div>

        {isExpanded && hasSubCategories && (
          <div className="ml-2">
            {subCategories.map(subCategory => renderCategoryNode(subCategory))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-2 text-left text-sm bg-background border border-input rounded-md",
          "hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "flex items-center gap-2"
        )}
      >
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="truncate">{getSelectedCategoryName()}</span>
        <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedCategory === "" && "bg-primary/10 text-primary"
                )}
                onClick={() => handleCategoryClick("")}
              >
                <div className="w-4" />
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>Uncategorized</span>
              </div>

              {getRootCategories().map(category => renderCategoryNode(category))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
