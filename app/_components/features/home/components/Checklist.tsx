"use client";

import { useState, useEffect, useRef } from "react";
import { ChecklistItem } from "./ChecklistItem";
import { ShareModal } from "@/app/_components/ui/modals/sharing/ShareModal";
import {
  deleteListAction,
  createItemAction,
  updateItemAction,
  deleteItemAction,
  reorderItemsAction,
  createBulkItemsAction,
} from "@/app/_server/actions/data/actions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Checklist } from "@/app/_types";
import { ChecklistHeader } from "./ChecklistHeader";
import { ChecklistProgress } from "./ChecklistProgress";
import { ChecklistForm } from "./ChecklistForm";
import { BulkPasteModal } from "@/app/_components/ui/modals/bulk-paste/BulkPasteModal";

interface ChecklistViewProps {
  list: Checklist;
  onUpdate: (updatedChecklist: Checklist) => void;
  onBack: () => void;
  onEdit?: (checklist: Checklist) => void;
  onDelete?: (deletedId: string) => void;
}

export function ChecklistView({
  list,
  onUpdate,
  onBack,
  onEdit,
  onDelete,
}: ChecklistViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [localList, setLocalList] = useState(list);
  const [focusKey, setFocusKey] = useState(0);

  useEffect(() => {
    setLocalList(list);
    setFocusKey(prev => prev + 1);
  }, [list]);

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

  const handleDeleteList = async () => {
    if (confirm("Are you sure you want to delete this checklist?")) {
      const formData = new FormData();
      formData.append("id", localList.id);
      formData.append("category", localList.category || "Uncategorized");
      await deleteListAction(formData);
      onDelete?.(localList.id);
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    const formData = new FormData();
    formData.append("listId", localList.id);
    formData.append("itemId", itemId);
    formData.append("completed", String(completed));
    const result = await updateItemAction(formData);

    if (result.success) {
      const updatedList = {
        ...localList,
        items: localList.items.map((item) =>
          item.id === itemId ? { ...item, completed } : item
        ),
      };
      setLocalList(updatedList);
      onUpdate(updatedList);
      setFocusKey(prev => prev + 1);
    }
  };

  const handleEditItem = async (itemId: string, text: string) => {
    const formData = new FormData();
    formData.append("listId", localList.id);
    formData.append("itemId", itemId);
    formData.append("text", text);
    const result = await updateItemAction(formData);

    if (result.success) {
      const updatedList = {
        ...localList,
        items: localList.items.map((item) =>
          item.id === itemId ? { ...item, text } : item
        ),
      };
      setLocalList(updatedList);
      onUpdate(updatedList);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const optimisticList = {
      ...localList,
      items: localList.items.filter((item) => item.id !== itemId),
    };
    setLocalList(optimisticList);
    onUpdate(optimisticList);
    setFocusKey(prev => prev + 1);

    const formData = new FormData();
    formData.append("listId", localList.id);
    formData.append("itemId", itemId);
    const result = await deleteItemAction(formData);

    if (!result.success) {
      setLocalList(localList);
      onUpdate(localList);
      console.error("Failed to delete item:", result.error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const incompleteItems = localList.items.filter((item) => !item.completed);
      const completedItems = localList.items.filter((item) => item.completed);

      const incompleteOldIndex = incompleteItems.findIndex(
        (item) => item.id === active.id
      );
      const incompleteNewIndex = incompleteItems.findIndex(
        (item) => item.id === over?.id
      );

      if (incompleteOldIndex !== -1 && incompleteNewIndex !== -1) {
        const newIncompleteItems = arrayMove(
          incompleteItems,
          incompleteOldIndex,
          incompleteNewIndex
        ).map((item, index) => ({ ...item, order: index }));
        const newItems = [...newIncompleteItems, ...completedItems].map(
          (item, index) => ({ ...item, order: index })
        );

        const updatedList = {
          ...localList,
          items: newItems,
        };
        setLocalList(updatedList);

        const itemIds = newItems.map((item) => item.id);

        const formData = new FormData();
        formData.append("listId", localList.id);
        formData.append("itemIds", JSON.stringify(itemIds));
        formData.append("currentItems", JSON.stringify(newItems));
        const result = await reorderItemsAction(formData);

        if (!result.success) {
          setLocalList((prev) => ({
            ...prev,
            items: list.items,
          }));
        } else {
          onUpdate(updatedList);
        }
        return;
      }

      const completedOldIndex = completedItems.findIndex(
        (item) => item.id === active.id
      );
      const completedNewIndex = completedItems.findIndex(
        (item) => item.id === over?.id
      );

      if (completedOldIndex !== -1 && completedNewIndex !== -1) {
        const newCompletedItems = arrayMove(
          completedItems,
          completedOldIndex,
          completedNewIndex
        ).map((item, index) => ({ ...item, order: index }));
        const newItems = [...incompleteItems, ...newCompletedItems].map(
          (item, index) => ({ ...item, order: index })
        );

        const updatedList = {
          ...localList,
          items: newItems,
        };
        setLocalList(updatedList);

        const itemIds = newItems.map((item) => item.id);

        const formData = new FormData();
        formData.append("listId", localList.id);
        formData.append("itemIds", JSON.stringify(itemIds));
        formData.append("currentItems", JSON.stringify(newItems));
        const result = await reorderItemsAction(formData);

        if (!result.success) {
          setLocalList((prev) => ({
            ...prev,
            items: list.items,
          }));
        } else {
          onUpdate(updatedList);
        }
      }
    }
  };

  const handleBulkPaste = async (itemsText: string) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("listId", localList.id);
    formData.append("itemsText", itemsText);
    const result = await createBulkItemsAction(formData);
    setIsLoading(false);

    if (result.success && result.data) {
      const updatedList = {
        ...localList,
        items: [...localList.items, ...result.data],
      };
      setLocalList(updatedList);
      onUpdate(updatedList);
    }
  };

  const incompleteItems = localList.items.filter((item) => !item.completed);
  const completedItems = localList.items.filter((item) => item.completed);
  const totalCount = localList.items.length;

  return (
    <div className="h-full flex flex-col bg-background">
      <ChecklistHeader
        checklist={localList}
        onBack={onBack}
        onEdit={() => onEdit?.(list)}
        onDelete={handleDeleteList}
        onShare={() => setShowShareModal(true)}
      />

      {totalCount > 0 && <ChecklistProgress checklist={localList} />}

      <div className="flex-1 overflow-y-auto p-3 lg:p-6 bg-background-secondary">
        <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6 pb-20 lg:pb-0">
          <div className="bg-background rounded-lg border border-border p-4">
            <ChecklistForm
              key={focusKey}
              onSubmit={async (text) => {
                setIsLoading(true);
                const formData = new FormData();
                formData.append("listId", localList.id);
                formData.append("text", text);
                const result = await createItemAction(formData);
                setIsLoading(false);

                if (result.success && result.data) {
                  const updatedList = {
                    ...localList,
                    items: [...localList.items, result.data],
                  };
                  setLocalList(updatedList);
                  onUpdate(updatedList);
                  setFocusKey((prev) => prev + 1);
                }
              }}
              onBulkSubmit={() => setShowBulkPasteModal(true)}
              isLoading={isLoading}
              autoFocus={true}
            />
          </div>

          {incompleteItems.length > 0 && (
            <div className="bg-background rounded-lg border border-border p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                To Do ({incompleteItems.length})
                {isLoading && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    Saving...
                  </span>
                )}
              </h3>
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
            </div>
          )}

          {completedItems.length > 0 && (
            <div className="bg-background rounded-lg border border-border p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Completed ({completedItems.length})
                {isLoading && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    Saving...
                  </span>
                )}
              </h3>
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
