"use client";

import { useState, useEffect } from "react";
import { getItemSharingStatusAction } from "@/app/_server/actions/sharing/share-item";

interface SharingStatus {
  isShared: boolean;
  isPubliclyShared: boolean;
  sharedWith: string[];
}

export function useSharingStatus(
  itemId: string,
  itemType: "checklist" | "document",
  itemOwner: string,
  enabled: boolean = true
) {
  const [sharingStatus, setSharingStatus] = useState<SharingStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !itemId || !itemType || !itemOwner) {
      setSharingStatus(null);
      return;
    }

    const loadSharingStatus = async () => {
      setIsLoading(true);
      try {
        const result = await getItemSharingStatusAction(
          itemId,
          itemType,
          itemOwner
        );
        if (result.success && result.data) {
          setSharingStatus({
            isShared: result.data.isShared,
            isPubliclyShared: result.data.isPubliclyShared,
            sharedWith: result.data.sharedWith,
          });
        } else {
          setSharingStatus({
            isShared: false,
            isPubliclyShared: false,
            sharedWith: [],
          });
        }
      } catch (error) {
        console.error("Error loading sharing status:", error);
        setSharingStatus({
          isShared: false,
          isPubliclyShared: false,
          sharedWith: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSharingStatus();
  }, [itemId, itemType, itemOwner, enabled]);

  return { sharingStatus, isLoading };
}
