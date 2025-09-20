import { NextRequest, NextResponse } from "next/server";
import {
  withApiAuth,
  getChecklistsForUser,
} from "@/app/_server/utils/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withApiAuth(request, async (user) => {
    try {
      const checklists = await getChecklistsForUser(user.username);
      return NextResponse.json({ checklists });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch checklists",
        },
        { status: 500 }
      );
    }
  });
}
