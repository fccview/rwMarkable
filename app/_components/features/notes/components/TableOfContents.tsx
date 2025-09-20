"use client";

import { useMemo, useEffect, useState } from "react";
import { List } from "lucide-react";
import { cn } from "@/app/_utils/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
  element?: HTMLElement;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);

  const extractHeadings = useMemo(() => {
    if (!content?.trim()) return [];

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      extractedHeadings.push({
        id,
        text,
        level,
      });
    }

    return extractedHeadings;
  }, [content]);

  useEffect(() => {
    setHeadings(extractHeadings);
  }, [extractHeadings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target.id);

        if (visibleHeadings.length > 0) {
          setActiveHeading(visibleHeadings[0]);
        }
      },
      {
        rootMargin: "-10% 0% -70% 0%",
        threshold: 0.1,
      }
    );

    const timeoutId = setTimeout(() => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [headings]);

  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (headings.length === 0) {
    return (
      <div
        className={cn(
          "hidden lg:flex w-64 bg-background border-l border-border flex-col",
          className
        )}
      >
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Contents</h3>
        </div>
        <div className="flex-1 p-3">
          <p className="text-sm text-muted-foreground">No headings found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "hidden lg:flex w-64 bg-background border-l border-border flex-col",
        className
      )}
    >
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Contents</h3>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => {
              scrollToHeading(heading.id);
              setActiveHeading(heading.id);
            }}
            className={cn(
              "block w-full text-left text-sm py-1 hover:text-foreground",
              "focus:outline-none",
              activeHeading === heading.id
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
            style={{
              paddingLeft: `${(heading.level - 1) * 16}px`,
            }}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
