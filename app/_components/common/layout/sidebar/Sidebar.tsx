"use client";

import { useContext, useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/app/_utils/utils";
import { useNavigationGuard } from "@/app/_providers/NavigationGuardProvider";
import {
  deleteCategoryAction,
  renameCategoryAction,
} from "@/app/_server/actions/data/actions";
import {
  deleteDocsCategoryAction,
  renameDocsCategoryAction,
} from "@/app/_server/actions/data/notes-actions";
import { DeleteCategoryModal } from "@/app/_components/ui/modals/category/DeleteCategory";
import { RenameCategoryModal } from "@/app/_components/ui/modals/category/RenameCategory";
import { EditChecklistModal } from "@/app/_components/ui/modals/checklist/EditChecklistModal";
import { EditNoteModal } from "@/app/_components/ui/modals/note/EditNoteModal";
import { Logo } from "@/app/_components/ui/icons/logo";
import { SettingsModal } from "@/app/_components/ui/modals/settings/Settings";
import { Checklist, Category, Note, AppMode } from "@/app/_types";
import { useAppMode } from "../../../../_providers/AppModeProvider";
import { SidebarNavigation } from "./components/SidebarNavigation";
import { CategoryList } from "./components/CategoryList";
import { SharedItemsList } from "./components/SharedItemsList";
import { SidebarActions } from "./components/SidebarActions";

interface SharingStatus {
  isShared: boolean;
  isPubliclyShared: boolean;
  sharedWith: string[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal: (initialCategory?: string) => void;
  onOpenCategoryModal: (parentCategory?: string) => void;
  categories: Category[];
  checklists: Checklist[];
  docs?: Note[];
  sharingStatuses?: Record<string, SharingStatus>;
  username: string;
  isAdmin: boolean;
  onCategoryDeleted?: (categoryName: string) => void;
  onCategoryRenamed?: (oldName: string, newName: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onOpenCreateModal,
  onOpenCategoryModal,
  categories,
  checklists,
  docs = [],
  sharingStatuses = {},
  username,
  isAdmin,
  onCategoryDeleted,
  onCategoryRenamed,
}: SidebarProps) {
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [showRenameCategoryModal, setShowRenameCategoryModal] = useState(false);
  const [showEditChecklistModal, setShowEditChecklistModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Checklist | Note | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [sharedItemsCollapsed, setSharedItemsCollapsed] = useState(false);
  const [isLocalStorageInitialized, setIsLocalStorageInitialized] = useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed-categories');
    if (savedCollapsed) {
      try {
        const categories = JSON.parse(savedCollapsed);
        setCollapsedCategories(new Set(categories));
      } catch (error) {
        console.error('Failed to parse collapsed categories from localStorage:', error);
      }
    }

    const savedSharedItems = localStorage.getItem('sidebar-shared-items-collapsed');
    if (savedSharedItems) {
      try {
        setSharedItemsCollapsed(JSON.parse(savedSharedItems));
      } catch (error) {
        console.error('Failed to parse shared items collapsed state from localStorage:', error);
      }
    }

    setIsLocalStorageInitialized(true);
  }, []);

  useEffect(() => {
    if (!isLocalStorageInitialized) return;

    const categoriesArray = Array.from(collapsedCategories);
    localStorage.setItem('sidebar-collapsed-categories', JSON.stringify(categoriesArray));
  }, [collapsedCategories, isLocalStorageInitialized]);

  useEffect(() => {
    if (!isLocalStorageInitialized) return;

    localStorage.setItem('sidebar-shared-items-collapsed', JSON.stringify(sharedItemsCollapsed));
  }, [sharedItemsCollapsed, isLocalStorageInitialized]);

  const [showSettings, setShowSettings] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { mode, setMode, isInitialized } = useAppMode();

  const getSharingStatus = (itemId: string) => {
    return sharingStatuses[itemId] || null;
  };

  const handleDeleteCategory = (categoryPath: string) => {
    setCategoryToDelete(categoryPath);
    setShowDeleteCategoryModal(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    const formData = new FormData();
    formData.append("path", categoryToDelete);

    const result =
      mode === "notes"
        ? await deleteDocsCategoryAction(formData)
        : await deleteCategoryAction(formData);

    if (result.success) {
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      onCategoryDeleted?.(categoryToDelete);
    }
  };

  const handleRenameCategory = (categoryPath: string) => {
    setCategoryToRename(categoryPath);
    setShowRenameCategoryModal(true);
  };

  const handleConfirmRenameCategory = async (
    oldPath: string,
    newName: string
  ) => {
    const formData = new FormData();
    formData.append("oldPath", oldPath);
    formData.append("newName", newName);

    const result =
      mode === "notes"
        ? await renameDocsCategoryAction(formData)
        : await renameCategoryAction(formData);

    if (result.success) {
      setShowRenameCategoryModal(false);
      setCategoryToRename(null);
      onCategoryRenamed?.(oldPath, newName);
    }
  };

  const handleQuickCreate = (categoryPath: string) => {
    onOpenCreateModal(categoryPath);
  };

  const handleCreateSubcategory = (categoryPath: string) => {
    onOpenCategoryModal(categoryPath);
  };

  const toggleCategory = (categoryPath: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryPath)) {
        newSet.delete(categoryPath);
      } else {
        newSet.add(categoryPath);
      }
      return newSet;
    });
  };

  const toggleSharedItems = () => {
    setSharedItemsCollapsed(!sharedItemsCollapsed);
  };

  const { checkNavigation } = useNavigationGuard();

  const handleModeSwitch = (newMode: AppMode) => {
    checkNavigation(() => {
      setMode(newMode);
      router.push("/");
    });
  };

  const handleItemClick = (item: Checklist | Note) => {
    checkNavigation(() => {
      if (mode === "notes") {
        router.push(`/note/${item.id}`);
      } else {
        router.push(`/checklist/${item.id}`);
      }
      onClose();
    });
  };

  const handleEditItem = (item: Checklist | Note) => {
    setItemToEdit(item);
    if (mode === "notes") {
      setShowEditNoteModal(true);
    } else {
      setShowEditChecklistModal(true);
    }
  };

  const isItemSelected = (item: Checklist | Note) => {
    if (mode === "notes") {
      return pathname === `/note/${item.id}`;
    } else {
      return pathname === `/checklist/${item.id}`;
    }
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-background border-r border-border transition-transform lg:relative lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a href="/" className="flex items-center gap-3">
                  <Logo className="h-8 w-8" />
                  <span className="text-xl font-bold text-foreground">
                    <span className="text-primary">rw</span>Markable
                  </span>
                </a>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <SidebarNavigation mode={mode} onModeChange={handleModeSwitch} />

          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            <SharedItemsList
              items={mode === "checklists" ? checklists : docs}
              collapsed={sharedItemsCollapsed}
              onToggleCollapsed={toggleSharedItems}
              onItemClick={handleItemClick}
              onEditItem={handleEditItem}
              isItemSelected={isItemSelected}
              mode={mode}
              getSharingStatus={getSharingStatus}
            />

            <CategoryList
              categories={categories}
              items={mode === "checklists" ? checklists : docs}
              collapsedCategories={collapsedCategories}
              onToggleCategory={toggleCategory}
              onDeleteCategory={handleDeleteCategory}
              onRenameCategory={handleRenameCategory}
              onQuickCreate={handleQuickCreate}
              onCreateSubcategory={handleCreateSubcategory}
              onItemClick={handleItemClick}
              onEditItem={handleEditItem}
              isItemSelected={isItemSelected}
              mode={mode}
              getSharingStatus={getSharingStatus}
            />
          </div>

          <SidebarActions
            mode={mode}
            onOpenCreateModal={onOpenCreateModal}
            onOpenCategoryModal={onOpenCategoryModal}
            onOpenSettings={() => setShowSettings(true)}
            username={username}
            isAdmin={isAdmin}
          />
        </div>
      </aside>

      {showDeleteCategoryModal && categoryToDelete && (
        <DeleteCategoryModal
          isOpen={showDeleteCategoryModal}
          categoryPath={categoryToDelete}
          onClose={() => {
            setShowDeleteCategoryModal(false);
            setCategoryToDelete(null);
          }}
          onConfirm={handleConfirmDeleteCategory}
        />
      )}

      {showRenameCategoryModal && categoryToRename && (
        <RenameCategoryModal
          isOpen={showRenameCategoryModal}
          categoryPath={categoryToRename}
          onClose={() => {
            setShowRenameCategoryModal(false);
            setCategoryToRename(null);
          }}
          onRename={handleConfirmRenameCategory}
        />
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {showEditChecklistModal && itemToEdit && (
        <EditChecklistModal
          checklist={itemToEdit as Checklist}
          categories={categories}
          onClose={() => {
            setShowEditChecklistModal(false);
            setItemToEdit(null);
          }}
          onUpdated={() => {
            setShowEditChecklistModal(false);
            setItemToEdit(null);
            router.refresh();
          }}
        />
      )}

      {showEditNoteModal && itemToEdit && (
        <EditNoteModal
          note={itemToEdit as Note}
          categories={categories}
          onClose={() => {
            setShowEditNoteModal(false);
            setItemToEdit(null);
          }}
          onUpdated={() => {
            setShowEditNoteModal(false);
            setItemToEdit(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
