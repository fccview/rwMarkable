import { FileText, Clock } from "lucide-react";
import { Note } from "@/app/_types";
import { formatRelativeTime } from "@/app/_utils/date-utils";

interface NoteCardProps {
  note: Note;
  onSelect: (id: string) => void;
}

export function NoteCard({ note, onSelect }: NoteCardProps) {
  const getPreview = (content: string) => {
    const plainText = content
      .replace(/[#*_`~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    return plainText.length > 100
      ? plainText.substring(0, 100) + "..."
      : plainText;
  };

  return (
    <div
      onClick={() => onSelect(note.id)}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50 group relative"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors flex-1 truncate pr-2">
            {note.title}
          </h3>
          {note.category && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex-shrink-0 ml-2">
              {note.category}
            </span>
          )}
        </div>

        {note.content && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {getPreview(note.content)}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>Note</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(note.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
