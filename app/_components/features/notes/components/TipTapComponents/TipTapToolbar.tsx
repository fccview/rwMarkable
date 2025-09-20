import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  List,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Paperclip,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { FileModal } from "@/app/_components/ui/modals/file/FileModal";
import { CodeBlockDropdown } from "./CodeBlockDropdown";
import { useState } from "react";

type ToolbarProps = {
  editor: Editor | null;
};

export const TiptapToolbar = ({ editor }: ToolbarProps) => {
  const [showFileModal, setShowFileModal] = useState(false);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };


  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleFileSelect = (url: string, type: 'image' | 'file', fileName?: string, mimeType?: string) => {
    if (type === 'image') {
      editor.chain().focus().setImage({ src: url }).run();
    } else {
      const finalFileName = fileName || url.split('/').pop() || 'file';
      const finalMimeType = mimeType || 'application/octet-stream';
      editor.chain().focus().setFileAttachment({
        url,
        fileName: finalFileName,
        mimeType: finalMimeType,
        type: 'file'
      }).run();
    }
  };

  const handleButtonClick = (command: () => void) => {
    const { from, to } = editor.state.selection;
    command();
    editor.commands.setTextSelection({ from, to });
  };

  return (
    <div className="bg-background px-4 py-2 flex items-center gap-1 flex-wrap">
      <Button
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          handleButtonClick(() => editor.chain().focus().toggleBold().run())
        }
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          handleButtonClick(() => editor.chain().focus().toggleItalic().run())
        }
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("strike") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          handleButtonClick(() => editor.chain().focus().toggleStrike().run())
        }
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("code") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          handleButtonClick(() => editor.chain().focus().toggleCode().run())
        }
      >
        <Code className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <CodeBlockDropdown editor={editor} />
      <div className="w-px h-6 bg-border mx-2" />
      <Button
        variant={
          editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
        }
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          handleButtonClick(() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          )
        }
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          handleButtonClick(() =>
            editor.chain().focus().toggleBulletList().run()
          )
        }
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          handleButtonClick(() =>
            editor.chain().focus().toggleBlockquote().run()
          )
        }
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("link") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(setLink)}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(addImage)}
        title="Add image from URL"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowFileModal(true)}
        title="Upload files"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <FileModal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        onSelectFile={handleFileSelect}
        category=""
      />
    </div>
  );
};
