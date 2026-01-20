"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  message: string;
  variant?: "error" | "warning";
  className?: string;
  onDismiss?: () => void;
}

export function ErrorAlert({
  message,
  variant = "error",
  className,
  onDismiss,
}: ErrorAlertProps) {
  const variantClasses = {
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  };

  const Icon = variant === "error" ? XCircle : AlertTriangle;

  return (
    <div className={cn(
      "rounded-xl border p-4 flex items-start gap-3",
      variantClasses[variant],
      className
    )}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface SuccessAlertProps {
  message: string;
  className?: string;
}

export function SuccessAlert({ message, className }: SuccessAlertProps) {
  return (
    <div className={cn(
      "rounded-xl border p-4 bg-emerald-50 border-emerald-200 text-emerald-700",
      className
    )}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
