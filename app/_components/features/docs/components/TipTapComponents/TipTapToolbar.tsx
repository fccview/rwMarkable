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
  Square,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { ImageModal } from "@/app/_components/ui/modals/image/ImageModal";
import { useState } from "react";

type ToolbarProps = {
  editor: Editor | null;
};

export const TiptapToolbar = ({ editor }: ToolbarProps) => {
  const [showImageModal, setShowImageModal] = useState(false);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const setCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock({ language: "javascript" }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleImageSelect = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
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
        onClick={() => handleButtonClick(() => editor.chain().focus().toggleBold().run())}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(() => editor.chain().focus().toggleItalic().run())}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("strike") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(() => editor.chain().focus().toggleStrike().run())}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("code") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(() => editor.chain().focus().toggleCode().run())}
      >
        <Code className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <Button
        variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(setCodeBlock)}
      >
        <Square className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <Button
        variant={
          editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
        }
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(() => editor.chain().focus().toggleBulletList().run())}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleButtonClick(() => editor.chain().focus().toggleBlockquote().run())}
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
        onClick={() => setShowImageModal(true)}
        title="Upload image"
      >
        <Upload className="h-4 w-4" />
      </Button>
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSelectImage={handleImageSelect}
        category=""
      />
    </div>
  );
};
