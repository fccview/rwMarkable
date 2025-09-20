"use client";

import { Checklist } from "@/app/_types";
import { CheckSquare, BarChart3, Clock, User } from "lucide-react";
import { cn } from "@/app/_utils/utils";

interface PublicChecklistViewProps {
  checklist: Checklist;
}

export function PublicChecklistView({ checklist }: PublicChecklistViewProps) {
  const completedCount = checklist.items.filter(
    (item) => item.completed
  ).length;
  const totalCount = checklist.items.length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {checklist.type === "task" ? (
              <BarChart3 className="h-8 w-8 text-primary" />
            ) : (
              <CheckSquare className="h-8 w-8 text-primary" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {checklist.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>by {checklist.owner}</span>
                </div>
                {checklist.category && <span>• {checklist.category}</span>}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Updated {new Date(checklist.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} of {totalCount} completed (
                  {progressPercentage}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {checklist.items.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No items yet
              </h3>
              <p className="text-muted-foreground">This checklist is empty.</p>
            </div>
          ) : (
            checklist.items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                  item.completed
                    ? "bg-muted/50 border-muted text-muted-foreground"
                    : "bg-card border-border hover:bg-accent/50"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center",
                      item.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {item.completed && (
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {item.text}
                    </span>
                    {checklist.type === "task" && item.status && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          item.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : item.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "paused"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  {item.timeEntries && item.timeEntries.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Time tracked:{" "}
                      {item.timeEntries.reduce((total, entry) => {
                        const start = new Date(entry.startTime);
                        const end = entry.endTime
                          ? new Date(entry.endTime)
                          : new Date();
                        return total + (end.getTime() - start.getTime());
                      }, 0) /
                        (1000 * 60)}{" "}
                      minutes
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            This checklist is shared publicly by {checklist.owner}
          </p>
        </div>
      </div>
    </div>
  );
}
