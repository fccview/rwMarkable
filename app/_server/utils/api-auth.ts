import { readUsers } from "@/app/_server/actions/auth/utils";
import { User } from "@/app/_types";

export async function authenticateApiKey(apiKey: string): Promise<User | null> {
    try {
        if (!apiKey) {
            return null;
        }

        const users = await readUsers();
        const user = users.find((u) => u.apiKey === apiKey);

        return user || null;
    } catch (error) {
        console.error("Error authenticating API key:", error);
        return null;
    }
}

export function generateApiKey(): string {
    const prefix = "ck_";
    const randomBytes = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join("");
    return prefix + randomBytes;
}
