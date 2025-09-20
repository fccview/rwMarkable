import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/app/_server/utils/api-auth";
import {
  getLists,
  updateItemAction,
  createItemAction,
} from "@/app/_server/actions/data/actions";
import { getDocs } from "@/app/_server/actions/data/notes-actions";

export async function withApiAuth(
  request: NextRequest,
  handler: (user: any, request: NextRequest) => Promise<NextResponse>
) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const user = await authenticateApiKey(apiKey || "");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await handler(user, request);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function getChecklistsForUser(username: string) {
  const lists = await getLists(username);
  if (!lists.success || !lists.data) {
    throw new Error(lists.error || "Failed to fetch checklists");
  }

  const userLists = lists.data.filter((list) => list.owner === username);

  return userLists.map((list) => ({
    id: list.id,
    title: list.title,
    category: list.category || "Uncategorized",
    type: list.type || "simple",
    items: list.items.map((item, index) => {
      const baseItem = {
        index,
        text: item.text,
        completed: item.completed,
      };

      if (list.type === "task") {
        return {
          ...baseItem,
          status: item.status || "todo",
          time:
            item.timeEntries && item.timeEntries.length > 0
              ? item.timeEntries
              : 0,
        };
      }

      return baseItem;
    }),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  }));
}

export async function getNotesForUser(username: string) {
  const docs = await getDocs(username);
  if (!docs.success || !docs.data) {
    throw new Error(docs.error || "Failed to fetch notes");
  }

  const userDocs = docs.data.filter((doc) => doc.owner === username);

  return userDocs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category || "Uncategorized",
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

export async function findItemByIndex(
  listId: string,
  itemIndex: number,
  username: string
) {
  const lists = await getLists(username);
  if (!lists.success || !lists.data) {
    throw new Error(lists.error || "Failed to fetch lists");
  }

  const list = lists.data.find((l) => l.id === listId);
  if (!list) {
    throw new Error("List not found");
  }

  if (itemIndex >= list.items.length) {
    throw new Error("Item index out of range");
  }

  return list.items[itemIndex];
}
