"use client";

import { useState, useEffect } from "react";
import { X, Share2, Users, Check, AlertCircle, Search } from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import {
  shareItemAction,
  getItemSharingStatusAction,
} from "@/app/_server/actions/sharing/share-item";
import { readUsers } from "@/app/_server/actions/auth/utils";
import { User } from "@/app/_types";
import { Modal } from "../../elements/modal";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  itemType: "checklist" | "document";
  itemCategory?: string;
  itemOwner: string;
}

export function ShareModal({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  itemType,
  itemCategory,
  itemOwner,
}: ShareModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSharing, setCurrentSharing] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadCurrentSharing();
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemId, itemOwner]);

  const loadUsers = async () => {
    try {
      const usersData = await readUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadCurrentSharing = async () => {
    try {
      const result = await getItemSharingStatusAction(
        itemId,
        itemType,
        itemOwner
      );
      if (result.success && result.data) {
        setCurrentSharing(result.data.sharedWith);
        setSelectedUsers(result.data.sharedWith);
      }
    } catch (error) {
      console.error("Error loading current sharing:", error);
    }
  };

  const handleUserToggle = (username: string) => {
    setSelectedUsers((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleShare = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("type", itemType);
      formData.append("title", itemTitle);
      formData.append("category", itemCategory || "");
      formData.append("action", "share");
      formData.append("targetUsers", selectedUsers.join(","));

      const result = await shareItemAction(formData);

      if (result.success) {
        setSuccess("Sharing updated successfully!");
        setCurrentSharing(selectedUsers);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to update sharing");
      }
    } catch (error) {
      setError("An error occurred while updating sharing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshare = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("type", itemType);
      formData.append("title", itemTitle);
      formData.append("category", itemCategory || "");
      formData.append("action", "unshare");
      formData.append("targetUsers", selectedUsers.join(","));

      const result = await shareItemAction(formData);

      if (result.success) {
        setSuccess("Sharing removed successfully!");
        setCurrentSharing([]);
        setSelectedUsers([]);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to remove sharing");
      }
    } catch (error) {
      setError("An error occurred while removing sharing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAllSharing = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("type", itemType);
      formData.append("title", itemTitle);
      formData.append("category", itemCategory || "");
      formData.append("action", "unshare");

      const result = await shareItemAction(formData);

      if (result.success) {
        setSuccess("All sharing removed successfully!");
        setCurrentSharing([]);
        setSelectedUsers([]);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to remove sharing");
      }
    } catch (error) {
      setError("An error occurred while removing sharing");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableUsers = users.filter((user) => user.username !== itemOwner);

  const filteredUsers = availableUsers.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Share ${itemType}`}
      titleIcon={<Share2 className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-1">{itemTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {itemCategory && `Category: ${itemCategory}`}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">{success}</span>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Select users to share with
          </h4>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No users found matching your search."
                  : "No other users available to share with."}
              </p>
            ) : (
              filteredUsers.map((user) => (
                <label
                  key={user.username}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.username)}
                    onChange={() => handleUserToggle(user.username)}
                    className="rounded border-border"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{user.username}</span>
                    {user.isAdmin && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Admin)
                      </span>
                    )}
                  </div>
                  {currentSharing.includes(user.username) && (
                    <span className="text-xs text-primary">
                      Currently shared
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {currentSharing.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              Currently shared with: {currentSharing.join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-6 border-t border-border">
        <div className="flex gap-2">
          {currentSharing.length > 0 && (
            <Button
              variant="outline"
              onClick={handleRemoveAllSharing}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              Remove All
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {selectedUsers.length > 0 ? (
            <Button onClick={handleShare} disabled={isLoading}>
              {isLoading ? "Updating..." : "Share"}
            </Button>
          ) : currentSharing.length > 0 ? (
            <Button onClick={handleUnshare} disabled={isLoading}>
              {isLoading ? "Removing..." : "Remove Selected"}
            </Button>
          ) : (
            <Button disabled>No users selected</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
