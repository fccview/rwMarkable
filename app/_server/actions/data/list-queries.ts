"use server";

import path from "path";
import { Checklist, Category } from "@/app/_types";
import {
  getUserDir,
  ensureDir,
  readFile,
  readDir,
} from "@/app/_server/utils/files";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import { getItemsSharedWithUser } from "@/app/_server/actions/sharing/sharing-utils";
import { readUsers } from "@/app/_server/actions/auth/utils";
import fs from "fs/promises";
import { parseMarkdown } from "./checklist-utils";

const readListsRecursively = async (
  dir: string,
  basePath: string = "",
  owner: string
): Promise<Checklist[]> => {
  const lists: Checklist[] = [];
  const entries = await readDir(dir);

  const sortedEntries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sortedEntries) {
    if (entry.isDirectory()) {
      const categoryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const categoryDir = path.join(dir, entry.name);

      try {
        const files = await readDir(categoryDir);
        for (const file of files) {
          if (file.isFile() && file.name.endsWith(".md")) {
            const id = path.basename(file.name, ".md");
            const filePath = path.join(categoryDir, file.name);
            const content = await readFile(filePath);
            const stats = await fs.stat(filePath);
            lists.push(
              parseMarkdown(content, id, categoryPath, owner, false, stats)
            );
          }
        }
      } catch (error) {
        continue;
      }

      const subLists = await readListsRecursively(
        categoryDir,
        categoryPath,
        owner
      );
      lists.push(...subLists);
    }
  }

  return lists;
};

export const getLists = async (username?: string) => {
  try {
    let userDir: string;
    let currentUser: any = null;

    if (username) {
      userDir = path.join(process.cwd(), "data", "checklists", username);
      currentUser = { username };
    } else {
      currentUser = await getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "Not authenticated" };
      }
      userDir = await getUserDir();
    }
    await ensureDir(userDir);

    const lists = await readListsRecursively(userDir, "", currentUser.username);

    const sharedItems = await getItemsSharedWithUser(currentUser.username);
    for (const sharedItem of sharedItems.checklists) {
      try {
        const sharedFilePath = sharedItem.filePath
          ? path.join(process.cwd(), "data", "checklists", sharedItem.filePath)
          : path.join(
            process.cwd(),
            "data",
            "checklists",
            sharedItem.owner,
            sharedItem.category || "Uncategorized",
            `${sharedItem.id}.md`
          );

        const content = await fs.readFile(sharedFilePath, "utf-8");
        const stats = await fs.stat(sharedFilePath);
        lists.push(
          parseMarkdown(
            content,
            sharedItem.id,
            sharedItem.category || "Uncategorized",
            sharedItem.owner,
            true,
            stats
          )
        );
      } catch (error) {
        console.error(
          `Error reading shared checklist ${sharedItem.id}:`,
          error
        );
        continue;
      }
    }

    return { success: true, data: lists };
  } catch (error) {
    console.error("Error in getLists:", error);
    return { success: false, error: "Failed to fetch lists" };
  }
};

const buildChecklistCategoryTree = async (
  dir: string,
  basePath: string = "",
  level: number = 0
): Promise<Category[]> => {
  const categories: Category[] = [];
  const entries = await readDir(dir);

  // Sort entries: directories first, then files, both alphabetically
  const sortedEntries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sortedEntries) {
    if (entry.isDirectory()) {
      const categoryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const categoryDir = path.join(dir, entry.name);

      const files = await readDir(categoryDir);
      const count = files.filter(
        (file) => file.isFile() && file.name.endsWith(".md")
      ).length;

      const parent = basePath || undefined;

      categories.push({
        name: entry.name,
        count,
        path: categoryPath,
        parent,
        level,
      });

      const subCategories: Category[] = await buildChecklistCategoryTree(
        categoryDir,
        categoryPath,
        level + 1
      );
      categories.push(...subCategories);
    }
  }

  return categories;
};

export const getCategories = async () => {
  try {
    const userDir = await getUserDir();
    await ensureDir(userDir);

    const categories = await buildChecklistCategoryTree(userDir);

    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: "Failed to fetch categories" };
  }
};

export const getAllLists = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const allLists: Checklist[] = [];

    const users = await readUsers();

    for (const user of users) {
      const userDir = path.join(
        process.cwd(),
        "data",
        "checklists",
        user.username
      );

      try {
        const userLists = await readListsRecursively(
          userDir,
          "",
          user.username
        );
        allLists.push(...userLists);
      } catch (error) {
        continue;
      }
    }

    return { success: true, data: allLists };
  } catch (error) {
    console.error("Error in getAllLists:", error);
    return { success: false, error: "Failed to fetch all lists" };
  }
};
