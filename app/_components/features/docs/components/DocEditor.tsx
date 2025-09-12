"use client";

import { useState, useEffect, useMemo } from "react";
import { TiptapEditor } from "./TipTapComponents/TipTapEditor";
import { marked } from "marked";
import TurndownService from "turndown";

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
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Dropdown } from "@/app/_components/ui/elements/dropdown";
import { ShareModal } from "@/app/_components/ui/modals/sharing/ShareModal";
import { Note, Category } from "@/app/_types";
import { exportToPDF } from "@/app/_utils/pdf-export";
import {
  updateDocAction,
  deleteDocAction,
} from "@/app/_server/actions/data/docs-actions";
import { getCurrentUser } from "@/app/_server/actions/users/current";

interface DocEditorProps {
  doc: Note;
  categories: Category[];
  onUpdate: () => void;
  onBack: () => void;
  onDelete?: (deletedId: string) => void;
}

export function DocEditor({
  doc,
  categories,
  onUpdate,
  onBack,
  onDelete,
}: DocEditorProps) {
  const [docContent, setDocContent] = useState(doc.content || "");
  const [editorContent, setEditorContent] = useState("");
  const [isEditorInMarkdownMode, setIsEditorInMarkdownMode] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState(doc.category || "Uncategorized");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      emDelimiter: "*",
      bulletListMarker: "-",
    });
    return service;
  }, []);

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
    console.log(
      "Setting category:",
      docCategory,
      "from doc.category:",
      doc.category
    );
    setCategory(docCategory);
    setEditorContent(marked.parse(markdownContent) as string);
    setIsEditing(false);
  }, [doc]);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user?.username || null);
        setIsOwner(user?.username === doc.owner);
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };
    checkOwnership();
  }, [doc.owner]);

  const handleEdit = () => {
    setEditorContent(marked.parse(docContent) as string);
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
      markdownOutput = turndownService.turndown(editorContent);
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

    if (result.success) {
      setDocContent(markdownOutput);
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(doc.title);
    setCategory(
      doc.category === "Uncategorized" || !doc.category ? "" : doc.category
    );
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
      const element = document.querySelector('.prose');
      if (!element) return;

      const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      await exportToPDF(element as HTMLElement, filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
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
              onClick={onBack}
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
                    {doc.isShared && (
                      <div title="Shared item">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
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
                  onClick={handleEdit}
                  className="h-8 w-8 lg:h-10 lg:w-10 p-0"
                >
                  <Edit3 className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 lg:h-10 lg:w-10 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
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

      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <TiptapEditor
            content={editorContent}
            onChange={handleEditorContentChange}
            category={category}
          />
        ) : (
          <div
            className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none dark:prose-invert [&_ul]:list-disc [&_ol]:list-decimal"
            dangerouslySetInnerHTML={{ __html: marked.parse(docContent) }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                e.preventDefault();
                const href = target.getAttribute('href');
                if (href) {
                  window.open(href, '_blank', 'noopener,noreferrer');
                }
              }
            }}
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
    </div>
  );
}
