"use server";

import path from "path";
import { Note, Category } from "@/app/_types";
import { generateUniqueFilename, sanitizeFilename } from "../../utils/filename-utils";
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
  updateSharedItem,
} from "@/app/_server/actions/sharing/sharing-utils";
import {
  readUsers,
  isAdmin,
  isAuthenticated,
} from "@/app/_server/actions/auth/utils";
import fs from "fs/promises";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

const readDocsRecursively = async (
  dir: string,
  basePath: string = "",
  owner: string
): Promise<Note[]> => {
  const docs: Note[] = [];
  const entries = await readDocsDir(dir);
  const excludedDirs = ["images", "files"];

  const sortedEntries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sortedEntries) {
    if (entry.isDirectory() && !excludedDirs.includes(entry.name)) {
      const categoryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const categoryDir = path.join(dir, entry.name);

      try {
        const files = await readDocsDir(categoryDir);
        for (const file of files) {
          if (file.isFile() && file.name.endsWith(".md")) {
            const id = path.basename(file.name, ".md");
            const filePath = path.join(categoryDir, file.name);
            const content = await readDocsFile(filePath);
            const stats = await fs.stat(filePath);
            docs.push(
              parseMarkdownDoc(content, id, categoryPath, owner, false, stats)
            );
          }
        }
      } catch (error) {
        continue;
      }

      const subDocs = await readDocsRecursively(
        categoryDir,
        categoryPath,
        owner
      );
      docs.push(...subDocs);
    }
  }

  return docs;
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

    const docs = await readDocsRecursively(userDir, "", currentUser.username);

    const sharedItems = await getItemsSharedWithUser(currentUser.username);
    for (const sharedItem of sharedItems.notes) {
      const sharedFilePath = sharedItem.filePath
        ? path.join(process.cwd(), "data", "notes", sharedItem.filePath)
        : path.join(
          process.cwd(),
          "data",
          "notes",
          sharedItem.owner,
          sharedItem.category || "Uncategorized",
          `${sharedItem.id}.md`
        );

      try {
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
        console.error(`File path attempted:`, sharedFilePath);
        continue;
      }
    }

    return { success: true, data: docs };
  } catch (error) {
    console.error("Error in getDocs:", error);
    return { success: false, error: "Failed to fetch notes" };
  }
};

const buildCategoryTree = async (
  dir: string,
  basePath: string = "",
  level: number = 0
): Promise<Category[]> => {
  const categories: Category[] = [];
  const entries = await readDocsDir(dir);
  const excludedDirs = ["images", "files"];

  const sortedEntries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sortedEntries) {
    if (entry.isDirectory() && !excludedDirs.includes(entry.name)) {
      const categoryPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const categoryDir = path.join(dir, entry.name);

      const files = await readDocsDir(categoryDir);
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

      const subCategories = await buildCategoryTree(
        categoryDir,
        categoryPath,
        level + 1
      );
      categories.push(...subCategories);
    }
  }

  return categories;
};

