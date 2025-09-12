"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import { Checklist } from "@/app/_types";
import {
  getUserDir,
  ensureDir,
  readFile,
  writeFile,
  deleteFile,
  readDir,
  deleteDir,
} from "@/app/_server/utils/files";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import {
  getItemsSharedWithUser,
  removeSharedItem,
} from "@/app/_server/actions/sharing/sharing-utils";
import { readUsers } from "@/app/_server/actions/auth/utils";
import fs from "fs/promises";

const parseMarkdown = (
  content: string,
  id: string,
  category: string,
  owner?: string,
  isShared?: boolean,
  fileStats?: { birthtime: Date; mtime: Date }
): Checklist => {
  const lines = content.split("\n");
  const title = lines[0]?.replace(/^#\s*/, "") || "Untitled";
  const items = lines
    .slice(1)
    .filter((line) => line.trim().startsWith("- ["))
    .map((line, index) => {
      const completed = line.includes("- [x]");
      const text = line.replace(/^-\s*\[[x ]\]\s*/, "");
      return {
        id: `${id}-${index}`,
        text,
        completed,
        order: index,
      };
    });

  return {
    id,
    title,
    category,
    items,
    createdAt: fileStats
      ? fileStats.birthtime.toISOString()
      : new Date().toISOString(),
    updatedAt: fileStats
      ? fileStats.mtime.toISOString()
      : new Date().toISOString(),
    owner,
    isShared,
  };
};

const listToMarkdown = (list: Checklist): string => {
  const header = `# ${list.title}\n`;
  const items = list.items
    .sort((a, b) => a.order - b.order)
    .map((item) => `- [${item.completed ? "x" : " "}] ${item.text}`)
    .join("\n");
  return `${header}\n${items}`;
};

export const getLists = async (username?: string) => {
  try {
    let userDir: string;
    let currentUser: any = null;

    if (username) {
      // API key authentication - use provided username
      userDir = path.join(process.cwd(), "data", "checklists", username);
      currentUser = { username }; // Create a mock user object for API calls
    } else {
      // Session-based authentication
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

export const createListAction = async (formData: FormData) => {
  try {
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "Uncategorized";

    const userDir = await getUserDir();
    const id = Date.now().toString();
    const categoryDir = path.join(userDir, category);
    const filePath = path.join(categoryDir, `${id}.md`);

    // Ensure the category directory exists
    await ensureDir(categoryDir);

    const newList: Checklist = {
      id,
      title,
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

    const lists = await getLists();
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

    let filePath: string;
    let oldFilePath: string | null = null;

    if (currentList.isShared) {
      const ownerDir = path.join(
        process.cwd(),
        "data",
        "checklists",
        currentList.owner!
      );
      filePath = path.join(
        ownerDir,
        updatedList.category || "Uncategorized",
        `${id}.md`
      );

      if (category && category !== currentList.category) {
        oldFilePath = path.join(
          ownerDir,
          currentList.category || "Uncategorized",
          `${id}.md`
        );
      }
    } else {
      const userDir = await getUserDir();
      filePath = path.join(
        userDir,
        updatedList.category || "Uncategorized",
        `${id}.md`
      );

      if (category && category !== currentList.category) {
        oldFilePath = path.join(
          userDir,
          currentList.category || "Uncategorized",
          `${id}.md`
        );
      }
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

    const userDir = await getUserDir();
    const filePath = path.join(userDir, category, `${id}.md`);
    await deleteFile(filePath);

    const currentUser = await getCurrentUser();
    if (currentUser) {
      await removeSharedItem(id, "checklist", currentUser.username);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete list" };
  }
};

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

export const updateItemAction = async (formData: FormData, username?: string, skipRevalidation = false) => {
  try {
    const listId = formData.get("listId") as string;
    const itemId = formData.get("itemId") as string;
    const completed = formData.get("completed") === "true";
    const text = formData.get("text") as string;

    const lists = await getLists(username);
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    // If username is provided (API call), verify ownership
    if (username && list.owner !== username) {
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
      let userDir: string;
      if (username) {
        // API call - use provided username
        userDir = path.join(process.cwd(), "data", "checklists", username);
      } else {
        // Regular call - use session
        userDir = await getUserDir();
      }
      filePath = path.join(
        userDir,
        list.category || "Uncategorized",
        `${listId}.md`
      );
    }

    await writeFile(filePath, listToMarkdown(updatedList));

    if (!skipRevalidation) {
      revalidatePath("/");
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to update item" };
  }
};

export const createItemAction = async (formData: FormData, username?: string, skipRevalidation = false) => {
  try {
    const listId = formData.get("listId") as string;
    const text = formData.get("text") as string;

    const lists = await getLists(username);
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    if (username && list.owner !== username) {
      throw new Error("List not found");
    }

    const newItem = {
      id: `${listId}-${Date.now()}`,
      text,
      completed: false,
      order: list.items.length,
    };

    const updatedList = {
      ...list,
      items: [...list.items, newItem],
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
      let userDir: string;
      if (username) {
        userDir = path.join(process.cwd(), "data", "checklists", username);
      } else {
        userDir = await getUserDir();
      }
      filePath = path.join(
        userDir,
        list.category || "Uncategorized",
        `${listId}.md`
      );
    }

    await writeFile(filePath, listToMarkdown(updatedList));

    if (!skipRevalidation) {
      revalidatePath("/");
    }

    return { success: true, data: newItem };
  } catch (error) {
    return { error: "Failed to create item" };
  }
};

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

    const lines = itemsText.split('\n').filter(line => line.trim());
    const newItems = lines.map((text, index) => ({
      id: `${listId}-${Date.now()}-${index}`,
      text: text.trim(),
      completed: false,
      order: list.items.length + index,
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

    console.log("Reorder Debug - Input:", { listId, itemIds, currentItems });

    const lists = await getLists();
    if (!lists.success || !lists.data) {
      throw new Error(lists.error || "Failed to fetch lists");
    }

    const list = lists.data.find((l) => l.id === listId);
    if (!list) {
      throw new Error("List not found");
    }

    console.log(
      "Reorder Debug - Original items from server:",
      list.items.map((item) => ({
        id: item.id,
        text: item.text,
        order: item.order,
      }))
    );

    const itemMap = new Map(currentItems.map((item) => [item.id, item]));

    const updatedItems = itemIds.map((id, index) => {
      const item = itemMap.get(id);
      if (!item) throw new Error(`Item ${id} not found`);
      return { ...item, order: index };
    });

    console.log(
      "Reorder Debug - Updated items:",
      updatedItems.map((item) => ({
        id: item.id,
        text: item.text,
        order: item.order,
      }))
    );

    const updatedList = {
      ...list,
      items: updatedItems,
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

    const markdownContent = listToMarkdown(updatedList);
    console.log("Reorder Debug - Markdown content:", markdownContent);

    await writeFile(filePath, markdownContent);

    await new Promise((resolve) => setTimeout(resolve, 100));

    return { success: true };
  } catch (error) {
    console.error("Reorder Debug - Error:", error);
    return { error: "Failed to reorder items" };
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
