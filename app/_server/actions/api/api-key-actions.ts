"use server";

import { readUsers, writeUsers } from "@/app/_server/actions/auth/utils";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import { generateApiKey } from "@/app/_server/utils/api-auth";
import { Result } from "@/app/_types";

export async function generateApiKeyAction(): Promise<Result<string>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, error: "Not authenticated" };
        }

        const users = await readUsers();
        const userIndex = users.findIndex(u => u.username === currentUser.username);

        if (userIndex === -1) {
            return { success: false, error: "User not found" };
        }

        const newApiKey = generateApiKey();
        users[userIndex].apiKey = newApiKey;

        await writeUsers(users);

        return { success: true, data: newApiKey };
    } catch (error) {
        console.error("Error generating API key:", error);
        return { success: false, error: "Failed to generate API key" };
    }
}

export async function getApiKeyAction(): Promise<Result<string | null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, error: "Not authenticated" };
        }

        const users = await readUsers();
        const user = users.find(u => u.username === currentUser.username);

        if (!user) {
            return { success: false, error: "User not found" };
        }

        return { success: true, data: user.apiKey || null };
    } catch (error) {
        console.error("Error getting API key:", error);
        return { success: false, error: "Failed to get API key" };
    }
}