"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Modal } from "@/app/_components/ui/elements/modal";
import { Button } from "@/app/_components/ui/elements/button";

interface BulkPasteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (itemsText: string) => void;
    isLoading?: boolean;
}

export function BulkPasteModal({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}: BulkPasteModalProps) {
    const [itemsText, setItemsText] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemsText.trim()) return;

        onSubmit(itemsText.trim());
        setItemsText("");
        onClose();
    };

    const handleClose = () => {
        setItemsText("");
        onClose();
    };

    const lines = itemsText.split('\n').filter(line => line.trim());
    const itemCount = lines.length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Bulk Add Items"
            titleIcon={<ClipboardList className="h-5 w-5" />}
            className="lg:max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="itemsText" className="block text-sm font-medium text-foreground mb-2">
                        Paste your list (one item per line)
                    </label>
                    <textarea
                        id="itemsText"
                        value={itemsText}
                        onChange={(e) => setItemsText(e.target.value)}
                        placeholder="Item 1&#10;Item 2&#10;Item 3&#10;..."
                        className="w-full h-32 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                        disabled={isLoading}
                    />
                    {itemCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {itemCount} item{itemCount !== 1 ? 's' : ''} will be added
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !itemsText.trim()}
                    >
                        {isLoading ? "Adding..." : `Add ${itemCount} Item${itemCount !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
