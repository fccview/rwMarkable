"use server";

import fs from "fs/promises";
import path from "path";
import { SharingMetadata, SharedItem } from "@/app/_types";

const SHARING_DIR = path.join(process.cwd(), "data", "sharing");
const SHARED_ITEMS_FILE = path.join(SHARING_DIR, "shared-items.json");

async function ensureSharingDir() {
  try {
    await fs.access(SHARING_DIR);
  } catch {
    await fs.mkdir(SHARING_DIR, { recursive: true });
  }
}

export async function readSharingMetadata(): Promise<SharingMetadata> {
  await ensureSharingDir();

  try {
    const content = await fs.readFile(SHARED_ITEMS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return {
      checklists: {},
      notes: {},
    };
  }
}

export async function writeSharingMetadata(
  metadata: SharingMetadata
): Promise<void> {
  await ensureSharingDir();
  await fs.writeFile(
    SHARED_ITEMS_FILE,
    JSON.stringify(metadata, null, 2),
    "utf-8"
  );
}

export async function generateSharingId(
  owner: string,
  itemId: string,
  type: "checklist" | "document"
): Promise<string> {
  return `${owner}-${itemId}-${type}`;
}

export async function addSharedItem(
  itemId: string,
  type: "checklist" | "document",
  title: string,
  owner: string,
  sharedWith: string[],
  category?: string,
  filePath?: string,
  isPubliclyShared?: boolean
): Promise<void> {
  const metadata = await readSharingMetadata();
  const sharingId = await generateSharingId(owner, itemId, type);

  const sharedItem: SharedItem = {
    id: itemId,
    type,
    title,
    owner,
    sharedWith,
    sharedAt: new Date().toISOString(),
    category,
    filePath:
      filePath || `${owner}/${category || "Uncategorized"}/${itemId}.md`,
    isPubliclyShared: isPubliclyShared || false,
  };

  if (type === "checklist") {
    metadata.checklists[sharingId] = sharedItem;
  } else {
    metadata.notes[sharingId] = sharedItem;
  }

  await writeSharingMetadata(metadata);
}

export async function removeSharedItem(
  itemId: string,
  type: "checklist" | "document",
  owner: string
): Promise<void> {
  const metadata = await readSharingMetadata();
  const sharingId = await generateSharingId(owner, itemId, type);

  if (type === "checklist") {
    delete metadata.checklists[sharingId];
  } else {
    delete metadata.notes[sharingId];
  }

  await writeSharingMetadata(metadata);
}

export async function updateSharedItem(
  itemId: string,
  type: "checklist" | "document",
  owner: string,
  updates: Partial<SharedItem>
): Promise<void> {
  const metadata = await readSharingMetadata();
  const sharingId = await generateSharingId(owner, itemId, type);

  if (type === "checklist") {
    if (metadata.checklists[sharingId]) {
      metadata.checklists[sharingId] = {
        ...metadata.checklists[sharingId],
        ...updates,
      };
    }
  } else {
    if (metadata.notes[sharingId]) {
      metadata.notes[sharingId] = {
        ...metadata.notes[sharingId],
        ...updates,
      };
    }
  }

  await writeSharingMetadata(metadata);
}

export async function getItemsSharedWithUser(username: string): Promise<{
  checklists: SharedItem[];
  notes: SharedItem[];
}> {
  const metadata = await readSharingMetadata();

  const sharedChecklists = Object.values(metadata.checklists).filter((item) =>
    item.sharedWith.includes(username)
  );

  const sharedNotes = Object.values(metadata.notes).filter((item) =>
    item.sharedWith.includes(username)
  );

  return {
    checklists: sharedChecklists,
    notes: sharedNotes,
  };
}

export async function getItemsSharedByUser(username: string): Promise<{
  checklists: SharedItem[];
  notes: SharedItem[];
}> {
  const metadata = await readSharingMetadata();

  const sharedChecklists = Object.values(metadata.checklists).filter(
    (item) => item.owner === username
  );

  const sharedNotes = Object.values(metadata.notes).filter(
    (item) => item.owner === username
  );

  return {
    checklists: sharedChecklists,
    notes: sharedNotes,
  };
}

export async function isItemSharedWithUser(
  itemId: string,
  type: "checklist" | "document",
  owner: string,
  username: string
): Promise<boolean> {
  const metadata = await readSharingMetadata();
  const sharingId = await generateSharingId(owner, itemId, type);

  if (type === "checklist") {
    return (
      metadata.checklists[sharingId]?.sharedWith.includes(username) || false
    );
  } else {
    return metadata.notes[sharingId]?.sharedWith.includes(username) || false;
  }
}

export async function getItemSharingMetadata(
  itemId: string,
  type: "checklist" | "document",
  owner: string
): Promise<SharedItem | null> {
  const metadata = await readSharingMetadata();
  const sharingId = await generateSharingId(owner, itemId, type);

  if (type === "checklist") {
    return metadata.checklists[sharingId] || null;
  } else {
    return metadata.notes[sharingId] || null;
  }
}
