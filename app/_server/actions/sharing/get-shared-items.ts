"use server";

import { getCurrentUser } from "@/app/_server/actions/users/current";
import { getItemsSharedWithUser, getItemsSharedByUser } from "./sharing-utils";
import { Result, SharedItem } from "@/app/_types";

export async function getSharedItemsAction(): Promise<
  Result<{
    sharedWithMe: {
      checklists: SharedItem[];
      notes: SharedItem[];
    };
    sharedByMe: {
      checklists: SharedItem[];
      notes: SharedItem[];
    };
  }>
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const [sharedWithMe, sharedByMe] = await Promise.all([
      getItemsSharedWithUser(currentUser.username),
      getItemsSharedByUser(currentUser.username),
    ]);

    return {
      success: true,
      data: {
        sharedWithMe,
        sharedByMe,
      },
    };
  } catch (error) {
    console.error("Error in getSharedItemsAction:", error);
    return { success: false, error: "Failed to get shared items" };
  }
}

export async function getItemsSharedWithMeAction(): Promise<
  Result<{
    checklists: SharedItem[];
    notes: SharedItem[];
  }>
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const sharedItems = await getItemsSharedWithUser(currentUser.username);

    return {
      success: true,
      data: sharedItems,
    };
  } catch (error) {
    console.error("Error in getItemsSharedWithMeAction:", error);
    return { success: false, error: "Failed to get items shared with me" };
  }
}

export async function getItemsSharedByMeAction(): Promise<
  Result<{
    checklists: SharedItem[];
    notes: SharedItem[];
  }>
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const sharedItems = await getItemsSharedByUser(currentUser.username);

    return {
      success: true,
      data: sharedItems,
    };
  } catch (error) {
    console.error("Error in getItemsSharedByMeAction:", error);
    return { success: false, error: "Failed to get items shared by me" };
  }
}
