"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/app/_utils/utils";

interface DropdownOption<T extends string> {
  id: T;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DropdownProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (e: React.MouseEvent, optionId: T) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && <selectedOption.icon className="h-4 w-4" />}
          <span className="text-sm font-medium">{selectedOption?.name}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={(e) => handleSelect(e, option.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  option.id === value && "bg-accent text-accent-foreground"
                )}
              >
                {option.icon && <option.icon className="h-4 w-4" />}
                <span>{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
