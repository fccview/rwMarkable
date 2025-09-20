"use client";

import { useState, useEffect } from "react";
import {
  X,
  Share2,
  Users,
  Check,
  AlertCircle,
  Search,
  Globe,
  Link,
  Copy,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import {
  shareItemAction,
  getItemSharingStatusAction,
} from "@/app/_server/actions/sharing/share-item";
import { readUsers } from "@/app/_server/actions/auth/utils";
import { User } from "@/app/_types";
import { Modal } from "../../elements/modal";
import { cn } from "@/app/_utils/utils";

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
  const [isPubliclyShared, setIsPubliclyShared] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "public">("users");

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
        setIsPubliclyShared(result.data.isPubliclyShared || false);
        if (result.data.isPubliclyShared) {
          const baseUrl = window.location.origin;
          const publicPath =
            itemType === "checklist" ? "public/checklist" : "public/note";
          setPublicUrl(`${baseUrl}/${publicPath}/${itemId}`);
        }
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

  const handlePublicToggle = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("type", itemType);
      formData.append("title", itemTitle);
      formData.append("category", itemCategory || "");
      formData.append(
        "action",
        isPubliclyShared ? "unshare-public" : "share-public"
      );

      const result = await shareItemAction(formData);

      if (result.success) {
        const newPublicState = !isPubliclyShared;
        setIsPubliclyShared(newPublicState);

        if (newPublicState) {
          const baseUrl = window.location.origin;
          const publicPath =
            itemType === "checklist" ? "public/checklist" : "public/note";
          const url = `${baseUrl}/${publicPath}/${itemId}`;
          setPublicUrl(url);
          setSuccess("Item is now publicly accessible!");
        } else {
          setPublicUrl("");
          setSuccess("Item is no longer publicly accessible!");
        }
      } else {
        setError(result.error || "Failed to update public sharing");
      }
    } catch (error) {
      setError("An error occurred while updating public sharing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setSuccess("Public URL copied to clipboard!");
    } catch (error) {
      setError("Failed to copy URL to clipboard");
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
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-1">{itemTitle}</h3>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            Share with Users
          </button>
          <button
            onClick={() => setActiveTab("public")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "public"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="h-4 w-4" />
            Public Link
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="relative">
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
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No users found matching your search."
                      : "No other users available to share with."}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user.username}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.username)}
                      onChange={() => handleUserToggle(user.username)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {user.username}
                        </span>
                        {user.isAdmin && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    {currentSharing.includes(user.username) && (
                      <span className="text-xs text-primary font-medium">
                        Currently shared
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>

            {currentSharing.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Currently shared with:
                </p>
                <p className="text-sm font-medium">
                  {currentSharing.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Public Tab */}
        {activeTab === "public" && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium">Public Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Make this {itemType} accessible to anyone with the link
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePublicToggle}
                  disabled={isLoading}
                  variant={isPubliclyShared ? "destructive" : "default"}
                  className="flex-1"
                >
                  {isLoading
                    ? "Updating..."
                    : isPubliclyShared
                    ? "Make Private"
                    : "Make Public"}
                </Button>
              </div>
            </div>

            {isPubliclyShared && publicUrl && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Public URL
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm font-mono"
                  />
                  <Button
                    onClick={handleCopyUrl}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Anyone with this link can view this {itemType}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
        <div className="flex gap-2">
          {activeTab === "users" && currentSharing.length > 0 && (
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
            Close
          </Button>
          {activeTab === "users" && (
            <>
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
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
