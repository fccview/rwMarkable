export type ChecklistType = "simple" | "task";

export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface Item {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  status?: "todo" | "in_progress" | "completed" | "paused";
  timeEntries?: TimeEntry[];
  estimatedTime?: number;
  targetDate?: string;
}

export interface Checklist {
  id: string;
  title: string;
  type: ChecklistType;
  category?: string;
  items: Item[];
  createdAt: string;
  updatedAt: string;
  owner?: string;
  isShared?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  owner?: string;
  isShared?: boolean;
}

export interface Category {
  name: string;
  count: number;
  path: string;
  parent?: string;
  level: number;
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
  lastLogin?: string;
  apiKey?: string;
}

export interface SharedItem {
  id: string;
  type: "checklist" | "document";
  title: string;
  owner: string;
  sharedWith: string[];
  sharedAt: string;
  category?: string;
  filePath: string;
  isPubliclyShared?: boolean;
}

export interface SharingMetadata {
  checklists: Record<string, SharedItem>;
  notes: Record<string, SharedItem>;
}

export interface SharingPermissions {
  canRead: boolean;
  canWrite: boolean;
  canShare: boolean;
}

export interface EmojiDictionary {
  [key: string]: string;
}

export type AppMode = "checklists" | "notes";
