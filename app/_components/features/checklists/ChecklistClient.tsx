"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checklist, Category } from "@/app/_types";
import { ChecklistView } from "./simple/Checklist";
import { KanbanBoard } from "./tasks/KanbanBoard";
import { ChecklistHeader } from "./common/ChecklistHeader";
import { ShareModal } from "@/app/_components/ui/modals/sharing/ShareModal";
import { ConversionConfirmModal } from "@/app/_components/ui/modals/confirmation/ConversionConfirmModal";
import { EditChecklistModal } from "@/app/_components/ui/modals/checklist/EditChecklistModal";
import { CreateListModal } from "@/app/_components/ui/modals/checklist/CreateList";
import { CreateCategoryModal } from "@/app/_components/ui/modals/category/CreateCategory";
import { useNavigationGuard } from "@/app/_providers/NavigationGuardProvider";
import { Layout } from "@/app/_components/common/layout/Layout";
import { useChecklist } from "./hooks/simple-checklist-hooks";
import { useAppMode } from "@/app/_providers/AppModeProvider";

interface ChecklistClientProps {
  checklist: Checklist;
  lists: Checklist[];
  categories: Category[];
  username: string;
  isAdmin: boolean;
}

export function ChecklistClient({
  checklist,
  lists,
  categories,
  username,
  isAdmin,
}: ChecklistClientProps) {
  const router = useRouter();
  const { checkNavigation } = useNavigationGuard();
  const { mode } = useAppMode();
  const [localChecklist, setLocalChecklist] = useState<Checklist>(checklist);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string>("");

  useEffect(() => {
    setLocalChecklist(checklist);
  }, [checklist]);

  const handleUpdate = (updatedChecklist: Checklist) => {
    setLocalChecklist(updatedChecklist);
  };

  const handleBack = () => {
    checkNavigation(() => {
      router.push("/");
    });
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = (deletedId: string) => {
    checkNavigation(() => {
      router.push("/");
    });
  };

  const handleOpenCreateModal = (initialCategory?: string) => {
    setInitialCategory(initialCategory || "");
    setShowCreateModal(true);
  };

  const handleOpenCategoryModal = () => {
    setShowCategoryModal(true);
  };

  const {
    handleDeleteList,
    handleConvertType,
    getNewType,
    handleConfirmConversion,
  } = useChecklist({
    list: localChecklist,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
  });

  const renderContent = () => {
    if (localChecklist.type === "task") {
      return (
        <div className="h-full flex flex-col bg-background">
          <ChecklistHeader
            checklist={localChecklist}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={
              localChecklist.isShared
                ? isAdmin || username === localChecklist.owner
                  ? handleDeleteList
                  : undefined
                : handleDeleteList
            }
            onShare={() => setShowShareModal(true)}
            onConvertType={() => setShowConversionModal(true)}
          />
          <KanbanBoard checklist={localChecklist} onUpdate={handleUpdate} />
        </div>
      );
    }

    return (
      <ChecklistView
        list={localChecklist}
        onUpdate={handleUpdate}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        currentUsername={username}
        isAdmin={isAdmin}
      />
    );
  };

  return (
    <Layout
      lists={lists}
      categories={categories}
      onOpenSettings={() => { }}
      onOpenCreateModal={handleOpenCreateModal}
      onOpenCategoryModal={handleOpenCategoryModal}
      isAdmin={isAdmin}
      username={username}
    >
      {renderContent()}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          itemId={localChecklist.id}
          itemTitle={localChecklist.title}
          itemType="checklist"
          itemCategory={localChecklist.category}
          itemOwner={localChecklist.owner || ""}
        />
      )}

      {showConversionModal && (
        <ConversionConfirmModal
          isOpen={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onConfirm={handleConfirmConversion}
          currentType={localChecklist.type}
          newType={getNewType(localChecklist.type)}
        />
      )}

      {showEditModal && (
        <EditChecklistModal
          checklist={localChecklist}
          categories={categories}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}

      {showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newChecklist) => {
            if (newChecklist) {
              router.push(`/checklist/${newChecklist.id}`);
            }
            setShowCreateModal(false);
          }}
          categories={categories}
          initialCategory={initialCategory}
        />
      )}

      {showCategoryModal && (
        <CreateCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreated={() => {
            setShowCategoryModal(false);
            window.location.reload();
          }}
        />
      )}
    </Layout>
  );
}
