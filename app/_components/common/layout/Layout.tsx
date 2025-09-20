"use client";

import { useState } from "react";
import { QuickNav } from "@/app/_components/features/header/QuickNav";
import { Sidebar } from "./sidebar/Sidebar";
import { Checklist, Category, Note } from "@/app/_types";
import { useAppMode } from "@/app/_providers/AppModeProvider";

interface LayoutProps {
  lists: Checklist[];
  docs?: Note[];
  categories: Category[];
  onOpenSettings: () => void;
  onOpenCreateModal: (initialCategory?: string) => void;
  onOpenCategoryModal: () => void;
  onCategoryDeleted?: (categoryName: string) => void;
  onCategoryRenamed?: (oldName: string, newName: string) => void;
  children: React.ReactNode;
  isAdmin: boolean;
  username: string;
}

export function Layout({
  lists,
  docs,
  categories,
  onOpenSettings,
  onOpenCreateModal,
  onOpenCategoryModal,
  onCategoryDeleted,
  onCategoryRenamed,
  isAdmin,
  username,
  children,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setMode, isInitialized } = useAppMode();

  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background w-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background w-full">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenCreateModal={onOpenCreateModal}
        onOpenCategoryModal={onOpenCategoryModal}
        categories={categories}
        checklists={lists}
        docs={docs}
        username={username}
        isAdmin={isAdmin}
        onCategoryDeleted={onCategoryDeleted}
        onCategoryRenamed={onCategoryRenamed}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <QuickNav
          showSidebarToggle
          onSidebarToggle={() => setSidebarOpen(true)}
          onOpenSettings={onOpenSettings}
          isAdmin={isAdmin}
          checklists={lists}
          docs={docs || []}
          onModeChange={setMode}
        />

        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
