"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Note, Category } from "@/app/_types";
import { NoteEditor } from "./components/NoteEditor";
import { CreateDocModal } from "@/app/_components/ui/modals/document/CreateDoc";
import { CreateCategoryModal } from "@/app/_components/ui/modals/category/CreateCategory";
import { SettingsModal } from "@/app/_components/ui/modals/settings/Settings";
import { getDocsCategories } from "@/app/_server/actions/data/notes-actions";
import { useNavigationGuard } from "@/app/_providers/NavigationGuardProvider";
import { Layout } from "@/app/_components/common/layout/Layout";
import { useAppMode } from "@/app/_providers/AppModeProvider";

interface SharingStatus {
  isShared: boolean;
  isPubliclyShared: boolean;
  sharedWith: string[];
}

interface NoteClientProps {
  note: Note;
  docs: Note[];
  categories: Category[];
  sharingStatuses?: Record<string, SharingStatus>;
  username: string;
  isAdmin: boolean;
}

export function NoteClient({
  note,
  docs,
  categories,
  sharingStatuses,
  username,
  isAdmin,
}: NoteClientProps) {
  const router = useRouter();
  const { checkNavigation } = useNavigationGuard();
  const [localNote, setLocalNote] = useState<Note>(note);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string>("");
  const [initialParentCategory, setInitialParentCategory] =
    useState<string>("");
  const prevNoteId = useRef(note.id);

  useEffect(() => {
    if (note.id !== prevNoteId.current) {
      setLocalNote(note);
      prevNoteId.current = note.id;
    }
  }, [note]);

  const handleUpdate = (updatedNote: Note) => {
    setLocalNote(updatedNote);
  };

  const handleBack = () => {
    checkNavigation(() => {
      router.push("/");
    });
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

  const handleOpenCategoryModal = (parentCategory?: string) => {
    setShowCategoryModal(true);
    setInitialParentCategory(parentCategory || "");
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  return (
    <Layout
      lists={[]}
      docs={docs}
      categories={categories}
      sharingStatuses={sharingStatuses}
      onOpenSettings={handleOpenSettings}
      onOpenCreateModal={handleOpenCreateModal}
      onOpenCategoryModal={handleOpenCategoryModal}
      isAdmin={isAdmin}
      username={username}
    >
      <NoteEditor
        doc={localNote}
        categories={categories}
        onUpdate={handleUpdate}
        onBack={handleBack}
        onDelete={handleDelete}
        currentUsername={username}
        isAdmin={isAdmin}
      />

      {showCreateModal && (
        <CreateDocModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newDoc) => {
            if (newDoc) {
              router.push(`/note/${newDoc.id}`);
            }
            setShowCreateModal(false);
            router.refresh();
          }}
          categories={categories}
          initialCategory={initialCategory}
        />
      )}

      {showCategoryModal && (
        <CreateCategoryModal
          mode="notes"
          categories={categories}
          initialParent={initialParentCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setInitialParentCategory("");
          }}
          onCreated={() => {
            setShowCategoryModal(false);
            setInitialParentCategory("");
            router.refresh();
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
