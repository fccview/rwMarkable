"use server";

import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";

interface User {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  createdAt?: string;
  lastLogin?: string;
  apiKey?: string;
}

const USERS_FILE = path.join(process.cwd(), "data", "users", "users.json");
const SESSIONS_FILE = path.join(
  process.cwd(),
  "data",
  "users",
  "sessions.json"
);

export async function readUsers(): Promise<User[]> {
  try {
    await fs.access(USERS_FILE);
    const content = await fs.readFile(USERS_FILE, "utf-8");
    const users = JSON.parse(content);
    return users;
  } catch (error) {
    return [];
  }
}

export async function readSessions(): Promise<Record<string, string>> {
  try {
    await fs.access(SESSIONS_FILE);
    const content = await fs.readFile(SESSIONS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const sessionId = cookies().get("session")?.value;
  if (!sessionId) return null;

  const users = await readUsers();
  const sessions = await readSessions();
  const username = sessions[sessionId];

  return users.find((u) => u.username === username) || null;
}

export async function hasUsers(): Promise<boolean> {
  try {
    const users = await readUsers();
    return users.length > 0;
  } catch (error) {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin || false;
}

export async function getUsername(): Promise<string> {
  const user = await getCurrentUser();
  return user?.username || "";
}

export async function writeUsers(users: User[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error writing users:", error);
    throw error;
  }
}
