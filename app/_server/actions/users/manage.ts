"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { User } from "@/app/_types";

const USERS_FILE = path.join(process.cwd(), "data", "users", "users.json");

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function readUsers(): Promise<User[]> {
  try {
    const content = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

async function writeUsers(users: User[]) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function getCurrentUser(): Promise<User | null> {
  const sessionId = cookies().get("session")?.value;
  if (!sessionId) return null;

  const users = await readUsers();
  const sessions = await readSessions();
  const username = sessions[sessionId];

  return users.find((u) => u.username === username) || null;
}

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const isAdmin = formData.get("isAdmin") === "true";

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  const users = await readUsers();

  if (users.some((u) => u.username === username)) {
    return { error: "Username already exists" };
  }

  const newUser: User = {
    username,
    passwordHash: hashPassword(password),
    isAdmin,
  };

  users.push(newUser);
  await writeUsers(users);

  const userChecklistDir = path.join(
    process.cwd(),
    "data",
    "checklists",
    username
  );
  await fs.mkdir(userChecklistDir, { recursive: true });

  return { success: true };
}

export async function toggleAdmin(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const username = formData.get("username") as string;
  if (!username) {
    return { error: "Username is required" };
  }

  const users = await readUsers();
  const userToUpdate = users.find((u) => u.username === username);

  if (!userToUpdate) {
    return { error: "User not found" };
  }

  userToUpdate.isAdmin = !userToUpdate.isAdmin;
  await writeUsers(users);

  return { success: true };
}

export async function getUsers() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    return { error: "Unauthorized" };
  }

  const users = await readUsers();
  return users.map(({ username, isAdmin, isSuperAdmin }) => ({
    username,
    isAdmin,
    isSuperAdmin,
  }));
}

async function readSessions(): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(
      path.join(process.cwd(), "data", "users", "sessions.json"),
      "utf-8"
    );
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}
