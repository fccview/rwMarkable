"use server";

import {
  getCurrentUser,
  readUsers,
  writeUsers,
} from "@/app/_server/actions/auth/utils";
import { Result } from "@/app/_types";
import fs from "fs/promises";
import path from "path";
import { removeAllSessionsForUser } from "./session-storage";

export async function deleteAccountAction(
  formData: FormData
): Promise<Result<null>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const confirmPassword = formData.get("confirmPassword") as string;

    if (!confirmPassword) {
      return {
        success: false,
        error: "Password confirmation is required",
      };
    }

    const users = await readUsers();
    const userIndex = users.findIndex(
      (user) => user.username === currentUser.username
    );

    if (userIndex === -1) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const { createHash } = await import("crypto");
    const passwordHash = createHash("sha256")
      .update(confirmPassword)
      .digest("hex");

    if (users[userIndex].passwordHash !== passwordHash) {
      return {
        success: false,
        error: "Incorrect password",
      };
    }

    const adminUsers = users.filter((user) => user.isAdmin);
    if (currentUser.isAdmin && adminUsers.length === 1) {
      return {
        success: false,
        error: "Cannot delete the last admin user",
      };
    }

    await removeAllSessionsForUser(currentUser.username);

    try {
      const checklistsDir = path.join(
        process.cwd(),
        "data",
        "checklists",
        currentUser.username
      );
      await fs.rm(checklistsDir, { recursive: true, force: true });

      const docsDir = path.join(
        process.cwd(),
        "data",
        "docs",
        currentUser.username
      );
      await fs.rm(docsDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Warning: Could not clean up user data files:", error);
    }

    users.splice(userIndex, 1);

    await writeUsers(users);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: "Failed to delete account",
    };
  }
}
