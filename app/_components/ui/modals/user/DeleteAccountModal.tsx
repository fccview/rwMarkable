"use client";

import { useState } from "react";
import {
  X,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/app/_components/ui/elements/button";
import { deleteAccountAction } from "@/app/_server/actions/users/delete-account";
import { useRouter } from "next/navigation";
import { Modal } from "../../elements/modal";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmPassword.trim()) {
      setError("Password confirmation is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("confirmPassword", confirmPassword);

      const result = await deleteAccountAction(formData);

      if (result.success) {
        setSuccess("Account deleted successfully. Redirecting to login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(result.error || "Failed to delete account");
      }
    } catch (error) {
      setError("Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmPassword("");
    setShowPassword(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Delete Account"
      titleIcon={<Trash2 className="h-5 w-5 text-destructive" />}
    >
      <div className="space-y-4">
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

        <div className="space-y-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive mb-2">
                  Warning: This action cannot be undone
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • All your checklists and notes will be permanently deleted
                  </li>
                  <li>• All shared content will be removed</li>
                  <li>• Your account and session data will be erased</li>
                  <li>• This action is irreversible</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                placeholder="Enter your password to confirm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your password to confirm account deletion
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
