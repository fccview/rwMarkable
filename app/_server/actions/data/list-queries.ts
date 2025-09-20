"use server";

import path from "path";
import { Checklist } from "@/app/_types";
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

    const categories = await readDir(userDir);
    const lists: Checklist[] = [];

    for (const category of categories) {
      if (!category.isDirectory()) continue;

      const categoryDir = path.join(userDir, category.name);
      try {
        const files = await readDir(categoryDir);
        for (const file of files) {
          if (file.isFile() && file.name.endsWith(".md")) {
            const id = path.basename(file.name, ".md");
            const filePath = path.join(categoryDir, file.name);
            const content = await readFile(filePath);
            const stats = await fs.stat(filePath);
            lists.push(
              parseMarkdown(
                content,
                id,
                category.name,
                currentUser.username,
                false,
                stats
              )
            );
          }
        }
      } catch (error) {
        continue;
      }
    }

    const sharedItems = await getItemsSharedWithUser(currentUser.username);
    for (const sharedItem of sharedItems.checklists) {
      try {
        const sharedFilePath = path.join(
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

export const getCategories = async () => {
  try {
    const userDir = await getUserDir();
    await ensureDir(userDir);

    const entries = await readDir(userDir);
    const categories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        count: 0,
      }));

    const lists = await getLists();
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    categories.forEach((cat) => {
      cat.count = lists.data.filter(
        (list) => list.category === cat.name
      ).length;
    });

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
        const categories = await fs.readdir(userDir, { withFileTypes: true });

        for (const category of categories) {
          if (!category.isDirectory()) continue;

          const categoryDir = path.join(userDir, category.name);
          try {
            const files = await fs.readdir(categoryDir, {
              withFileTypes: true,
            });
            for (const file of files) {
              if (file.isFile() && file.name.endsWith(".md")) {
                const id = path.basename(file.name, ".md");
                const content = await fs.readFile(
                  path.join(categoryDir, file.name),
                  "utf-8"
                );
                allLists.push(
                  parseMarkdown(
                    content,
                    id,
                    category.name,
                    user.username,
                    false
                  )
                );
              }
            }
          } catch (error) {
            continue;
          }
        }
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
