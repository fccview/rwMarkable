import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/app/_server/utils/api-auth";
import { getLists } from "@/app/_server/actions/data/actions";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const apiKey = request.headers.get("x-api-key");
        const user = await authenticateApiKey(apiKey || "");

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const lists = await getLists(user.username);
        if (!lists.success || !lists.data) {
            return NextResponse.json({ error: lists.error || "Failed to fetch checklists" }, { status: 500 });
        }

        const userLists = lists.data.filter(list => list.owner === user.username);

        const formattedLists = userLists.map(list => ({
            id: list.id,
            title: list.title,
            category: list.category || "Uncategorized",
            items: list.items.map((item, index) => ({
                index,
                text: item.text,
                completed: item.completed
            })),
            createdAt: list.createdAt,
            updatedAt: list.updatedAt
        }));

        return NextResponse.json({ checklists: formattedLists });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
