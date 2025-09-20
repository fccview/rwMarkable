import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, getNotesForUser } from "@/app/_server/utils/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiAuth(request, async (user) => {
    try {
      const notes = await getNotesForUser(user.username);
      return NextResponse.json({ notes });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to fetch notes",
        },
        { status: 500 }
      );
    }
  });
}
