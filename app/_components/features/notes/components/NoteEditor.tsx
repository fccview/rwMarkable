"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { TiptapEditor } from "./TipTapComponents/TipTapEditor";
import { UnifiedMarkdownRenderer } from "./UnifiedMarkdownRenderer";
import {
  createTurndownService,
  convertMarkdownToHtml,
  convertHtmlToMarkdownUnified,
  getMarkdownPreviewContent,
} from "@/app/_utils/markdownUtils";
import { useSettings } from "@/app/_utils/settings-store";
import { UnsavedChangesModal } from "@/app/_components/ui/modals/confirmation/UnsavedChangesModal";
import { useNavigationGuard } from "@/app/_providers/NavigationGuardProvider";

import {
  ArrowLeft,
  Save,
  Edit3,
  FolderOpen,
  Trash2,
  Folder,
  Share2,
  Users,
  Download,
  List,
  Globe,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Dropdown } from "@/app/_components/ui/elements/dropdown";
import { ShareModal } from "@/app/_components/ui/modals/sharing/ShareModal";
import { TableOfContents } from "./TableOfContents";
import { Note, Category } from "@/app/_types";
import { exportToPDF } from "@/app/_utils/pdf-export";
import {
  updateDocAction,
  deleteDocAction,
} from "@/app/_server/actions/data/notes-actions";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import { useSharingStatus } from "@/app/_components/hooks/useSharingStatus";
import { useRouter } from "next/navigation";

interface NoteEditorProps {
  doc: Note;
  categories: Category[];
  onUpdate: (updatedDoc: Note) => void;
  onBack: () => void;
  onDelete?: (deletedId: string) => void;
  currentUsername?: string;
  isAdmin?: boolean;
}

