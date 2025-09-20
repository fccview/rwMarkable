import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, findItemByIndex } from "@/app/_server/utils/api-helpers";
import { updateItemAction } from "@/app/_server/actions/data/actions";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { listId: string; itemIndex: string } }
) {
  return withApiAuth(request, async (user) => {
    try {
      const itemIndex = parseInt(params.itemIndex);
      if (isNaN(itemIndex) || itemIndex < 0) {
        return NextResponse.json(
          { error: "Invalid item index" },
          { status: 400 }
        );
      }

      const item = await findItemByIndex(
        params.listId,
        itemIndex,
        user.username
      );

      const formData = new FormData();
      formData.append("listId", params.listId);
      formData.append("itemId", item.id);
      formData.append("completed", "false");

      const result = await updateItemAction(formData, user.username, true);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to uncheck item" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "List not found") {
          return NextResponse.json(
            { error: "List not found" },
            { status: 404 }
          );
        }
        if (error.message === "Item index out of range") {
          return NextResponse.json(
            { error: "Item index out of range" },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
