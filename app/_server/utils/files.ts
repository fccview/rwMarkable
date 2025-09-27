"use server";

import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/app/_server/actions/users/current";

const DATA_DIR = path.join(process.cwd(), "data", "checklists");

export async function getUserDir(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return path.join(DATA_DIR, user.username);
}

export async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    return "";
  }
}

export async function writeFile(filePath: string, content: string) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export async function deleteFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
  }
}

export async function readDir(dir: string) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    return [];
  }
}

export async function deleteDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true });
  } catch (error) {
    // Ignore if directory doesn't exist
  }
}
