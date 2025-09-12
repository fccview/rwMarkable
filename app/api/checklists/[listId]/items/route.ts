import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/app/_server/utils/api-auth";
import { createItemAction } from "@/app/_server/actions/data/actions";

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { listId: string } }
) {
    try {
        const apiKey = request.headers.get("x-api-key");
        const user = await authenticateApiKey(apiKey || "");

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const formData = new FormData();
        formData.append("listId", params.listId);
        formData.append("text", text);

        const result = await createItemAction(formData, user.username, true);

        if (!result.success) {
            return NextResponse.json({ error: result.error || "Failed to create item" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
