"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  requireConfirmText?: string; // If set, user must type this to confirm
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  requireConfirmText,
}: ConfirmationDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const canConfirm = !requireConfirmText || confirmInput === requireConfirmText;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsLoading(true);
    try {
      await onConfirm();
      setConfirmInput("");
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setConfirmInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className={cn(
          "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4",
          variant === "danger" ? "bg-red-100" : "bg-amber-100"
        )}>
          <AlertTriangle className={cn(
            "h-6 w-6",
            variant === "danger" ? "text-red-600" : "text-amber-600"
          )} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-black mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm text-black/60 text-center mb-6">
          {description}
        </p>

        {/* Confirm text input */}
        {requireConfirmText && (
          <div className="mb-6">
            <p className="text-sm font-medium text-black/70 mb-2">
              Type <span className="font-mono font-bold text-black">{requireConfirmText}</span> to confirm
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={requireConfirmText}
              className="font-mono"
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "primary"}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