export const getDocsCategories = async () => {
  try {
    const userDir = await getDocsUserDir();
    await ensureDocsDir(userDir);

    const categories = await buildCategoryTree(userDir);

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
    const categoryDir = path.join(userDir, category);
    await ensureDocsDir(categoryDir);

    const filename = await generateUniqueFilename(categoryDir, title);
    const id = path.basename(filename, ".md");
    const filePath = path.join(categoryDir, filename);

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
    const categoryDir = path.join(
      ownerDir,
      updatedDoc.category || "Uncategorized"
    );
    await ensureDocsDir(categoryDir);

    let newFilename: string;
    let newId = id;

    const sanitizedTitle = sanitizeFilename(title);
    const currentFilename = `${id}.md`;
    const expectedFilename = `${sanitizedTitle}.md`;

    if (title !== doc.title || currentFilename !== expectedFilename) {
      newFilename = await generateUniqueFilename(categoryDir, title);
      newId = path.basename(newFilename, ".md");
    } else {
      newFilename = `${id}.md`;
    }

    if (newId !== id) {
      updatedDoc.id = newId;
    }

    const filePath = path.join(categoryDir, newFilename);

    let oldFilePath: string | null = null;
    if (category && category !== doc.category) {
      oldFilePath = path.join(
        ownerDir,
        doc.category || "Uncategorized",
        `${id}.md`
      );
    } else if (newId !== id) {
      oldFilePath = path.join(
        ownerDir,
        doc.category || "Uncategorized",
        `${id}.md`
      );
    }

    await writeDocsFile(filePath, docToMarkdown(updatedDoc));

    const { getItemSharingMetadata } = await import("@/app/_server/actions/sharing/sharing-utils");
    const sharingMetadata = await getItemSharingMetadata(id, "document", doc.owner!);

    if (sharingMetadata) {
      const newFilePath = `${doc.owner}/${updatedDoc.category || "Uncategorized"
        }/${updatedDoc.id}.md`;

      if (newId !== id) {
        const { removeSharedItem, addSharedItem } = await import("@/app/_server/actions/sharing/sharing-utils");

        await removeSharedItem(id, "document", doc.owner!);

        await addSharedItem(
          updatedDoc.id,
          "document",
          updatedDoc.title,
          doc.owner!,
          sharingMetadata.sharedWith,
          updatedDoc.category,
          newFilePath,
          sharingMetadata.isPubliclyShared
        );
      } else {
        // ID didn't change, just update the existing sharing entry
        await updateSharedItem(updatedDoc.id, "document", doc.owner!, {
          filePath: newFilePath,
          category: updatedDoc.category,
          title: updatedDoc.title,
        });
      }
    }

    if (oldFilePath && oldFilePath !== filePath) {
      await deleteDocsFile(oldFilePath);
    }

    try {
      revalidatePath("/");
      revalidatePath(`/note/${id}`);
      if (newId !== id) {
        revalidatePath(`/note/${newId}`);
      }
    } catch (error) {
      console.warn(
        "Cache revalidation failed, but data was saved successfully:",
        error
      );
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

    try {
      revalidatePath("/");
      revalidatePath(`/note/${id}`);
    } catch (error) {
      console.warn(
        "Cache revalidation failed, but data was saved successfully:",
        error
      );
    }

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete document" };
  }
};

export const createDocsCategoryAction = async (formData: FormData) => {
  try {
    const name = formData.get("name") as string;
    const parent = formData.get("parent") as string;

    const userDir = await getDocsUserDir();
    const categoryPath = parent ? path.join(parent, name) : name;
    const categoryDir = path.join(userDir, categoryPath);
    await ensureDocsDir(categoryDir);

    return { success: true };
  } catch (error) {
    return { error: "Failed to create document category" };
  }
};

export const deleteDocsCategoryAction = async (formData: FormData) => {
  try {
    const categoryPath = formData.get("path") as string;

    const userDir = await getDocsUserDir();
    const categoryDir = path.join(userDir, categoryPath);
    await deleteDocsDir(categoryDir);

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete document category" };
  }
};

export const renameDocsCategoryAction = async (formData: FormData) => {
  try {
    const oldPath = formData.get("oldPath") as string;
    const newName = formData.get("newName") as string;

    if (!oldPath || !newName) {
      return { error: "Both old path and new name are required" };
    }

    const userDir = await getDocsUserDir();
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

    const files = await readDocsDir(newCategoryDir);
    for (const file of files) {
      if (file.isFile() && file.name.endsWith(".md")) {
        const filePath = path.join(newCategoryDir, file.name);
        const content = await readDocsFile(filePath);
        const fileId = file.name.replace(".md", "");
        const doc = parseMarkdownDoc(content, fileId, newPath);
        doc.category = newPath;
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
        const userDocs = await readDocsRecursively(userDir, "", user.username);
        allDocs.push(...userDocs);
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

export const CheckForNeedsMigration = async (): Promise<boolean> => {
  const needsMigration = await checkForDocsFolder();
  const isLoggedIn = await isAuthenticated();
  if (needsMigration && isLoggedIn) {
    redirect("/migration");
  }

  return false;
};
