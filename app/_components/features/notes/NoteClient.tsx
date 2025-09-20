"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Note, Category } from "@/app/_types";
import { NoteEditor } from "./components/NoteEditor";
import { CreateDocModal } from "@/app/_components/ui/modals/document/CreateDoc";
import { CreateCategoryModal } from "@/app/_components/ui/modals/category/CreateCategory";
import { getDocsCategories } from "@/app/_server/actions/data/notes-actions";
import { useNavigationGuard } from "@/app/_providers/NavigationGuardProvider";
import { Layout } from "@/app/_components/common/layout/Layout";
import { useAppMode } from "@/app/_providers/AppModeProvider";

interface NoteClientProps {
  note: Note;
  docs: Note[];
  categories: Category[];
  username: string;
  isAdmin: boolean;
}

export function NoteClient({
  note,
  docs,
  categories,
  username,
  isAdmin,
}: NoteClientProps) {
  const router = useRouter();
  const { checkNavigation } = useNavigationGuard();
  const [localNote, setLocalNote] = useState<Note>(note);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string>("");

  useEffect(() => {
    setLocalNote(note);
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

  const handleOpenCategoryModal = () => {
    setShowCategoryModal(true);
  };

  return (
    <Layout
      lists={[]}
      docs={docs}
      categories={categories}
      onOpenSettings={() => { }}
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
