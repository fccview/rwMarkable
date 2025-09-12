"use server";

import { createHash } from "crypto";
import { readUsers, writeUsers } from "@/app/_server/actions/auth/utils";
import { User } from "@/app/_types";
import { Result } from "@/app/_types";

type UserWithoutPassword = Omit<User, "passwordHash">;

export async function updateUserAction(
  formData: FormData
): Promise<Result<UserWithoutPassword>> {
  try {
    const username = formData.get("username") as string;
    const newUsername = formData.get("newUsername") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const isAdmin = formData.get("isAdmin") === "true";

    if (!username || !newUsername) {
      return {
        success: false,
        error: "Username is required",
      };
    }

    if (newUsername.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters long",
      };
    }

    if (password && password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long",
      };
    }

    if (password && !confirmPassword) {
      return {
        success: false,
        error: "Confirm password is required when changing password",
      };
    }

    if (password && password !== confirmPassword) {
      return {
        success: false,
        error: "Passwords do not match",
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

    if (newUsername !== username) {
      const usernameExists = existingUsers.find(
        (user) => user.username === newUsername
      );
      if (usernameExists) {
        return {
          success: false,
          error: "Username already exists",
        };
      }
    }

    const updatedUser = {
      ...existingUsers[userIndex],
      username: newUsername,
      isAdmin,
    };

    if (password) {
      const hashedPassword = createHash("sha256")
        .update(password)
        .digest("hex");
      updatedUser.passwordHash = hashedPassword;
    }

    existingUsers[userIndex] = updatedUser;

    await writeUsers(existingUsers);

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return {
      success: true,
      data: userWithoutPassword as UserWithoutPassword,
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: "Failed to update user",
    };
  }
}
