"use client";

import { Editor } from "@tiptap/react";
import { ChevronDown, Code } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { codeBlockLanguages } from "@/app/_utils/markdownUtils";
import { useState, useRef, useEffect } from "react";

interface CodeBlockDropdownProps {
    editor: Editor | null;
}

export const CodeBlockDropdown = ({ editor }: CodeBlockDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!editor) return null;

    const setCodeBlock = (language: string) => {
        editor.chain().focus().toggleCodeBlock({ language }).run();
        setIsOpen(false);
    };

    const isCodeBlockActive = editor.isActive('codeBlock');

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant={isCodeBlockActive ? "secondary" : "ghost"}
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1"
            >
                <Code className="h-4 w-4" />
                <span className="text-xs">Code</span>
                <ChevronDown className="h-3 w-3" />
            </Button>

            {isOpen && (
                <div className="fixed bg-background border border-border rounded-md shadow-lg z-[9999] min-w-[200px] max-h-[300px] overflow-y-auto"
                    style={{
                        top: `${dropdownRef.current?.getBoundingClientRect().bottom || 0}px`,
                        left: `${dropdownRef.current?.getBoundingClientRect().left || 0}px`
                    }}>
                    {codeBlockLanguages.map((lang) => (
                        <button
                            key={lang.value}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent text-sm"
                            onClick={() => setCodeBlock(lang.value)}
                        >
                            {lang.icon}
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
