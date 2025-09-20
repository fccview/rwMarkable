"use server";

import { readSharingMetadata, writeSharingMetadata } from "./sharing-utils";
import { getAllLists } from "../data/actions";
import { getAllDocs } from "../data/notes-actions";
import { Result } from "@/app/_types";

export async function cleanupSharingMetadataAction(): Promise<
  Result<{
    removedChecklists: number;
    removedNotes: number;
  }>
> {
  try {
    const metadata = await readSharingMetadata();
    const allLists = await getAllLists();
    const allDocs = await getAllDocs();

    if (
      !allLists.success ||
      !allDocs.success ||
      !allLists.data ||
      !allDocs.data
    ) {
      return {
        success: false,
        error: "Failed to fetch content for cleanup",
      };
    }

    const existingChecklistIds = new Set(allLists.data.map((list) => list.id));
    const existingNoteIds = new Set(allDocs.data.map((doc) => doc.id));

    let removedChecklists = 0;
    let removedNotes = 0;

    const checklistsToRemove: string[] = [];
    for (const [id, sharedItem] of Object.entries(metadata.checklists)) {
      if (!existingChecklistIds.has(id)) {
        checklistsToRemove.push(id);
        removedChecklists++;
      }
    }

    const notesToRemove: string[] = [];
    for (const [id, sharedItem] of Object.entries(metadata.notes)) {
      if (!existingNoteIds.has(id)) {
        notesToRemove.push(id);
        removedNotes++;
      }
    }

    for (const id of checklistsToRemove) {
      delete metadata.checklists[id];
    }

    for (const id of notesToRemove) {
      delete metadata.notes[id];
    }

    await writeSharingMetadata(metadata);

    return {
      success: true,
      data: {
        removedChecklists,
        removedNotes,
      },
    };
  } catch (error) {
    console.error("Error cleaning up sharing metadata:", error);
    return {
      success: false,
      error: "Failed to cleanup sharing metadata",
    };
  }
}

export async function validateSharingMetadataAction(): Promise<
  Result<{
    validChecklists: number;
    validNotes: number;
    orphanedChecklists: number;
    orphanedNotes: number;
  }>
> {
  try {
    const metadata = await readSharingMetadata();
    const allLists = await getAllLists();
    const allDocs = await getAllDocs();

    if (
      !allLists.success ||
      !allDocs.success ||
      !allLists.data ||
      !allDocs.data
    ) {
      return {
        success: false,
        error: "Failed to fetch content for validation",
      };
    }

    const existingChecklistIds = new Set(allLists.data.map((list) => list.id));
    const existingNoteIds = new Set(allDocs.data.map((doc) => doc.id));

    let validChecklists = 0;
    let validNotes = 0;
    let orphanedChecklists = 0;
    let orphanedNotes = 0;

    for (const [id, sharedItem] of Object.entries(metadata.checklists)) {
      if (existingChecklistIds.has(id)) {
        validChecklists++;
      } else {
        orphanedChecklists++;
      }
    }

    for (const [id, sharedItem] of Object.entries(metadata.notes)) {
      if (existingNoteIds.has(id)) {
        validNotes++;
      } else {
        orphanedNotes++;
      }
    }

    return {
      success: true,
      data: {
        validChecklists,
        validNotes,
        orphanedChecklists,
        orphanedNotes,
      },
    };
  } catch (error) {
    console.error("Error validating sharing metadata:", error);
    return {
      success: false,
      error: "Failed to validate sharing metadata",
    };
  }
}
