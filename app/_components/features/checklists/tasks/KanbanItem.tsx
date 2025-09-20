"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "@/app/_types";
import { cn } from "@/app/_utils/utils";
import {
  Clock,
  Target,
  Play,
  GripVertical,
  Timer,
  Pause,
  Square,
  RotateCcw,
  Circle,
  CheckCircle2,
  PauseCircle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Dropdown } from "@/app/_components/ui/elements/dropdown";
import { useState, useEffect, useRef } from "react";
import {
  updateItemStatusAction,
  updateItemAction,
  deleteItemAction,
} from "@/app/_server/actions/data/actions";

interface TimeEntriesAccordionProps {
  timeEntries: any[];
  totalTime: number;
  formatTimerTime: (seconds: number) => string;
}

function TimeEntriesAccordion({
  timeEntries,
  totalTime,
  formatTimerTime,
}: TimeEntriesAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="border border-border/30 rounded-md bg-muted/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span className="font-medium">{timeEntries.length} sessions</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="font-semibold text-foreground">
            {formatTimerTime(totalTime)}
          </span>
        </span>
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border/30 p-2 space-y-1.5 max-h-32 overflow-y-auto">
          {timeEntries.map((entry, index) => (
            <div
              key={entry.id || index}
              className="bg-background border border-border/20 rounded p-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-foreground">
                  {formatTimerTime(entry.duration || 0)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.startTime).toLocaleTimeString()}
                </span>
              </div>
              {entry.endTime && (
                <div className="text-xs text-muted-foreground/70 mt-0.5">
                  {new Date(entry.startTime).toLocaleDateString()} •{" "}
                  {new Date(entry.endTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface KanbanItemProps {
  item: Item;
  isDragging?: boolean;
  checklistId: string;
  onUpdate?: () => void;
}

export function KanbanItem({
  item,
  isDragging,
  checklistId,
  onUpdate,
}: KanbanItemProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    const existingTime =
      item.timeEntries?.reduce((total, entry) => {
        if (entry.endTime) {
          const start = new Date(entry.startTime).getTime();
          const end = new Date(entry.endTime).getTime();
          return total + (end - start);
        }
        return total;
      }, 0) || 0;
    setTotalTime(Math.floor(existingTime / 1000));
  }, [item.timeEntries]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTimerToggle = async () => {
    if (isRunning) {
      setIsRunning(false);
      if (startTime) {
        const endTime = new Date();
        const newTimeEntry = {
          id: Date.now().toString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: Math.floor(
            (endTime.getTime() - startTime.getTime()) / 1000
          ),
        };

        const updatedTimeEntries = [...(item.timeEntries || []), newTimeEntry];
        const formData = new FormData();
        formData.append("listId", checklistId);
        formData.append("itemId", item.id);
        formData.append("timeEntries", JSON.stringify(updatedTimeEntries));
        await updateItemStatusAction(formData);

        setTotalTime(
          (prev) =>
            prev + Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
        );
        onUpdate?.();
      }
      setStartTime(null);
      setCurrentTime(0);
    } else {
      setIsRunning(true);
      setStartTime(new Date());
      setCurrentTime(0);
    }
  };

  const handleResetTimer = async () => {
    const formData = new FormData();
    formData.append("listId", checklistId);
    formData.append("itemId", item.id);
    formData.append("timeEntries", JSON.stringify([]));
    await updateItemStatusAction(formData);
    setTotalTime(0);
    onUpdate?.();
  };

  const handleStatusChange = async (
    newStatus: "todo" | "in_progress" | "completed" | "paused"
  ) => {
    const formData = new FormData();
    formData.append("listId", checklistId);
    formData.append("itemId", item.id);
    formData.append("status", newStatus);
    await updateItemStatusAction(formData);
    onUpdate?.();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(item.text);
  };

  const handleSave = async () => {
    if (editText.trim() && editText !== item.text) {
      const formData = new FormData();
      formData.append("listId", checklistId);
      formData.append("itemId", item.id);
      formData.append("text", editText.trim());
      await updateItemAction(formData);
      onUpdate?.();
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      const formData = new FormData();
      formData.append("listId", checklistId);
      formData.append("itemId", item.id);
      await deleteItemAction(formData);
      onUpdate?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const statusOptions = [
    { id: "todo" as const, name: "Todo", icon: Circle },
    { id: "in_progress" as const, name: "In Progress", icon: Play },
    { id: "completed" as const, name: "Completed", icon: CheckCircle2 },
    { id: "paused" as const, name: "Paused", icon: PauseCircle },
  ];

  const formatTimerTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "todo":
        return "bg-muted/50 border-border";
      case "in_progress":
        return "bg-primary/10 border-primary/30";
      case "completed":
        return "bg-green-500/10 border-green-500/30";
      case "paused":
        return "bg-yellow-500/10 border-yellow-500/30";
      default:
        return "bg-muted/50 border-border";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "in_progress":
        return <Play className="h-3 w-3 text-primary" />;
      case "completed":
        return (
          <Target className="h-3 w-3 text-green-600 dark:text-green-400" />
        );
      case "paused":
        return (
          <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
        );
      default:
        return null;
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-background border rounded-lg p-3 transition-all duration-200 hover:shadow-md",
        getStatusColor(item.status),
        (isDragging || isSortableDragging) &&
          "opacity-50 scale-95 rotate-1 shadow-lg z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 cursor-move text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="text-sm font-medium text-foreground leading-tight flex-1 bg-transparent border-none outline-none resize-none w-[70%]"
            />
          ) : (
            <p
              className="text-sm font-medium text-foreground leading-tight flex-1 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 w-[70%]"
              onDoubleClick={handleEdit}
            >
              {item.text}
            </p>
          )}
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(item.status)}
          </div>
        </div>

        {(item.estimatedTime || item.targetDate) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.estimatedTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(item.estimatedTime)}
              </span>
            )}
            {item.targetDate && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {new Date(item.targetDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {item.timeEntries && item.timeEntries.length > 0 && (
          <TimeEntriesAccordion
            timeEntries={item.timeEntries}
            totalTime={totalTime + currentTime}
            formatTimerTime={formatTimerTime}
          />
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {formatTimerTime(totalTime + currentTime)}
            </div>
            <div className="flex gap-1">
              <Button
                variant={isRunning ? "default" : "ghost"}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTimerToggle();
                }}
              >
                {isRunning ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Timer className="h-3 w-3" />
                )}
              </Button>
              {totalTime > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetTimer();
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="sm:hidden w-full">
          <Dropdown
            value={item.status || "todo"}
            options={statusOptions}
            onChange={(newStatus) => {
              handleStatusChange(newStatus);
            }}
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
}
