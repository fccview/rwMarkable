"use client";

import { CheckSquare, FileText } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { cn } from "@/app/_utils/utils";
import { AppMode } from "@/app/_types";

interface SidebarNavigationProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function SidebarNavigation({
  mode,
  onModeChange,
}: SidebarNavigationProps) {
  const modes = [
    {
      id: "checklists" as AppMode,
      label: "Checklists",
      icon: CheckSquare,
    },
    {
      id: "docs" as AppMode,
      label: "Notes",
      icon: FileText,
    },
  ];

  return (
    <div className="flex gap-1 p-2 border-b border-border">
      {modes.map((modeOption) => {
        const Icon = modeOption.icon;
        return (
          <Button
            key={modeOption.id}
            variant={mode === modeOption.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onModeChange(modeOption.id)}
            className={cn(
              "flex-1 justify-start gap-2",
              mode === modeOption.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {modeOption.label}
          </Button>
        );
      })}
    </div>
  );
}
