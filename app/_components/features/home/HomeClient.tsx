"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HomeView } from "@/app/_components/features/home/components/Home";
import { NotesHomeView } from "@/app/_components/features/notes/components/NotesHome";
import { CreateListModal } from "@/app/_components/ui/modals/checklist/CreateList";
import { CreateCategoryModal } from "@/app/_components/ui/modals/category/CreateCategory";
import { SettingsModal } from "@/app/_components/ui/modals/settings/Settings";
import { Layout } from "@/app/_components/common/layout/Layout";
import { Checklist, Category, Note } from "@/app/_types";
import { useAppMode } from "@/app/_providers/AppModeProvider";
import { CreateDocModal } from "@/app/_components/ui/modals/document/CreateDoc";

interface HomeClientProps {
  initialLists: Checklist[];
  initialCategories: Category[];
  initialDocs: Note[];
  initialDocsCategories: Category[];
  username: string;
  isAdmin: boolean;
}

export function HomeClient({
  initialLists,
  initialCategories,
  initialDocs,
  initialDocsCategories,
  username,
  isAdmin,
}: HomeClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [showDocsCategoryModal, setShowDocsCategoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string>("");
  const { mode } = useAppMode();

  const handleOpenCreateModal = (initialCategory?: string) => {
    if (mode === "notes") {
      setShowCreateDocModal(true);
      setInitialCategory(initialCategory || "");
    } else {
      setShowCreateModal(true);
      setInitialCategory(initialCategory || "");
    }
  };

  const handleOpenCategoryModal = () => {
    if (mode === "notes") {
      setShowDocsCategoryModal(true);
    } else {
      setShowCategoryModal(true);
    }
  };

  const handleCategoryDeleted = (categoryName: string) => {
    window.location.reload();
  };

  const handleCategoryRenamed = (oldName: string, newName: string) => {
    window.location.reload();
  };

  const handleSelectChecklist = (id: string) => {
    router.push(`/checklist/${id}`);
  };

  const handleSelectNote = (id: string) => {
    router.push(`/note/${id}`);
  };

  const renderContent = () => {
    if (mode === "notes") {
      return (
        <NotesHomeView
          notes={initialDocs}
          categories={initialDocsCategories}
          onCreateModal={() => setShowCreateDocModal(true)}
          onSelectDoc={handleSelectNote}
        />
      );
    }

    return (
      <HomeView
        lists={initialLists}
        onCreateModal={() => setShowCreateModal(true)}
        onSelectChecklist={handleSelectChecklist}
      />
    );
  };

  return (
    <Layout
      lists={initialLists}
      docs={initialDocs}
      categories={mode === "notes" ? initialDocsCategories : initialCategories}
      onOpenSettings={() => setShowSettingsModal(true)}
      onOpenCreateModal={handleOpenCreateModal}
      onOpenCategoryModal={handleOpenCategoryModal}
      isAdmin={isAdmin}
      username={username}
      onCategoryDeleted={handleCategoryDeleted}
      onCategoryRenamed={handleCategoryRenamed}
    >
      {renderContent()}

      {mode === "checklists" && showCreateModal && (
        <CreateListModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newChecklist) => {
            if (newChecklist) {
              router.push(`/checklist/${newChecklist.id}`);
            }
            setShowCreateModal(false);
          }}
          categories={initialCategories}
          initialCategory={initialCategory}
        />
      )}

      {mode === "notes" && showCreateDocModal && (
        <CreateDocModal
          onClose={() => setShowCreateDocModal(false)}
          onCreated={(newDoc) => {
            if (newDoc) {
              router.push(`/note/${newDoc.id}`);
            }
            setShowCreateDocModal(false);
          }}
          categories={initialDocsCategories}
          initialCategory={initialCategory}
        />
      )}

      {mode === "checklists" && showCategoryModal && (
        <CreateCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreated={() => {
            setShowCategoryModal(false);
            window.location.reload();
          }}
        />
      )}

      {mode === "notes" && showDocsCategoryModal && (
        <CreateCategoryModal
          onClose={() => setShowDocsCategoryModal(false)}
          onCreated={() => {
            setShowDocsCategoryModal(false);
            window.location.reload();
          }}
        />
      )}

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </Layout>
  );
}
