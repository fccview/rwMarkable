"use server";

import { getCurrentUser } from "@/app/_server/actions/auth/utils";
import { Result } from "@/app/_types";
import fs from "fs/promises";
import path from "path";

interface PrivacySettings {
    allowSharing: boolean;
    showProfileToOthers: boolean;
    allowSessionTracking: boolean;
    dataRetentionDays: number;
}

const PRIVACY_SETTINGS_FILE = path.join(process.cwd(), "data", "users", "privacy-settings.json");

async function readPrivacySettings(): Promise<Record<string, PrivacySettings>> {
    try {
        await fs.access(PRIVACY_SETTINGS_FILE);
        const content = await fs.readFile(PRIVACY_SETTINGS_FILE, "utf-8");
        return JSON.parse(content);
    } catch (error) {
        return {};
    }
}

async function writePrivacySettings(settings: Record<string, PrivacySettings>): Promise<void> {
    try {
        await fs.mkdir(path.dirname(PRIVACY_SETTINGS_FILE), { recursive: true });
        await fs.writeFile(PRIVACY_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error("Error writing privacy settings:", error);
        throw error;
    }
}

export async function getPrivacySettingsAction(): Promise<Result<PrivacySettings>> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return {
                success: false,
                error: "Not authenticated",
            };
        }

        const allSettings = await readPrivacySettings();
        const userSettings = allSettings[currentUser.username] || {
            allowSharing: true,
            showProfileToOthers: true,
            allowSessionTracking: true,
            dataRetentionDays: 30,
        };

        return {
            success: true,
            data: userSettings,
        };
    } catch (error) {
        console.error("Error getting privacy settings:", error);
        return {
            success: false,
            error: "Failed to get privacy settings",
        };
    }
}

export async function updatePrivacySettingsAction(formData: FormData): Promise<Result<PrivacySettings>> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return {
                success: false,
                error: "Not authenticated",
            };
        }

        const allowSharing = formData.get("allowSharing") === "true";
        const showProfileToOthers = formData.get("showProfileToOthers") === "true";
        const allowSessionTracking = formData.get("allowSessionTracking") === "true";
        const dataRetentionDays = parseInt(formData.get("dataRetentionDays") as string) || 30;

        const newSettings: PrivacySettings = {
            allowSharing,
            showProfileToOthers,
            allowSessionTracking,
            dataRetentionDays: Math.max(1, Math.min(365, dataRetentionDays)),
        };

        const allSettings = await readPrivacySettings();
        allSettings[currentUser.username] = newSettings;
        await writePrivacySettings(allSettings);

        return {
            success: true,
            data: newSettings,
        };
    } catch (error) {
        console.error("Error updating privacy settings:", error);
        return {
            success: false,
            error: "Failed to update privacy settings",
        };
    }
}
