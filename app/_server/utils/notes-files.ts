"use server";

import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/app/_server/actions/users/current";

const DOCS_DATA_DIR = path.join(process.cwd(), "data", "notes");

export async function getDocsUserDir(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return path.join(DOCS_DATA_DIR, user.username);
}

export async function ensureDocsDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function readDocsFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    return "";
  }
}

export async function writeDocsFile(filePath: string, content: string) {
  await ensureDocsDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export async function deleteDocsFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
  }
}

export async function readDocsDir(dir: string) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    return [];
  }
}

export async function deleteDocsDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true });
  } catch (error) {
    // Ignore if directory doesn't exist
  }
}
