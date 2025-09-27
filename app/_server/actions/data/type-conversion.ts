"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { ChecklistType } from "@/app/_types";
import { getUserDir, writeFile } from "@/app/_server/utils/files";
import { getLists } from "./list-queries";
import { listToMarkdown } from "./checklist-utils";

export const convertChecklistTypeAction = async (formData: FormData) => {
  try {
    const listId = formData.get("listId") as string;
    const newType = formData.get("newType") as ChecklistType;

    if (!listId || !newType) {
      return { error: "List ID and type are required" };
    }

    const lists = await getLists();
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    if (list.type === newType) {
      return { success: true };
    }

    let filePath: string;

    if (list.isShared) {
      const ownerDir = path.join(
        process.cwd(),
        "data",
        "checklists",
        list.owner!
      );
      filePath = path.join(
        ownerDir,
        list.category || "Uncategorized",
        `${listId}.md`
      );
    } else {
      const userDir = await getUserDir();
      filePath = path.join(
        userDir,
        list.category || "Uncategorized",
        `${listId}.md`
      );
    }

    let convertedItems: any[];

    if (newType === "task") {
      convertedItems = list.items.map((item) => ({
        ...item,
        status: item.completed ? "completed" : "todo",
        timeEntries: [],
      }));
    } else {
      convertedItems = list.items.map((item) => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
        order: item.order,
      }));
    }

    const updatedList = {
      ...list,
      type: newType,
      items: convertedItems,
      updatedAt: new Date().toISOString(),
    };

    await writeFile(filePath, listToMarkdown(updatedList));

    try {
      revalidatePath("/");
    } catch (error) {
      console.warn(
        "Cache revalidation failed, but data was saved successfully:",
        error
      );
    }
    return { success: true, data: updatedList };
  } catch (error) {
    console.error("Error converting checklist type:", error);
    return { error: "Failed to convert checklist type" };
  }
};
