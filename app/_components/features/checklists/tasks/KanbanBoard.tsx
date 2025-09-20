"use client";

import { useState, useEffect } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Checklist } from "@/app/_types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanItem } from "./KanbanItem";
import { ChecklistHeading } from "../../checklists/common/ChecklistHeading";
import { BulkPasteModal } from "@/app/_components/ui/modals/bulk-paste/BulkPasteModal";
import { useKanbanBoard } from "../hooks/kanban-board-hooks";

interface KanbanBoardProps {
  checklist: Checklist;
  onUpdate: (updatedChecklist: Checklist) => void;
}

const columns = [
  { id: "todo", title: "Todo", status: "todo" as const },
  { id: "in_progress", title: "In Progress", status: "in_progress" as const },
  { id: "completed", title: "Completed", status: "completed" as const },
  { id: "paused", title: "Paused", status: "paused" as const },
];

export function KanbanBoard({ checklist, onUpdate }: KanbanBoardProps) {
  const [isClient, setIsClient] = useState(false);

  const {
    localChecklist,
    isLoading,
    showBulkPasteModal,
    setShowBulkPasteModal,
    focusKey,
    refreshChecklist,
    getItemsByStatus,
    handleDragStart,
    handleDragEnd,
    handleAddItem,
    handleBulkPaste,
    activeItem,
  } = useKanbanBoard({ checklist, onUpdate });

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      <ChecklistHeading
        checklist={localChecklist}
        key={focusKey}
        onSubmit={handleAddItem}
        onBulkSubmit={() => setShowBulkPasteModal(true)}
        isLoading={isLoading}
        autoFocus={true}
        focusKey={focusKey}
        placeholder="Add new task..."
        submitButtonText="Add Task"
      />

      <div className="flex-1 overflow-hidden pb-[6em]">
        {isClient ? (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2 sm:p-4 overflow-x-auto">
              {columns.map((column) => {
                const items = getItemsByStatus(column.status);
                return (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    items={items}
                    status={column.status}
                    checklistId={localChecklist.id}
                    onUpdate={refreshChecklist}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeItem ? (
                <KanbanItem
                  item={activeItem}
                  isDragging
                  checklistId={localChecklist.id}
                  onUpdate={refreshChecklist}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-2 sm:p-4 overflow-x-auto">
            {columns.map((column) => {
              const items = getItemsByStatus(column.status);
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  items={items}
                  status={column.status}
                  checklistId={localChecklist.id}
                  onUpdate={refreshChecklist}
                />
              );
            })}
          </div>
        )}
      </div>

      {showBulkPasteModal && (
        <BulkPasteModal
          isOpen={showBulkPasteModal}
          onClose={() => setShowBulkPasteModal(false)}
          onSubmit={handleBulkPaste}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
