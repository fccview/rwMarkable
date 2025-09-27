import { promises as fs } from "fs";
import path from "path";

export function sanitizeFilename(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export async function generateUniqueFilename(
    directory: string,
    baseTitle: string,
    extension: string = '.md'
): Promise<string> {
    const sanitizedTitle = sanitizeFilename(baseTitle);
    let filename = `${sanitizedTitle}${extension}`;
    let counter = 1;

    while (true) {
        const filePath = path.join(directory, filename);
        try {
            await fs.access(filePath);
            // File exists, try with counter
            filename = `${sanitizedTitle}-${counter}${extension}`;
            counter++;
        } catch {
            // File doesn't exist, we can use this filename
            break;
        }
    }

    return filename;
}

export async function getFilesInDirectory(directory: string): Promise<string[]> {
    try {
        const files = await fs.readdir(directory);
        return files.sort((a, b) => {
            // Sort directories first, then files
            const aIsDir = a.includes('.') === false;
            const bIsDir = b.includes('.') === false;

            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;

            // If both are same type, sort alphabetically
            return a.localeCompare(b);
        });
    } catch {
        return [];
    }
}
