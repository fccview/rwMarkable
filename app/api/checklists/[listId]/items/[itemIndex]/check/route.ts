import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/app/_server/utils/api-auth";
import { getLists, updateItemAction } from "@/app/_server/actions/data/actions";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { listId: string; itemIndex: string } }
) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const user = await authenticateApiKey(apiKey || "");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const itemIndex = parseInt(params.itemIndex);
    if (isNaN(itemIndex) || itemIndex < 0) {
      return NextResponse.json({ error: "Invalid item index" }, { status: 400 });
    }

    const lists = await getLists();
    if (!lists.success || !lists.data) {
      return NextResponse.json({ error: lists.error || "Failed to fetch lists" }, { status: 500 });
    }

    const list = lists.data.find(l => l.id === params.listId && l.owner === user.username);
    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (itemIndex >= list.items.length) {
      return NextResponse.json({ error: "Item index out of range" }, { status: 400 });
    }

    const item = list.items[itemIndex];
    const formData = new FormData();
    formData.append("listId", params.listId);
    formData.append("itemId", item.id);
    formData.append("completed", "true");

    const result = await updateItemAction(formData, user.username, true);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to check item" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
