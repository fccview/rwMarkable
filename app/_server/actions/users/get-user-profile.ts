"use server";

import { getCurrentUser } from "@/app/_server/actions/auth/utils";
import { Result } from "@/app/_types";

type UserProfile = {
    username: string;
    isAdmin: boolean;
    createdAt?: string;
    lastLogin?: string;
};

export async function getUserProfileAction(): Promise<Result<UserProfile>> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: "Not authenticated",
            };
        }

        const profile: UserProfile = {
            username: user.username,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt || new Date().toISOString(),
            lastLogin: user.lastLogin || new Date().toISOString(),
        };

        return {
            success: true,
            data: profile,
        };
    } catch (error) {
        console.error("Error getting user profile:", error);
        return {
            success: false,
            error: "Failed to get user profile",
        };
    }
}
