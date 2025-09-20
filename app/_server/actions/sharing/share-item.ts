"use server";

import { getCurrentUser } from "@/app/_server/actions/users/current";
import { readUsers } from "@/app/_server/actions/auth/utils";
import {
  addSharedItem,
  removeSharedItem,
  updateSharedItem,
  getItemSharingMetadata,
} from "./sharing-utils";
import { Result } from "@/app/_types";

export async function shareItemAction(
  formData: FormData
): Promise<Result<null>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    const itemId = formData.get("itemId") as string;
    const type = formData.get("type") as "checklist" | "document";
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const action = formData.get("action") as
      | "share"
      | "unshare"
      | "share-public"
      | "unshare-public";
    const targetUsers = formData.get("targetUsers") as string;

    if (!itemId || !type || !title || !action) {
      return { success: false, error: "Missing required fields" };
    }

    if (type !== "checklist" && type !== "document") {
      return { success: false, error: "Invalid item type" };
    }

    const users = await readUsers();
    const usernames = users.map((u) => u.username);

    if (action === "share") {
      if (!targetUsers) {
        return { success: false, error: "No target users specified" };
      }

      const targetUserList = targetUsers.split(",").map((u) => u.trim());

      const invalidUsers = targetUserList.filter((u) => !usernames.includes(u));
      if (invalidUsers.length > 0) {
        return {
          success: false,
          error: `Invalid users: ${invalidUsers.join(", ")}`,
        };
      }

      const filteredUsers = targetUserList.filter(
        (u) => u !== currentUser.username
      );
      if (filteredUsers.length === 0) {
        return { success: false, error: "Cannot share with yourself" };
      }

      const existingMetadata = await getItemSharingMetadata(
        itemId,
        type,
        currentUser.username
      );

      if (existingMetadata) {
        const allUsers = [...existingMetadata.sharedWith, ...filteredUsers];
        const newSharedWith = allUsers.filter(
          (user, index) => allUsers.indexOf(user) === index
        );
        await updateSharedItem(itemId, type, currentUser.username, {
          sharedWith: newSharedWith,
        });
      } else {
        await addSharedItem(
          itemId,
          type,
          title,
          currentUser.username,
          filteredUsers,
          category
        );
      }

      return { success: true };
    } else if (action === "share-public") {
      const existingMetadata = await getItemSharingMetadata(
        itemId,
        type,
        currentUser.username
      );

      if (existingMetadata) {
        await updateSharedItem(itemId, type, currentUser.username, {
          ...existingMetadata,
          isPubliclyShared: true,
        });
      } else {
        await addSharedItem(
          itemId,
          type,
          title,
          currentUser.username,
          [],
          category,
          undefined,
          true
        );
      }

      return { success: true };
    } else if (action === "unshare-public") {
      const existingMetadata = await getItemSharingMetadata(
        itemId,
        type,
        currentUser.username
      );

      if (existingMetadata) {
        if (existingMetadata.sharedWith.length === 0) {
          await removeSharedItem(itemId, type, currentUser.username);
        } else {
          await updateSharedItem(itemId, type, currentUser.username, {
            ...existingMetadata,
            isPubliclyShared: false,
          });
        }
      }

      return { success: true };
    } else if (action === "unshare") {
      if (!targetUsers) {
        await removeSharedItem(itemId, type, currentUser.username);
      } else {
        const targetUserList = targetUsers.split(",").map((u) => u.trim());
        const existingMetadata = await getItemSharingMetadata(
          itemId,
          type,
          currentUser.username
        );

        if (existingMetadata) {
          const newSharedWith = existingMetadata.sharedWith.filter(
            (u) => !targetUserList.includes(u)
          );

          if (newSharedWith.length === 0) {
            await removeSharedItem(itemId, type, currentUser.username);
          } else {
            await updateSharedItem(itemId, type, currentUser.username, {
              sharedWith: newSharedWith,
            });
          }
        }
      }

      return { success: true };
    }

    return { success: false, error: "Invalid action" };
  } catch (error) {
    console.error("Error in shareItemAction:", error);
    return { success: false, error: "Failed to share item" };
  }
}

export async function unshareItemAction(
  formData: FormData
): Promise<Result<null>> {
  formData.set("action", "unshare");
  return shareItemAction(formData);
}

export async function getItemSharingStatusAction(
  itemId: string,
  type: "checklist" | "document",
  owner: string
): Promise<
  Result<{ isShared: boolean; sharedWith: string[]; isPubliclyShared: boolean }>
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    if (currentUser.username !== owner) {
      return { success: false, error: "Unauthorized" };
    }

    const metadata = await getItemSharingMetadata(itemId, type, owner);

    if (!metadata) {
      return {
        success: true,
        data: { isShared: false, sharedWith: [], isPubliclyShared: false },
      };
    }

    return {
      success: true,
      data: {
        isShared: metadata.sharedWith.length > 0,
        sharedWith: metadata.sharedWith,
        isPubliclyShared: metadata.isPubliclyShared || false,
      },
    };
  } catch (error) {
    console.error("Error in getItemSharingStatusAction:", error);
    return { success: false, error: "Failed to get sharing status" };
  }
}
