"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Code } from "lucide-react";
import { useState } from "react";
import { Button } from "@/app/_components/ui/elements/button";
import { languageIcons, getLanguageFromCode } from "@/app/_utils/markdownUtils";



interface CodeBlockRendererProps {
    code: string;
    language?: string;
    showHeader?: boolean;
    showCopyButton?: boolean;
    className?: string;
}

export function CodeBlockRenderer({
    code,
    language,
    showHeader = true,
    showCopyButton = true,
    className = ""
}: CodeBlockRendererProps) {
    const [copied, setCopied] = useState(false);
    const detectedLanguage = language === 'text' || !language ? getLanguageFromCode(code) : language;

    const copyToClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={`relative group my-4 overflow-hidden ${className}`} style={{ backgroundColor: '#1a1a1a' }}>
            {showHeader && detectedLanguage !== 'text' && (
                <div className="flex items-center justify-between px-3 py-1" style={{ backgroundColor: '#1a202c', borderBottom: '1px solid #4a5568' }}>
                    <div></div>
                    <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#a0aec0' }}>
                        {languageIcons[detectedLanguage] || <Code className="h-3 w-3" />}
                        <span className="uppercase tracking-wide">{detectedLanguage}</span>
                    </div>
                    {showCopyButton && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyToClipboard}
                            className="opacity-50 hover:opacity-100 transition-opacity h-5 w-5 p-0"
                            style={{ color: '#a0aec0' }}
                        >
                            {copied ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                </div>
            )}

            <div className="relative">
                {showCopyButton && detectedLanguage === 'text' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyToClipboard}
                        className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        style={{ color: '#a0aec0' }}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                )}

                {/* @ts-ignore - react-syntax-highlighter has type issues with Next.js */}
                <SyntaxHighlighter
                    language={detectedLanguage}
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: '0.875rem',
                        background: '#1a1a1a',
                        padding: '0.75rem',
                        border: 'none',
                    }}
                    codeTagProps={{
                        style: {
                            background: 'transparent',
                        }
                    }}
                    PreTag={({ children, ...props }) => (
                        <pre {...props} style={{ ...props.style, background: '#1a1a1a', caretColor: 'rgb(var(--foreground))' }}>
                            {children}
                        </pre>
                    )}
                    showLineNumbers={false}
                    wrapLines={false}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}