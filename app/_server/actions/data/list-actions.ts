"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { Checklist, ChecklistType } from "@/app/_types";
import { generateUniqueFilename, sanitizeFilename } from "../../utils/filename-utils";
import {
  getUserDir,
  ensureDir,
  writeFile,
  deleteFile,
} from "@/app/_server/utils/files";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import {
  removeSharedItem,
  updateSharedItem,
} from "@/app/_server/actions/sharing/sharing-utils";
import { getLists, getAllLists } from "./list-queries";
import { listToMarkdown } from "./checklist-utils";
import { isAdmin } from "@/app/_server/actions/auth/utils";

export const createListAction = async (formData: FormData) => {
  try {
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "Uncategorized";
    const type = (formData.get("type") as ChecklistType) || "simple";

    const userDir = await getUserDir();
    const categoryDir = path.join(userDir, category);
    await ensureDir(categoryDir);

    const filename = await generateUniqueFilename(categoryDir, title);
    const id = path.basename(filename, ".md");
    const filePath = path.join(categoryDir, filename);

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
    const categoryDir = path.join(
      ownerDir,
      updatedList.category || "Uncategorized"
    );
    await ensureDir(categoryDir);

    let newFilename: string;
    let newId = id;

    // Generate new filename if title has changed OR if current filename doesn't match sanitized title
    const sanitizedTitle = sanitizeFilename(title);
    const currentFilename = `${id}.md`;
    const expectedFilename = `${sanitizedTitle}.md`;

    if (title !== currentList.title || currentFilename !== expectedFilename) {
      newFilename = await generateUniqueFilename(categoryDir, title);
      newId = path.basename(newFilename, ".md");
    } else {
      // Keep the same filename if title hasn't changed and filename matches sanitized title
      newFilename = `${id}.md`;
    }

    if (newId !== id) {
      updatedList.id = newId;
    }

    const filePath = path.join(categoryDir, newFilename);

    let oldFilePath: string | null = null;
    if (category && category !== currentList.category) {
      oldFilePath = path.join(
        ownerDir,
        currentList.category || "Uncategorized",
        `${id}.md`
      );
    } else if (newId !== id) {
      oldFilePath = path.join(
        ownerDir,
        currentList.category || "Uncategorized",
        `${id}.md`
      );
    }

    await writeFile(filePath, listToMarkdown(updatedList));

    const { getItemSharingMetadata } = await import("@/app/_server/actions/sharing/sharing-utils");
    const sharingMetadata = await getItemSharingMetadata(id, "checklist", currentList.owner!);

    if (sharingMetadata) {
      const newFilePath = `${currentList.owner}/${updatedList.category || "Uncategorized"
        }/${updatedList.id}.md`;

      if (newId !== id) {
        const { removeSharedItem, addSharedItem } = await import("@/app/_server/actions/sharing/sharing-utils");

        await removeSharedItem(id, "checklist", currentList.owner!);

        await addSharedItem(
          updatedList.id,
          "checklist",
          updatedList.title,
          currentList.owner!,
          sharingMetadata.sharedWith,
          updatedList.category,
          newFilePath,
          sharingMetadata.isPubliclyShared
        );
      } else {
        await updateSharedItem(updatedList.id, "checklist", currentList.owner!, {
          filePath: newFilePath,
          category: updatedList.category,
          title: updatedList.title,
        });
      }
    }

    if (oldFilePath && oldFilePath !== filePath) {
      await deleteFile(oldFilePath);
    }

    try {
      revalidatePath("/");
      revalidatePath(`/checklist/${id}`);
      if (newId !== id) {
        revalidatePath(`/checklist/${newId}`);
      }
    } catch (error) {
      console.warn(
        "Cache revalidation failed, but data was saved successfully:",
        error
      );
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

    try {
      revalidatePath("/");
      revalidatePath(`/checklist/${id}`);
    } catch (error) {
      console.warn(
        "Cache revalidation failed, but data was saved successfully:",
        error
      );
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete list" };
  }
};
