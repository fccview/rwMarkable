"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/app/_utils/utils";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  children,
  align = "left",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1 bg-background border border-border rounded-md shadow-lg z-50 py-1 min-w-[160px]",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === DropdownMenuItem) {
              return React.cloneElement(child, {
                onClose: () => setIsOpen(false),
              } as any);
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "destructive";
  onClose?: () => void;
}

export function DropdownMenuItem({
  onClick,
  icon,
  children,
  variant = "default",
  onClose,
}: DropdownMenuItemProps) {
  const handleClick = () => {
    onClick();
    onClose?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
        variant === "destructive" &&
        "text-destructive hover:text-destructive/80"
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}
