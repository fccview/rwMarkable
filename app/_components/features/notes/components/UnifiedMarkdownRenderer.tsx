"use client";

import { useMemo, useEffect, useState } from "react";
import { CodeBlockRenderer } from "./TipTapComponents/CodeBlockRenderer";
import { FileAttachment } from "@/app/_components/ui/elements/FileAttachment";
import { parseMarkdownToHtml } from "@/app/_utils/markdownUtils";

interface UnifiedMarkdownRendererProps {
  content: string;
  className?: string;
}

export function UnifiedMarkdownRenderer({
  content,
  className = "",
}: UnifiedMarkdownRendererProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !selectedQuote) {
      const quotes = [
        "Nothing... a whole lot of nothing.",
        "What's in the box?!",
        "Hello? Is there anybody in there?",
        "You've got nothing. I've got nothing. Let's do nothing.",
        "The journey of a thousand miles begins with a single step.",
        "Silence is golden.",
        "There's nothing to see here.",
        "Empty.",
        "Hello darkness, my old friend.",
        "I'll be back.",
        "Just start.",
        "This is not the note you are looking for.",
        "I feel like a blank canvas.",
        "Alright, alright, alright.",
        "There is no spoon.",
        "Waiting.",
        "// TODO: Add content here",
        "Error 404: Note not found.",
        "Make it so.",
        "Hello, world!",
        "The rest is still unwritten.",
        "A note about nothing.",
        "What... is your quest?",
        "Where we're going, we don't need roads.",
        "The Nothing is spreading.",
        "This page intentionally left blank.",
        "And now for something completely different.",
        "I'm sorry, Dave. I'm afraid I can't do that.",
        "Space: the final frontier.",
        "Get on with it!",
        "Are you the Keymaster?",
        "All work and no play makes Jack a dull boy.",
        "The sleeper must awaken.",
        "In the beginning...",
        "An enigma, wrapped in a riddle, inside a mystery.",
      ];
      const quoteIndex = Math.floor(Math.random() * quotes.length);
      setSelectedQuote(quotes[quoteIndex]);
    }
  }, [isClient, selectedQuote]);

  useEffect(() => {
    const addHeadingIds = () => {
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      headings.forEach((heading) => {
        if (!heading.id) {
          const text = heading.textContent || "";
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
          heading.id = id;
        }
      });
    };

    const timeoutId = setTimeout(addHeadingIds, 100);
    return () => clearTimeout(timeoutId);
  }, [content]);

  const parsedContent = useMemo(() => {
    if (!content?.trim()) return [];

    const codeBlockRegex = /```(\w*)\r?\n([\s\S]*?)```/g;
    const fileAttachmentRegex = /\[📎 ([^\]]+)\]\((.+?)\)/g;
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    const processContent = (text: string) => {
      const fileAttachmentMatches = Array.from(
        text.matchAll(fileAttachmentRegex)
      );

      if (fileAttachmentMatches.length === 0) {
        return (
          <div
            key={`text-${keyCounter++}`}
            dangerouslySetInnerHTML={{
              __html: parseMarkdownToHtml(text),
            }}
          />
        );
      }

      const elements: JSX.Element[] = [];
      let currentIndex = 0;

      fileAttachmentMatches.forEach((fileMatch, index) => {
        if (fileMatch.index! > currentIndex) {
          const beforeText = text.slice(currentIndex, fileMatch.index);
          if (beforeText.trim()) {
            elements.push(
              <div
                key={`text-${keyCounter++}`}
                dangerouslySetInnerHTML={{
                  __html: parseMarkdownToHtml(beforeText),
                }}
              />
            );
          }
        }

        const fileName = fileMatch[1];
        const fileUrl = fileMatch[2];
        const isImage = fileUrl.includes("/api/image/");
        const mimeType = isImage ? "image/jpeg" : "application/octet-stream";

        elements.push(
          <FileAttachment
            key={`file-${keyCounter++}`}
            url={fileUrl}
            fileName={fileName}
            mimeType={mimeType}
            type={isImage ? "image" : "file"}
            className="my-4"
          />
        );

        currentIndex = fileMatch.index! + fileMatch[0].length;
      });

      if (currentIndex < text.length) {
        const remainingText = text.slice(currentIndex);
        if (remainingText.trim()) {
          elements.push(
            <div
              key={`text-${keyCounter++}`}
              dangerouslySetInnerHTML={{
                __html: parseMarkdownToHtml(remainingText),
              }}
            />
          );
        }
      }

      return elements;
    };

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const beforeCode = content.slice(lastIndex, match.index);
        if (beforeCode.trim()) {
          const processedElements = processContent(beforeCode);
          if (Array.isArray(processedElements)) {
            parts.push(...processedElements);
          } else {
            parts.push(processedElements);
          }
        }
      }

      const language = match[1] || "";
      const code = match[2];
      parts.push(
        <CodeBlockRenderer
          key={`code-${keyCounter++}`}
          code={code}
          language={language}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex);
      if (remaining.trim()) {
        const processedElements = processContent(remaining);
        if (Array.isArray(processedElements)) {
          parts.push(...processedElements);
        } else {
          parts.push(processedElements);
        }
      }
    }

    if (parts.length === 0) {
      const processedElements = processContent(content);
      if (Array.isArray(processedElements)) {
        parts.push(...processedElements);
      } else {
        parts.push(processedElements);
      }
    }

    return parts;
  }, [content]);

  if (!content?.trim()) {
    const displayQuote = selectedQuote || "Nothing... a whole lot of nothing.";

    return (
      <div
        className={`prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl dark:prose-invert ${className}`}
      >
        <div className="text-center py-12">
          <p className="text-lg italic text-muted-foreground">
            &quot;{displayQuote}&quot;
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Start writing your note above!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl dark:prose-invert [&_ul]:list-disc [&_ol]:list-decimal ${className}`}
    >
      {parsedContent}
    </div>
  );
}
