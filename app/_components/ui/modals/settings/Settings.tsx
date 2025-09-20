"use client";

import {
  Settings,
  Moon,
  Sun,
  Sunset,
  Waves,
  Trees,
  CloudMoon,
  Palette,
  Terminal,
  Github,
  Monitor,
  Coffee,
  Flower2,
  Flame,
  Palmtree,
  Building,
  Save,
  Smile,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { Dropdown } from "@/app/_components/ui/elements/dropdown";
import { Modal } from "@/app/_components/ui/elements/modal";
import { useSettings } from "@/app/_utils/settings-store";
import { useRef, useEffect, useState } from "react";
import { getAllThemes } from "@/app/_consts/themes";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP = {
  Sun,
  Moon,
  Sunset,
  Waves,
  Trees,
  CloudMoon,
  Palette,
  Terminal,
  Github,
  Monitor,
  Coffee,
  Flower2,
  Flame,
  Palmtree,
  Building,
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, showEmojis, autosaveNotes, setTheme, setShowEmojis, setAutosaveNotes } = useSettings();
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const allThemes = await getAllThemes();
        setThemes(allThemes);
      } catch (error) {
        console.error("Failed to load themes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadThemes();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      titleIcon={<Settings className="h-5 w-5 text-muted-foreground" />}
    >
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Theme</h3>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading themes...</div>
        ) : (
          <Dropdown value={theme} options={themes} onChange={setTheme} />
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Features</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Autosave Notes</span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={autosaveNotes}
                onChange={(e) => setAutosaveNotes(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`block w-10 h-6 rounded-full transition-colors ${autosaveNotes ? "bg-primary" : "bg-muted"
                  }`}
              >
                <div
                  className={`absolute left-1 top-1 bg-card w-4 h-4 rounded-full transition-transform ${autosaveNotes ? "translate-x-4" : "translate-x-0"
                    }`}
                />
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Smile className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Show Emojis on checklists</span>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={showEmojis}
                onChange={(e) => setShowEmojis(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`block w-10 h-6 rounded-full transition-colors ${showEmojis ? "bg-primary" : "bg-muted"
                  }`}
              >
                <div
                  className={`absolute left-1 top-1 bg-card w-4 h-4 rounded-full transition-transform ${showEmojis ? "translate-x-4" : "translate-x-0"
                    }`}
                />
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
