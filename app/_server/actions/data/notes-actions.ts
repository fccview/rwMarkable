"use server";

import path from "path";
import { Note, Category } from "@/app/_types";
import {
  getDocsUserDir,
  ensureDocsDir,
  readDocsFile,
  writeDocsFile,
  deleteDocsFile,
  readDocsDir,
  deleteDocsDir,
} from "@/app/_server/utils/notes-files";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import {
  getItemsSharedWithUser,
  removeSharedItem,
} from "@/app/_server/actions/sharing/sharing-utils";
import { readUsers, isAdmin } from "@/app/_server/actions/auth/utils";
import fs from "fs/promises";

const USER_NOTES_DIR = (username: string) =>
  path.join(process.cwd(), "data", "notes", username);

const parseMarkdownDoc = (
  content: string,
  id: string,
  category: string,
  owner?: string,
  isShared?: boolean,
  fileStats?: { birthtime: Date; mtime: Date }
): Note => {
  const lines = content.split("\n");
  const titleLine = lines.find((line) => line.startsWith("# "));
  const title = titleLine?.replace(/^#\s*/, "") || "Untitled Note";

  const contentWithoutTitle = lines
    .filter((line) => !line.startsWith("# ") || line !== titleLine)
    .join("\n")
    .trim();

  return {
    id,
    title,
    content: contentWithoutTitle,
    category,
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

const docToMarkdown = (doc: Note): string => {
  const header = `# ${doc.title}`;
  const content = doc.content || "";

  return `${header}\n\n${content}`;
};

export const getDocs = async (username?: string) => {
  try {
    let userDir: string;
    let currentUser: any = null;

    if (username) {
      userDir = USER_NOTES_DIR(username);
      currentUser = { username };
    } else {
      currentUser = await getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "Not authenticated" };
      }
      userDir = await getDocsUserDir();
    }
    await ensureDocsDir(userDir);

    const categories = await readDocsDir(userDir);
    const docs: Note[] = [];

    for (const category of categories) {
      if (!category.isDirectory()) continue;

      const categoryDir = path.join(userDir, category.name);
      try {
        const files = await readDocsDir(categoryDir);
        for (const file of files) {
          if (file.isFile() && file.name.endsWith(".md")) {
            const id = path.basename(file.name, ".md");
            const filePath = path.join(categoryDir, file.name);
            const content = await readDocsFile(filePath);
            const stats = await fs.stat(filePath);
            docs.push(
              parseMarkdownDoc(
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
    for (const sharedItem of sharedItems.notes) {
      try {
        const sharedFilePath = path.join(
          process.cwd(),
          "data",
          "notes",
          sharedItem.owner,
          sharedItem.category || "Uncategorized",
          `${sharedItem.id}.md`
        );

        const content = await fs.readFile(sharedFilePath, "utf-8");
        const stats = await fs.stat(sharedFilePath);
        docs.push(
          parseMarkdownDoc(
            content,
            sharedItem.id,
            sharedItem.category || "Uncategorized",
            sharedItem.owner,
            true,
            stats
          )
        );
      } catch (error) {
        console.error(`Error reading shared document ${sharedItem.id}:`, error);
        continue;
      }
    }

    return { success: true, data: docs };
  } catch (error) {
    console.error("Error in getDocs:", error);
    return { success: false, error: "Failed to fetch notes" };
  }
};

export const getDocsCategories = async () => {
  try {
    const userDir = await getDocsUserDir();
    await ensureDocsDir(userDir);

    const entries = await readDocsDir(userDir);
    const categories: Category[] = [];

    const excludedDirs = ["images", "files"];

    for (const entry of entries) {
      if (entry.isDirectory() && !excludedDirs.includes(entry.name)) {
        const categoryDir = path.join(userDir, entry.name);
        const files = await readDocsDir(categoryDir);
        const count = files.filter(
          (file) => file.isFile() && file.name.endsWith(".md")
        ).length;
        categories.push({ name: entry.name, count });
      }
    }

    return { success: true, data: categories };
  } catch (error) {
    return { error: "Failed to fetch document categories" };
  }
};

export const createDocAction = async (formData: FormData) => {
  try {
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "Uncategorized";
    const content = (formData.get("content") as string) || "";

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "Not authenticated" };
    }

    const userDir = await getDocsUserDir();
    const id = Date.now().toString();
    const categoryDir = path.join(userDir, category);
    const filePath = path.join(categoryDir, `${id}.md`);

    await ensureDocsDir(categoryDir);

    const newDoc: Note = {
      id,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: currentUser.username,
    };

    await writeDocsFile(filePath, docToMarkdown(newDoc));
    return { success: true, data: newDoc };
  } catch (error) {
    console.error("Error creating document:", error);
    return { error: "Failed to create document" };
  }
};

export const updateDocAction = async (formData: FormData) => {
  try {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;

    const isAdminUser = await isAdmin();
    const docs = await (isAdminUser ? getAllDocs() : getDocs());
    if (!docs.success || !docs.data) {
      throw new Error(docs.error || "Failed to fetch notes");
    }

    const doc = docs.data.find((d) => d.id === id);
    if (!doc) {
      throw new Error("Note not found");
    }

    const updatedDoc = {
      ...doc,
      title,
      content,
      category: category || doc.category,
      updatedAt: new Date().toISOString(),
    };

    const ownerDir = USER_NOTES_DIR(doc.owner!);
    const filePath = path.join(
      ownerDir,
      updatedDoc.category || "Uncategorized",
      `${id}.md`
    );

    let oldFilePath: string | null = null;
    if (category && category !== doc.category) {
      oldFilePath = path.join(
        ownerDir,
        doc.category || "Uncategorized",
        `${id}.md`
      );
    }

    await writeDocsFile(filePath, docToMarkdown(updatedDoc));

    if (oldFilePath && oldFilePath !== filePath) {
      await deleteDocsFile(oldFilePath);
    }

    return { success: true, data: updatedDoc };
  } catch (error) {
    return { error: "Failed to update document" };
  }
};

export const deleteDocAction = async (formData: FormData) => {
  try {
    const id = formData.get("id") as string;
    const category = formData.get("category") as string;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "Not authenticated" };
    }

    const isAdminUser = await isAdmin();
    const docs = await (isAdminUser ? getAllDocs() : getDocs());
    if (!docs.success || !docs.data) {
      return { error: "Failed to fetch documents" };
    }

    const doc = docs.data.find((d) => d.id === id);
    if (!doc) {
      return { error: "Document not found" };
    }

    let filePath: string;

    if (doc.isShared) {
      if (!currentUser.isAdmin && currentUser.username !== doc.owner) {
        return { error: "Unauthorized to delete this shared document" };
      }

      const ownerDir = USER_NOTES_DIR(doc.owner!);
      filePath = path.join(ownerDir, category || "Uncategorized", `${id}.md`);
    } else {
      const userDir = await getDocsUserDir();
      filePath = path.join(userDir, category || "Uncategorized", `${id}.md`);
    }

    await deleteDocsFile(filePath);

    if (doc.isShared && doc.owner) {
      await removeSharedItem(id, "document", doc.owner);
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete document" };
  }
};

export const createDocsCategoryAction = async (formData: FormData) => {
  try {
    const name = formData.get("name") as string;

    const userDir = await getDocsUserDir();
    const categoryDir = path.join(userDir, name);
    await ensureDocsDir(categoryDir);

    return { success: true };
  } catch (error) {
    return { error: "Failed to create document category" };
  }
};

export const deleteDocsCategoryAction = async (formData: FormData) => {
  try {
    const name = formData.get("name") as string;

    const userDir = await getDocsUserDir();
    const categoryDir = path.join(userDir, name);
    await deleteDocsDir(categoryDir);

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete document category" };
  }
};

export const renameDocsCategoryAction = async (formData: FormData) => {
  try {
    const oldName = formData.get("oldName") as string;
    const newName = formData.get("newName") as string;

    if (!oldName || !newName) {
      return { error: "Both old and new names are required" };
    }

    const userDir = await getDocsUserDir();
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

    const files = await readDocsDir(newCategoryDir);
    for (const file of files) {
      if (file.isFile() && file.name.endsWith(".md")) {
        const filePath = path.join(newCategoryDir, file.name);
        const content = await readDocsFile(filePath);
        const fileId = file.name.replace(".md", "");
        const doc = parseMarkdownDoc(content, fileId, newName);
        doc.category = newName;
        doc.updatedAt = new Date().toISOString();
        await writeDocsFile(filePath, docToMarkdown(doc));
      }
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to rename document category" };
  }
};

export const getAllDocs = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const allDocs: Note[] = [];

    const users = await readUsers();

    for (const user of users) {
      const userDir = USER_NOTES_DIR(user.username);

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
                allDocs.push(
                  parseMarkdownDoc(
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

    return { success: true, data: allDocs };
  } catch (error) {
    console.error("Error in getAllDocs:", error);
    return { success: false, error: "Failed to fetch all notes" };
  }
};

export const checkForDocsFolder = async (): Promise<boolean> => {
  try {
    const docsPath = path.join(process.cwd(), "data", "docs");
    await fs.access(docsPath);
    return true;
  } catch {
    return false;
  }
};
