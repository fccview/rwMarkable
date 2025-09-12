"use client";

import {
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/app/_utils/utils";
import { Checklist, Note } from "@/app/_types";

interface SharedItemsListProps {
  items: (Checklist | Note)[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onItemClick: (item: Checklist | Note) => void;
  isItemSelected: (item: Checklist | Note) => boolean;
  mode: "checklists" | "docs";
}

export function SharedItemsList({
  items,
  collapsed,
  onToggleCollapsed,
  onItemClick,
  isItemSelected,
  mode,
}: SharedItemsListProps) {
  const sharedItems = items.filter((item) => item.isShared);

  if (sharedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between group">
        <button
          onClick={onToggleCollapsed}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left",
            "hover:bg-muted/50 cursor-pointer"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <Users className="h-4 w-4 text-primary" />
          <span className="truncate font-medium text-primary">
            Shared with you
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {sharedItems.length}
          </span>
        </button>
      </div>

      {!collapsed && (
        <div className="ml-6 space-y-1">
          {sharedItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-full text-left truncate group/item",
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
              <div className="flex-1 min-w-0">
                <div className="truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  by {item.owner}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
