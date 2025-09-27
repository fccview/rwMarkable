import { Timer } from "lucide-react";
import { Item } from "@/app/_types";
import { formatTime } from "@/app/_utils/checklist-utils";

interface TaskSpecificDetailsProps {
  items: Item[];
}

export function TaskSpecificDetails({ items }: TaskSpecificDetailsProps) {
  const statusCounts = items.reduce(
    (acc, item) => {
      const status = item.status || "todo";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {
      todo: 0,
      in_progress: 0,
      completed: 0,
      paused: 0,
    } as Record<string, number>
  );

  const totalTimeSpent = items.reduce((total, item) => {
    const itemTotal =
      item.timeEntries?.reduce(
        (sum, entry) => sum + (entry.duration || 0),
        0
      ) || 0;
    return total + itemTotal;
  }, 0);

  return (
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
            {statusCounts.in_progress} In Progress
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
            <span className="text-muted-foreground">Total time: </span>
            <span className="font-medium text-purple-600">
              {formatTime(totalTimeSpent)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
