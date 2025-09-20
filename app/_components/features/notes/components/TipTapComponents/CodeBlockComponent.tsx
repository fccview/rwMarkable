"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { CodeBlockRenderer } from "./CodeBlockRenderer";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  getLanguageFromCode,
  languageIcons,
  codeBlockLanguages,
} from "@/app/_utils/markdownUtils";
import { Code, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function CodeBlockComponent({
  node,
  updateAttributes,
  editor,
}: any) {
  const language = node.attrs.language || "text";
  const code = node.textContent || "";
  const isEditable = editor?.isEditable;
  const detectedLanguage =
    language === "text" || !language ? getLanguageFromCode(code) : language;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLanguage: string) => {
    updateAttributes({ language: newLanguage });
    setIsDropdownOpen(false);
  };

  if (!isEditable) {
    return (
      <NodeViewWrapper className="code-block-wrapper">
        <CodeBlockRenderer code={code} language={language} />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div
        className="relative group my-4 overflow-hidden"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        {detectedLanguage !== "text" && (
          <div
            className="flex items-center justify-between px-3 py-1"
            style={{
              backgroundColor: "#1a202c",
              borderBottom: "1px solid #4a5568",
            }}
          >
            <div></div>
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-1.5 text-xs font-mono hover:bg-white hover:bg-opacity-10 px-2 py-1 rounded transition-colors"
                style={{ color: "#a0aec0" }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {languageIcons[detectedLanguage] || (
                  <Code className="h-3 w-3" />
                )}
                <span className="uppercase tracking-wide">
                  {detectedLanguage}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {isDropdownOpen && (
                <div
                  className="fixed bg-background border border-border rounded-md shadow-lg z-[9999] min-w-[200px] max-h-[300px] overflow-y-auto"
                  style={{
                    top: `${
                      dropdownRef.current?.getBoundingClientRect().bottom || 0
                    }px`,
                    right: `${
                      window.innerWidth -
                      (dropdownRef.current?.getBoundingClientRect().right || 0)
                    }px`,
                  }}
                >
                  {codeBlockLanguages.map((lang) => (
                    <button
                      key={lang.value}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent text-sm"
                      onClick={() => handleLanguageChange(lang.value)}
                    >
                      {lang.icon}
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 pointer-events-none">
            {/* @ts-ignore - react-syntax-highlighter has type issues with Next.js */}
            <SyntaxHighlighter
              language={detectedLanguage}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: "0.75rem",
                borderRadius: 0,
                fontSize: "0.875rem",
                background: "#1a1a1a",
                border: "none",
              }}
              codeTagProps={{
                style: {
                  background: "transparent",
                },
              }}
              PreTag={({ children, ...props }) => (
                <pre
                  {...props}
                  style={{
                    ...props.style,
                    background: "#1a1a1a",
                    caretColor: "rgb(var(--foreground))",
                  }}
                >
                  {children}
                </pre>
              )}
              showLineNumbers={false}
              wrapLines={false}
            >
              {code}
            </SyntaxHighlighter>
          </div>
          <NodeViewContent
            className="relative z-10 bg-transparent p-4 font-mono text-sm outline-none border-none w-full min-h-[3rem] whitespace-pre-wrap"
            style={{
              caretColor: "#ffffff",
              color: "transparent",
            }}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
