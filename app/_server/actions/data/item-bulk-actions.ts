"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { getUserDir, writeFile } from "@/app/_server/utils/files";
import { getLists } from "./list-queries";
import { listToMarkdown } from "./checklist-utils";

export const createBulkItemsAction = async (formData: FormData) => {
  try {
    const listId = formData.get("listId") as string;
    const itemsText = formData.get("itemsText") as string;

    const lists = await getLists();
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    const lines = itemsText.split("\n").filter((line) => line.trim());
    const newItems = lines.map((text, index) => ({
      id: `${listId}-${Date.now()}-${index}`,
      text: text.trim(),
      completed: false,
      order: list.items.length + index,
      ...(list.type === "task" && {
        status: "todo" as const,
        timeEntries: [],
      }),
    }));

    const updatedList = {
      ...list,
      items: [...list.items, ...newItems],
      updatedAt: new Date().toISOString(),
    };

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

    await writeFile(filePath, listToMarkdown(updatedList));

    return { success: true, data: newItems };
  } catch (error) {
    return { error: "Failed to create bulk items" };
  }
};

export const bulkToggleItemsAction = async (formData: FormData) => {
  try {
    const listId = formData.get("listId") as string;
    const completed = formData.get("completed") === "true";
    const itemIdsStr = formData.get("itemIds") as string;

    if (!listId || !itemIdsStr) {
      return { error: "List ID and item IDs are required" };
    }

    const itemIds = JSON.parse(itemIdsStr);

    const lists = await getLists();
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    const updatedList = {
      ...list,
      items: list.items.map((item) =>
        itemIds.includes(item.id) ? { ...item, completed } : item
      ),
      updatedAt: new Date().toISOString(),
    };

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
    console.error("Error bulk toggling items:", error);
    return { error: "Failed to bulk toggle items" };
  }
};
