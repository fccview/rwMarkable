import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { common, createLowlight } from "lowlight";
import { TiptapToolbar } from "./TipTapToolbar";
import { useState, useEffect, useMemo, useRef } from "react";
import { marked } from "marked";
import TurndownService from "turndown";
import { Button } from "@/app/_components/ui/elements/button";
import { Eye, FileText } from "lucide-react";

type TiptapEditorProps = {
  content: string;
  onChange: (content: string, isMarkdownMode: boolean) => void;
  category?: string;
};

export const TiptapEditor = ({ content, onChange, category }: TiptapEditorProps) => {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(content);
  const isInitialized = useRef(false);

  const lowlight = createLowlight(common);
  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      bulletListMarker: '-'
    });

    return service;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      if (!isMarkdownMode) {
        onChange(editor.getHTML(), false);
      }
    },
    editorProps: {
      attributes: {
        class:
          "text-foreground m-5 focus:outline-none",
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;

          if ($from.parent.type.name === 'listItem') {
            const isEmpty = $from.parent.content.size === 0;
            if (isEmpty) {
              event.preventDefault();
              const tr = state.tr.setBlockType($from.pos, $from.pos, state.schema.nodes.paragraph);
              view.dispatch(tr);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && !isInitialized.current) {
      isInitialized.current = true;
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMarkdownContent(newContent);
    onChange(newContent, true);
  };

  const toggleMode = () => {
    if (isMarkdownMode) {
      setIsMarkdownMode(false);
      if (editor) {
        const htmlContent = marked.parse(markdownContent);
        editor.commands.setContent(htmlContent);
      }
    } else {
      setIsMarkdownMode(true);
      if (editor) {
        const htmlContent = editor.getHTML();
        const markdownOutput = turndownService.turndown(htmlContent);
        setMarkdownContent(markdownOutput);
      }
    }
  };


  return (
    <div className="flex flex-col h-full">
      <div className="bg-background border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <TiptapToolbar editor={editor} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleMode}
          className="ml-2 flex-shrink-0"
        >
          {isMarkdownMode ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Markdown</span>
            </>
          )}
        </Button>
      </div>

      {isMarkdownMode ? (
        <div className="flex-1 flex flex-col md:flex-row">
          <div className="flex-1 p-4">
            <textarea
              value={markdownContent}
              onChange={handleMarkdownChange}
              className="w-full h-full p-4 bg-background text-foreground border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Write your markdown here..."
            />
          </div>
          <div className="flex-1 p-4 border-t md:border-t-0 md:border-l border-border overflow-y-auto">
            <div
              className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl dark:prose-invert [&_ul]:list-disc [&_ol]:list-decimal"
              dangerouslySetInnerHTML={{ __html: marked.parse(markdownContent) }}
            />
          </div>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'A') {
              e.preventDefault();
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
};
