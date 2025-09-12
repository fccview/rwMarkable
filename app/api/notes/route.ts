import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/app/_server/utils/api-auth";
import { getDocs } from "@/app/_server/actions/data/docs-actions";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const apiKey = request.headers.get("x-api-key");
        const user = await authenticateApiKey(apiKey || "");

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const docs = await getDocs(user.username);
        if (!docs.success || !docs.data) {
            return NextResponse.json({ error: docs.error || "Failed to fetch notes" }, { status: 500 });
        }

        const userDocs = docs.data.filter(doc => doc.owner === user.username);

        const formattedDocs = userDocs.map(doc => ({
            id: doc.id,
            title: doc.title,
            category: doc.category || "Uncategorized",
            content: doc.content,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }));

        return NextResponse.json({ notes: formattedDocs });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
