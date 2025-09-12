"use server";

import { getCurrentUser, readSessions } from "@/app/_server/actions/auth/utils";
import { Result } from "@/app/_types";
import { getSessionsForUser, removeSession, removeAllSessionsForUser } from "./session-storage";
import { cookies } from "next/headers";

interface Session {
  id: string;
  username: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

export async function getSessionsAction(): Promise<Result<Session[]>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const sessionId = cookies().get("session")?.value;

    const realSessions = await getSessionsForUser(currentUser.username);

    const sessions: Session[] = realSessions.map(session => ({
      id: session.id,
      username: session.username,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      isCurrent: session.id === sessionId,
    }));

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    console.error("Error getting sessions:", error);
    return {
      success: false,
      error: "Failed to get sessions",
    };
  }
}

export async function terminateSessionAction(formData: FormData): Promise<Result<null>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const sessionId = formData.get("sessionId") as string;

    if (!sessionId) {
      return {
        success: false,
        error: "Session ID is required",
      };
    }

    await removeSession(sessionId);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error terminating session:", error);
    return {
      success: false,
      error: "Failed to terminate session",
    };
  }
}

export async function terminateAllOtherSessionsAction(): Promise<Result<null>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const sessionId = cookies().get("session")?.value;

    await removeAllSessionsForUser(currentUser.username, sessionId);

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Error terminating all other sessions:", error);
    return {
      success: false,
      error: "Failed to terminate sessions",
    };
  }
}
