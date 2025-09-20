"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import {
  getUserDir,
  ensureDir,
  deleteDir,
  readFile,
  writeFile,
  readDir,
} from "@/app/_server/utils/files";
import fs from "fs/promises";
import { parseMarkdown, listToMarkdown } from "./checklist-utils";

export const createCategoryAction = async (formData: FormData) => {
  try {
    const name = formData.get("name") as string;

    const userDir = await getUserDir();
    const categoryDir = path.join(userDir, name);
    await ensureDir(categoryDir);

    return { success: true, data: { name, count: 0 } };
  } catch (error) {
    return { error: "Failed to create category" };
  }
};

export const deleteCategoryAction = async (formData: FormData) => {
  try {
    const name = formData.get("name") as string;

    const userDir = await getUserDir();
    const categoryDir = path.join(userDir, name);
    await deleteDir(categoryDir);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
};

export const renameCategoryAction = async (formData: FormData) => {
  try {
    const oldName = formData.get("oldName") as string;
    const newName = formData.get("newName") as string;

    if (!oldName || !newName) {
      return { error: "Both old and new names are required" };
    }

    const userDir = await getUserDir();
    const oldCategoryDir = path.join(userDir, oldName);
    const newCategoryDir = path.join(userDir, newName);

    if (
      !(await fs
        .access(oldCategoryDir)
        .then(() => true)
        .catch(() => false))
    ) {
      return { error: "Category not found" };
    }

    if (
      await fs
        .access(newCategoryDir)
        .then(() => true)
        .catch(() => false)
    ) {
      return { error: "Category with new name already exists" };
    }

    await fs.rename(oldCategoryDir, newCategoryDir);

    const files = await readDir(newCategoryDir);
    for (const file of files) {
      if (file.isFile() && file.name.endsWith(".md")) {
        const filePath = path.join(newCategoryDir, file.name);
        const content = await readFile(filePath);
        const list = parseMarkdown(content, "", newName);
        list.category = newName;
        list.updatedAt = new Date().toISOString();
        await writeFile(filePath, listToMarkdown(list));
      }
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to rename category" };
  }
};
