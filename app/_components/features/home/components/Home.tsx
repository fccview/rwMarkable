"use client";

import {
  CheckCircle,
  Folder,
  Plus,
  TrendingUp,
  Clock,
  BarChart3,
  CheckSquare,
  Timer,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Checklist, Item } from "@/app/_types";
import { StatsCard } from "@/app/_components/ui/elements/statsCard";
import { formatRelativeTime } from "@/app/_utils/date-utils";

interface HomeViewProps {
  lists: Checklist[];
  onCreateModal: () => void;
  onSelectChecklist?: (id: string) => void;
}

export function HomeView({
  lists,
  onCreateModal,
  onSelectChecklist,
}: HomeViewProps) {
  const totalItems = lists.reduce((sum, list) => sum + list.items.length, 0);
  const completedItems = lists.reduce((sum, list) => {
    return (
      sum +
      list.items.filter((item) => {
        if (list.type === "task") {
          return item.status === "completed";
        }
        return item.completed;
      }).length
    );
  }, 0);
  const completionRate =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const getCompletionRate = (items: Item[], checklistType?: string) => {
    const total = items.length;
    if (total === 0) return 0;
    const completed = items.filter((item) => {
      if (checklistType === "task") {
        return item.status === "completed";
      }
      return item.completed;
    }).length;
    return Math.round((completed / total) * 100);
  };

  const recentLists = [...lists]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 12);

  const simpleLists = recentLists.filter((list) => list.type === "simple");
  const taskLists = recentLists.filter((list) => list.type === "task");

  const getTaskStatusCounts = (items: Item[]) => {
    const todo = items.filter(
      (item) => item.status === "todo" || !item.status
    ).length;
    const inProgress = items.filter(
      (item) => item.status === "in_progress"
    ).length;
    const completed = items.filter(
      (item) => item.status === "completed"
    ).length;
    const paused = items.filter((item) => item.status === "paused").length;
    return { todo, inProgress, completed, paused };
  };

  const getTotalTimeSpent = (items: Item[]) => {
    return items.reduce((total, item) => {
      if (item.timeEntries && item.timeEntries.length > 0) {
        const itemTotal = item.timeEntries.reduce((sum, entry) => {
          return sum + (entry.duration || 0);
        }, 0);
        return total + itemTotal;
      }
      return total;
    }, 0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {lists.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Folder className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No checklists yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            Create your first checklist to get started. You can organize your
            tasks, track progress, and more.
          </p>
          <Button onClick={onCreateModal} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create New Checklist
          </Button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Welcome Back
              </h1>
              <p className="text-lg text-muted-foreground">
                Your most recently updated checklists
              </p>
            </div>
            <Button onClick={onCreateModal} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Checklist
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={<Folder className="h-6 w-6 text-primary" />}
              header="Total Lists"
              value={lists.length}
            />
            <StatsCard
              icon={<CheckCircle className="h-6 w-6 text-primary" />}
              header="Completed"
              value={completedItems}
            />
            <StatsCard
              icon={<TrendingUp className="h-6 w-6 text-primary" />}
              header="Progress"
              value={`${completionRate}%`}
            />
            <StatsCard
              icon={<Clock className="h-6 w-6 text-primary" />}
              header="Total Items"
              value={totalItems}
            />
          </div>

          {taskLists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Tasks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {taskLists.map((list) => {
                  const statusCounts = getTaskStatusCounts(list.items);
                  const totalTimeSpent = getTotalTimeSpent(list.items);
                  return (
                    <div
                      key={list.id}
                      onClick={() => onSelectChecklist?.(list.id)}
                      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate pr-2">
                          {list.title}
                        </h3>
                        {list.category && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex-shrink-0">
                            {list.category}
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>
                            {getCompletionRate(list.items, list.type)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all duration-300"
                            style={{
                              width: `${getCompletionRate(
                                list.items,
                                list.type
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            <span className="text-muted-foreground">
                              {statusCounts.todo} Todo
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-muted-foreground">
                              {statusCounts.inProgress} In Progress
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-muted-foreground">
                              {statusCounts.completed} Done
                            </span>
                          </div>
                          {statusCounts.paused > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-muted-foreground">
                                {statusCounts.paused} Paused
                              </span>
                            </div>
                          )}
                        </div>

                        {totalTimeSpent > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-1 text-xs">
                              <Timer className="h-3 w-3 text-purple-500" />
                              <span className="text-muted-foreground">
                                Total time:{" "}
                              </span>
                              <span className="font-medium text-purple-600">
                                {formatTime(totalTimeSpent)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>
                            {statusCounts.completed}/{list.items.length}{" "}
                            completed
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(list.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {simpleLists.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Simple Checklists
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {simpleLists.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => onSelectChecklist?.(list.id)}
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate pr-2">
                        {list.title}
                      </h3>
                      {list.category && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex-shrink-0">
                          {list.category}
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{getCompletionRate(list.items, list.type)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{
                            width: `${getCompletionRate(
                              list.items,
                              list.type
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>
                          {list.items.filter((item) => item.completed).length}/
                          {list.items.length} done
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(list.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lists.length > 12 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Showing {recentLists.length} of {lists.length} checklists. Use
                the sidebar to browse all or search above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
