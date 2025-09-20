"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { Checklist, ChecklistType } from "@/app/_types";
import {
  getUserDir,
  ensureDir,
  writeFile,
  deleteFile,
} from "@/app/_server/utils/files";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import { removeSharedItem } from "@/app/_server/actions/sharing/sharing-utils";
import { getLists, getAllLists } from "./list-queries";
import { listToMarkdown } from "./checklist-utils";
import { isAdmin } from "@/app/_server/actions/auth/utils";

export const createListAction = async (formData: FormData) => {
  try {
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "Uncategorized";
    const type = (formData.get("type") as ChecklistType) || "simple";

    const userDir = await getUserDir();
    const id = Date.now().toString();
    const categoryDir = path.join(userDir, category);
    const filePath = path.join(categoryDir, `${id}.md`);

    await ensureDir(categoryDir);

    const newList: Checklist = {
      id,
      title,
      type,
      category,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await writeFile(filePath, listToMarkdown(newList));
    return { success: true, data: newList };
  } catch (error) {
    console.error("Error creating list:", error);
    return { error: "Failed to create list" };
  }
};

export const updateListAction = async (formData: FormData) => {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;

    const isAdminUser = await isAdmin();
    const lists = await (isAdminUser ? getAllLists() : getLists());
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const currentList = lists.data.find((list) => list.id === id);
    if (!currentList) {
      throw new Error("List not found");
    }

    const updatedList: Checklist = {
      ...currentList,
      title,
      category: category || currentList.category,
      updatedAt: new Date().toISOString(),
    };

    const ownerDir = path.join(
      process.cwd(),
      "data",
      "checklists",
      currentList.owner!
    );
    const filePath = path.join(
      ownerDir,
      updatedList.category || "Uncategorized",
      `${id}.md`
    );

    let oldFilePath: string | null = null;
    if (category && category !== currentList.category) {
      oldFilePath = path.join(
        ownerDir,
        currentList.category || "Uncategorized",
        `${id}.md`
      );
    }

    await writeFile(filePath, listToMarkdown(updatedList));

    if (oldFilePath && oldFilePath !== filePath) {
      await deleteFile(oldFilePath);
    }

    return { success: true, data: updatedList };
  } catch (error) {
    return { error: "Failed to update list" };
  }
};

export const deleteListAction = async (formData: FormData) => {
  try {
    const id = formData.get("id") as string;
    const category = (formData.get("category") as string) || "Uncategorized";

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "Not authenticated" };
    }

    const isAdminUser = await isAdmin();
    const lists = await (isAdminUser ? getAllLists() : getLists());
    if (!lists.success || !lists.data) {
      return { error: "Failed to fetch lists" };
    }

    const list = lists.data.find((l) => l.id === id);
    if (!list) {
      return { error: "List not found" };
    }

    let filePath: string;

    if (list.isShared) {
      if (!currentUser.isAdmin && currentUser.username !== list.owner) {
        return { error: "Unauthorized to delete this shared item" };
      }

      const ownerDir = path.join(
        process.cwd(),
        "data",
        "checklists",
        list.owner!
      );
      filePath = path.join(ownerDir, category, `${id}.md`);
    } else {
      const userDir = await getUserDir();
      filePath = path.join(userDir, category, `${id}.md`);
    }

    await deleteFile(filePath);

    if (list.isShared && list.owner) {
      await removeSharedItem(id, "checklist", list.owner);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete list" };
  }
};
