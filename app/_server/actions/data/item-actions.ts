"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { getUserDir, writeFile } from "@/app/_server/utils/files";
import { getLists, getAllLists } from "./list-queries";
import { listToMarkdown } from "./checklist-utils";
import { isAdmin } from "@/app/_server/actions/auth/utils";

export const updateItemAction = async (
  formData: FormData,
  username?: string,
  skipRevalidation = false
) => {
  try {
    const listId = formData.get("listId") as string;
    const itemId = formData.get("itemId") as string;
    const completed = formData.get("completed") === "true";
    const text = formData.get("text") as string;

    const isAdminUser = await isAdmin();
    const lists = await (isAdminUser ? getAllLists() : getLists(username));
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    if (username && list.owner !== username && !isAdminUser) {
      throw new Error("List not found");
    }

    const updatedList = {
      ...list,
      items: list.items.map((item) =>
        item.id === itemId
          ? { ...item, completed, ...(text && { text }) }
          : item
      ),
      updatedAt: new Date().toISOString(),
    };

    const ownerDir = path.join(
      process.cwd(),
      "data",
      "checklists",
      list.owner!
    );
    const filePath = path.join(
      ownerDir,
      list.category || "Uncategorized",
      `${listId}.md`
    );

    await writeFile(filePath, listToMarkdown(updatedList));

    if (!skipRevalidation) {
      revalidatePath("/");
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to update item" };
  }
};

export const createItemAction = async (
  formData: FormData,
  username?: string,
  skipRevalidation = false
) => {
  try {
    const listId = formData.get("listId") as string;
    const text = formData.get("text") as string;
    const status = formData.get("status") as string;
    const timeStr = formData.get("time") as string;

    const isAdminUser = await isAdmin();
    const lists = await (isAdminUser ? getAllLists() : getLists(username));
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    if (username && list.owner !== username && !isAdminUser) {
      throw new Error("List not found");
    }

    let timeEntries: any[] = [];
    if (timeStr && timeStr !== "0") {
      try {
        timeEntries = JSON.parse(timeStr);
      } catch (e) {
        console.error("Failed to parse time entries:", e);
        timeEntries = [];
      }
    }

    const newItem = {
      id: `${listId}-${Date.now()}`,
      text,
      completed: false,
      order: list.items.length,
      ...(list.type === "task" && {
        status:
          (status as "todo" | "in_progress" | "completed" | "paused") || "todo",
        timeEntries,
      }),
    };

    const updatedList = {
      ...list,
      items: [...list.items, newItem],
      updatedAt: new Date().toISOString(),
    };

    const ownerDir = path.join(
      process.cwd(),
      "data",
      "checklists",
      list.owner!
    );
    const filePath = path.join(
      ownerDir,
      list.category || "Uncategorized",
      `${listId}.md`
    );

    await writeFile(filePath, listToMarkdown(updatedList));

    if (!skipRevalidation) {
      revalidatePath("/");
    }

    return { success: true, data: newItem };
  } catch (error) {
    return { error: "Failed to create item" };
  }
};

export const deleteItemAction = async (formData: FormData) => {
  try {
    const listId = formData.get("listId") as string;
    const itemId = formData.get("itemId") as string;

    const lists = await getLists();
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    const itemExists = list.items.some((item) => item.id === itemId);
    if (!itemExists) {
      return { success: true };
    }

    const updatedList = {
      ...list,
      items: list.items.filter((item) => item.id !== itemId),
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

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete item" };
  }
};

export const reorderItemsAction = async (formData: FormData) => {
  try {
    const listId = formData.get("listId") as string;
    const itemIds = JSON.parse(formData.get("itemIds") as string) as string[];
    const currentItems = JSON.parse(
      formData.get("currentItems") as string
    ) as any[];

    const isAdminUser = await isAdmin();
    const lists = await (isAdminUser ? getAllLists() : getLists());
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    const itemMap = new Map(currentItems.map((item) => [item.id, item]));

    const updatedItems = itemIds.map((id, index) => {
      const item = itemMap.get(id);
      if (!item) throw new Error(`Item ${id} not found`);
      return { ...item, order: index };
    });

    const updatedList = {
      ...list,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    const ownerDir = path.join(
      process.cwd(),
      "data",
      "checklists",
      list.owner!
    );
    const filePath = path.join(
      ownerDir,
      list.category || "Uncategorized",
      `${listId}.md`
    );

    const markdownContent = listToMarkdown(updatedList);

    await writeFile(filePath, markdownContent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    return { success: true };
  } catch (error) {
    return { error: "Failed to reorder items" };
  }
};

export const updateItemStatusAction = async (formData: FormData) => {
  try {
    const listId = formData.get("listId") as string;
    const itemId = formData.get("itemId") as string;
    const status = formData.get("status") as string;
    const timeEntriesStr = formData.get("timeEntries") as string;

    if (!listId || !itemId) {
      return { error: "List ID and item ID are required" };
    }

    if (!status && !timeEntriesStr) {
      return { error: "Either status or timeEntries must be provided" };
    }

    const isAdminUser = await isAdmin();
    const lists = await (isAdminUser ? getAllLists() : getLists());
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    const updatedList = {
      ...list,
      items: list.items.map((item) => {
        if (item.id === itemId) {
          const updates: any = {};
          if (status) updates.status = status as any;
          if (timeEntriesStr) {
            try {
              updates.timeEntries = JSON.parse(timeEntriesStr);
            } catch (e) {
              console.error("Failed to parse timeEntries:", e);
            }
          }
          return { ...item, ...updates };
        }
        return item;
      }),
      updatedAt: new Date().toISOString(),
    };

    const ownerDir = path.join(
      process.cwd(),
      "data",
      "checklists",
      list.owner!
    );
    const filePath = path.join(
      ownerDir,
      list.category || "Uncategorized",
      `${listId}.md`
    );

    await writeFile(filePath, listToMarkdown(updatedList));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating item status:", error);
    return { error: "Failed to update item status" };
  }
};
