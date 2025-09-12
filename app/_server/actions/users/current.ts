"use server";

import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";

interface User {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

interface PublicUser {
  username: string;
  isAdmin: boolean;
}

const USERS_FILE = path.join(process.cwd(), "data", "users", "users.json");
const SESSIONS_FILE = path.join(
  process.cwd(),
  "data",
  "users",
  "sessions.json"
);

async function readUsers(): Promise<User[]> {
  try {
    const content = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

async function readSessions(): Promise<Record<string, string>> {
  try {
    const content = await fs.readFile(SESSIONS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const sessionId = cookies().get("session")?.value;
  if (!sessionId) return null;

  const users = await readUsers();
  const sessions = await readSessions();
  const username = sessions[sessionId];

  const user = users.find((u) => u.username === username);
  if (!user) return null;

  return {
    username: user.username,
    isAdmin: user.isAdmin,
  };
}
