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
    const parent = formData.get("parent") as string;

    const userDir = await getUserDir();
    const categoryPath = parent ? path.join(parent, name) : name;
    const categoryDir = path.join(userDir, categoryPath);
    await ensureDir(categoryDir);

    return { success: true, data: { name, count: 0 } };
  } catch (error) {
    return { error: "Failed to create category" };
  }
};

export const deleteCategoryAction = async (formData: FormData) => {
  try {
    const categoryPath = formData.get("path") as string;

    const userDir = await getUserDir();
    const categoryDir = path.join(userDir, categoryPath);
    await deleteDir(categoryDir);

    try {
      revalidatePath("/");
    } catch (error) {
      console.warn(
        "Cache revalidation failed, but data was saved successfully:",
        error
      );
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
};

export const renameCategoryAction = async (formData: FormData) => {
  try {
    const oldPath = formData.get("oldPath") as string;
    const newName = formData.get("newName") as string;

    if (!oldPath || !newName) {
      return { error: "Both old path and new name are required" };
    }

    const userDir = await getUserDir();
    const oldCategoryDir = path.join(userDir, oldPath);

    const pathParts = oldPath.split("/");
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join("/");
    const newCategoryDir = path.join(userDir, newPath);

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
        const list = parseMarkdown(content, "", newPath);
        list.category = newPath;
        list.updatedAt = new Date().toISOString();
        await writeFile(filePath, listToMarkdown(list));
      }
    }

    try {
      revalidatePath("/");
    } catch (error) {
      console.warn(
        "Cache revalidation failed, but data was saved successfully:",
        error
      );
    }
    return { success: true };
  } catch (error) {
    return { error: "Failed to rename category" };
  }
};