export function NoteEditor({
  doc,
  categories,
  onUpdate,
  onBack,
  onDelete,
  currentUsername,
  isAdmin = false,
}: NoteEditorProps) {
  const router = useRouter();
  const [docContent, setDocContent] = useState(doc.content || "");
  const [editorContent, setEditorContent] = useState("");
  const [isEditorInMarkdownMode, setIsEditorInMarkdownMode] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category || "Uncategorized");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState(doc.content || "");
  const [showTableOfContents, setShowTableOfContents] = useState(false);

  const { autosaveNotes } = useSettings();
  const { sharingStatus } = useSharingStatus(
    doc.id,
    "document",
    doc.owner || "",
    true
  );
  const {
    registerNavigationGuard,
    unregisterNavigationGuard,
    executePendingNavigation,
  } = useNavigationGuard();
  const autosaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const turndownService = useMemo(() => createTurndownService(), []);

  const categoryOptions = [
    { id: "", name: "Uncategorized", icon: FolderOpen },
    ...categories
      .filter((cat) => cat.name !== "Uncategorized")
      .map((cat) => ({
        id: cat.name,
        name: cat.name,
        icon: Folder,
      })),
  ];

  useEffect(() => {
    const markdownContent = doc.content || "";
    setDocContent(markdownContent);
    setTitle(doc.title);
    const docCategory =
      doc.category === "Uncategorized" || !doc.category ? "" : doc.category;
    setCategory(docCategory);

    setEditorContent(convertMarkdownToHtml(markdownContent));
    setIsEditing(false);
  }, [doc]);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await getCurrentUser();
        const isOwnerResult =
          user?.username === doc.owner ||
          (doc.owner === undefined && !!user?.username);
        setIsOwner(isOwnerResult);
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };
    checkOwnership();
  }, [doc.owner, doc.id, doc.title, doc.isShared, isEditing]);

  const performAutosave = useCallback(async () => {
    if (!isEditing || !hasUnsavedChanges || isSaving || isAutoSaving) return;

    setIsAutoSaving(true);

    let markdownOutput: string;
    if (isEditorInMarkdownMode) {
      markdownOutput = editorContent;
    } else {
      markdownOutput = convertHtmlToMarkdownUnified(editorContent);
    }

    const formData = new FormData();
    formData.append("id", doc.id);
    formData.append("title", title);
    formData.append("content", markdownOutput);

    if (isOwner) {
      formData.append("category", category);
    }

    try {
      const result = await updateDocAction(formData);
      if (result.success) {
        setLastSavedContent(markdownOutput);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    isEditing,
    hasUnsavedChanges,
    isSaving,
    isAutoSaving,
    isEditorInMarkdownMode,
    editorContent,
    title,
    isOwner,
    category,
    doc,
  ]);

  useEffect(() => {
    if (autosaveNotes && isEditing) {
      autosaveIntervalRef.current = setInterval(performAutosave, 15000);
    } else {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current);
        autosaveIntervalRef.current = null;
      }
    }

    return () => {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current);
        autosaveIntervalRef.current = null;
      }
    };
  }, [autosaveNotes, isEditing, performAutosave]);

  useEffect(() => {
    if (!isEditing) {
      setHasUnsavedChanges(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      let currentContent: string;
      if (isEditorInMarkdownMode) {
        currentContent = editorContent;
      } else {
        currentContent = convertHtmlToMarkdownUnified(editorContent);
      }

      const originalContent = doc.content || "";

      const normalizeContent = (content: string) => {
        return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      };

      const normalizedCurrent = normalizeContent(currentContent);
      const normalizedOriginal = normalizeContent(originalContent);

      const hasChanges =
        normalizedCurrent !== normalizedOriginal ||
        title !== doc.title ||
        category !== (doc.category || "Uncategorized");

      setHasUnsavedChanges(hasChanges);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    isEditing,
    editorContent,
    isEditorInMarkdownMode,
    turndownService,
    doc.content,
    title,
    doc.title,
    category,
    doc.category,
  ]);

  useEffect(() => {
    if (!isEditing) {
      unregisterNavigationGuard();
      return;
    }

    const navigationGuard = () => {
      if (hasUnsavedChanges) {
        setShowUnsavedChangesModal(true);
        return false;
      }
      return true;
    };

    registerNavigationGuard(navigationGuard);

    return () => {
      unregisterNavigationGuard();
    };
  }, [
    isEditing,
    hasUnsavedChanges,
    registerNavigationGuard,
    unregisterNavigationGuard,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleEdit = () => {
    setEditorContent(convertMarkdownToHtml(docContent));
    setIsEditing(true);
  };

  const handleEditorContentChange = (
    content: string,
    isMarkdownMode: boolean
  ) => {
    setEditorContent(content);
    setIsEditorInMarkdownMode(isMarkdownMode);
  };

  const handleSave = async () => {
    setIsSaving(true);

    let markdownOutput: string;
    if (isEditorInMarkdownMode) {
      markdownOutput = editorContent;
    } else {
      markdownOutput = convertHtmlToMarkdownUnified(editorContent);
    }

    const formData = new FormData();
    formData.append("id", doc.id);
    formData.append("title", title);
    formData.append("content", markdownOutput);

    if (isOwner) {
      formData.append("category", category);
    }

    const result = await updateDocAction(formData);
    setIsSaving(false);

    if (result.success && result.data) {
      setDocContent(markdownOutput);
      setIsEditing(false);
      setLastSavedContent(markdownOutput);
      setHasUnsavedChanges(false);

      const updatedDoc: Note = result.data;

      if (updatedDoc.id !== doc.id) {
        router.push(`/note/${updatedDoc.id}`);
        router.refresh();
        return;
      }

      onUpdate(updatedDoc);
      router.refresh();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(doc.title);
    setCategory(
      doc.category === "Uncategorized" || !doc.category ? "" : doc.category
    );
    setHasUnsavedChanges(false);
  };

  const handleUnsavedChangesSave = async () => {
    await handleSave();
    executePendingNavigation();
  };

  const handleUnsavedChangesDiscard = () => {
    executePendingNavigation();
  };

  const handleBack = () => {
    onBack();
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      const formData = new FormData();
      formData.append("id", doc.id);
      formData.append("category", doc.category || "Uncategorized");
      await deleteDocAction(formData);
      onDelete?.(doc.id);
      onBack();
    }
  };

  const handleExportPDF = async () => {
    try {
      const element =
        document.querySelector(".prose") ||
        document.querySelector("[class*='prose']");
      if (!element) return;

      const filename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      await exportToPDF(element as HTMLElement, filename);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background h-full">
      <div className="bg-background border-b border-border px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 lg:h-8 lg:w-8 p-0 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg lg:text-xl font-bold bg-transparent border-none outline-none focus:ring-0 text-foreground w-full px-0"
                    placeholder="Note title..."
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg lg:text-xl font-bold text-foreground truncate">
                      {title}
                    </h1>
                    {sharingStatus?.isPubliclyShared && (
                      <Globe className="h-3 w-3 text-primary" />
                    )}
                    {sharingStatus?.isShared &&
                      !sharingStatus.isPubliclyShared && (
                        <Users className="h-3 w-3 text-primary" />
                      )}
                  </div>
                  {category && category !== "Uncategorized" && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <FolderOpen className="h-3 w-3" />
                      <span>{category}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="text-xs lg:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-xs lg:text-sm"
                >
                  <Save className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                {autosaveNotes && isAutoSaving && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span>Auto-saving...</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                >
                  <Share2 className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                  title="Export as PDF"
                >
                  <Download className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTableOfContents(!showTableOfContents)}
                  className="hidden lg:flex h-8 w-8 lg:h-10 lg:w-10 p-0"
                  title="Toggle Table of Contents"
                >
                  <List className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                >
                  <Edit3 className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
                {(doc.isShared
                  ? isAdmin || currentUsername === doc.owner
                  : true) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 lg:h-10 lg:w-10 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {isEditing && isOwner && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Category:</span>
              <Dropdown
                value={category}
                options={categoryOptions}
                onChange={setCategory}
                className="w-full lg:w-1/2"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto flex">
        <div className="flex-1 overflow-auto">
          {isEditing ? (
            <TiptapEditor
              content={editorContent}
              onChange={handleEditorContentChange}
              category={category}
            />
          ) : (
            <div className="p-6">
              <UnifiedMarkdownRenderer content={docContent} />
            </div>
          )}
        </div>
        {showTableOfContents && (
          <TableOfContents
            content={
              isEditing
                ? getMarkdownPreviewContent(
                    editorContent,
                    isEditorInMarkdownMode
                  )
                : docContent
            }
          />
        )}
      </div>

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          itemId={doc.id}
          itemTitle={doc.title}
          itemType="document"
          itemCategory={doc.category}
          itemOwner={doc.owner || ""}
        />
      )}

      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onSave={handleUnsavedChangesSave}
        onDiscard={handleUnsavedChangesDiscard}
        noteTitle={doc.title}
      />
    </div>
  );
}
