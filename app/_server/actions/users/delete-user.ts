"use server";

import { readUsers, writeUsers } from "@/app/_server/actions/auth/utils";
import { Result } from "@/app/_types";
import fs from "fs/promises";
import path from "path";

export async function deleteUserAction(
  formData: FormData
): Promise<Result<null>> {
  try {
    const username = formData.get("username") as string;

    if (!username) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    const existingUsers = await readUsers();
    const userIndex = existingUsers.findIndex(
      (user) => user.username === username
    );

    if (userIndex === -1) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const adminUsers = existingUsers.filter((user) => user.isAdmin);
    if (existingUsers[userIndex].isAdmin && adminUsers.length === 1) {
      return {
        success: false,
        error: "Cannot delete the last admin user",
      };
    }

    existingUsers.splice(userIndex, 1);

    await writeUsers(existingUsers);

    try {
      const checklistsDir = path.join(
        process.cwd(),
        "data",
        "checklists",
        username
      );
      await fs.rm(checklistsDir, { recursive: true, force: true });

      const docsDir = path.join(process.cwd(), "data", "docs", username);
      await fs.rm(docsDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Warning: Could not clean up user data files:", error);
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: "Failed to delete user",
    };
  }
}
