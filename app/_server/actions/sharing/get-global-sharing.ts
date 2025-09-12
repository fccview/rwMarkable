"use server";

import { readSharingMetadata } from "./sharing-utils";
import { Result, SharedItem } from "@/app/_types";

export async function getGlobalSharingAction(): Promise<
    Result<{
        allSharedChecklists: SharedItem[];
        allSharedNotes: SharedItem[];
        sharingStats: {
            totalSharedChecklists: number;
            totalSharedNotes: number;
            totalSharingRelationships: number;
            mostActiveSharers: Array<{
                username: string;
                sharedCount: number;
            }>;
        };
    }>
> {
    try {
        const metadata = await readSharingMetadata();

        const allSharedChecklists = Object.values(metadata.checklists);
        const allSharedNotes = Object.values(metadata.notes);

        const totalSharedChecklists = allSharedChecklists.length;
        const totalSharedNotes = allSharedNotes.length;

        const totalSharingRelationships = [
            ...allSharedChecklists,
            ...allSharedNotes
        ].reduce((total, item) => total + item.sharedWith.length, 0);

        const sharerCounts: Record<string, number> = {};
        [...allSharedChecklists, ...allSharedNotes].forEach(item => {
            sharerCounts[item.owner] = (sharerCounts[item.owner] || 0) + 1;
        });

        const mostActiveSharers = Object.entries(sharerCounts)
            .map(([username, sharedCount]) => ({ username, sharedCount }))
            .sort((a, b) => b.sharedCount - a.sharedCount)
            .slice(0, 5);

        return {
            success: true,
            data: {
                allSharedChecklists,
                allSharedNotes,
                sharingStats: {
                    totalSharedChecklists,
                    totalSharedNotes,
                    totalSharingRelationships,
                    mostActiveSharers,
                },
            },
        };
    } catch (error) {
        console.error("Error in getGlobalSharingAction:", error);
        return { success: false, error: "Failed to get global sharing data" };
    }
}
