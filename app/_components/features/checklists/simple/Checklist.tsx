"use client";

import { useState, useEffect } from "react";
import { ChecklistItem } from "./ChecklistItem";
import { ShareModal } from "@/app/_components/ui/modals/sharing/ShareModal";
import { ConversionConfirmModal } from "@/app/_components/ui/modals/confirmation/ConversionConfirmModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Checklist } from "@/app/_types";
import { ChecklistHeader } from "../common/ChecklistHeader";
import { ChecklistProgress } from "./ChecklistProgress";
import { ChecklistHeading } from "../common/ChecklistHeading";
import { BulkPasteModal } from "@/app/_components/ui/modals/bulk-paste/BulkPasteModal";
import { KanbanBoard } from "../../checklists/tasks/KanbanBoard";
import { useChecklist } from "../hooks/simple-checklist-hooks";

interface ChecklistViewProps {
  list: Checklist;
  onUpdate: (updatedChecklist: Checklist) => void;
  onBack: () => void;
  onEdit?: (checklist: Checklist) => void;
  onDelete?: (deletedId: string) => void;
  currentUsername?: string;
  isAdmin?: boolean;
}

export function ChecklistView({
  list,
  onUpdate,
  onBack,
  onEdit,
  onDelete,
  currentUsername,
  isAdmin = false,
}: ChecklistViewProps) {
  const [isClient, setIsClient] = useState(false);

  const {
    isLoading,
    showShareModal,
    setShowShareModal,
    showBulkPasteModal,
    setShowBulkPasteModal,
    showConversionModal,
    setShowConversionModal,
    localList,
    focusKey,
    handleDeleteList,
    handleToggleItem,
    handleEditItem,
    handleDeleteItem,
    handleDragEnd,
    handleBulkPaste,
    handleConvertType,
    getNewType,
    handleConfirmConversion,
    handleBulkToggle,
    handleCreateItem,
    incompleteItems,
    completedItems,
    totalCount,
  } = useChecklist({ list, onUpdate, onDelete });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (localList.type === "task") {
    return (
      <div className="h-full flex flex-col bg-background">
        <ChecklistHeader
          checklist={localList}
          onBack={onBack}
          onEdit={() => onEdit?.(list)}
          onDelete={
            localList.isShared
              ? isAdmin || currentUsername === localList.owner
                ? handleDeleteList
                : undefined
              : handleDeleteList
          }
          onShare={() => setShowShareModal(true)}
          onConvertType={handleConvertType}
        />

        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            itemId={localList.id}
            itemTitle={localList.title}
            itemType="checklist"
            itemCategory={localList.category}
            itemOwner={localList.owner || ""}
          />
        )}

        {showConversionModal && (
          <ConversionConfirmModal
            isOpen={showConversionModal}
            onClose={() => setShowConversionModal(false)}
            onConfirm={handleConfirmConversion}
            currentType={localList.type}
            newType={getNewType(localList.type)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <ChecklistHeader
        checklist={localList}
        onBack={onBack}
        onEdit={() => onEdit?.(list)}
        onDelete={
          localList.isShared
            ? isAdmin || currentUsername === localList.owner
              ? handleDeleteList
              : undefined
            : handleDeleteList
        }
        onShare={() => setShowShareModal(true)}
        onConvertType={handleConvertType}
      />

      <ChecklistHeading
        checklist={localList}
        key={focusKey}
        onSubmit={handleCreateItem}
        onBulkSubmit={() => setShowBulkPasteModal(true)}
        isLoading={isLoading}
        autoFocus={true}
        focusKey={focusKey}
        placeholder="Add new item..."
        submitButtonText="Add Item"
      />

      {totalCount > 0 && <ChecklistProgress checklist={localList} />}

      <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
        <div className="w-full space-y-4">
          {incompleteItems.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  To Do ({incompleteItems.length})
                  {isLoading && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Saving...
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => handleBulkToggle(true)}
                  disabled={isLoading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Check All
                </button>
              </div>
              {isClient ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={incompleteItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {incompleteItems.map((item, index) => (
                        <ChecklistItem
                          key={item.id}
                          item={item}
                          index={index}
                          onToggle={handleToggleItem}
                          onDelete={handleDeleteItem}
                          onEdit={handleEditItem}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-2">
                  {incompleteItems.map((item, index) => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      index={index}
                      onToggle={handleToggleItem}
                      onDelete={handleDeleteItem}
                      onEdit={handleEditItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {completedItems.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Completed ({completedItems.length})
                  {isLoading && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Saving...
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => handleBulkToggle(false)}
                  disabled={isLoading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Uncheck All
                </button>
              </div>
              {isClient ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={completedItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {completedItems.map((item, index) => (
                        <ChecklistItem
                          key={item.id}
                          item={item}
                          index={incompleteItems.length + index}
                          onToggle={handleToggleItem}
                          onDelete={handleDeleteItem}
                          onEdit={handleEditItem}
                          completed
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-2">
                  {completedItems.map((item, index) => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      index={incompleteItems.length + index}
                      onToggle={handleToggleItem}
                      onDelete={handleDeleteItem}
                      onEdit={handleEditItem}
                      completed
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {localList.items.length === 0 && (
            <div className="bg-background rounded-lg border border-border p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No items yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Add your first item to get started with this checklist.
              </p>
            </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          itemId={localList.id}
          itemTitle={localList.title}
          itemType="checklist"
          itemCategory={localList.category}
          itemOwner={localList.owner || ""}
        />
      )}

      {showConversionModal && (
        <ConversionConfirmModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onConfirm={handleConfirmConversion}
          currentType={localList.type}
          newType={getNewType(localList.type)}
        />
      )}

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
