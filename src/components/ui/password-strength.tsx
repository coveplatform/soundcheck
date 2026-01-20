"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS, validatePassword } from "@/lib/password";

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrength({
  password,
  showRequirements = true,
}: PasswordStrengthProps) {
  const { strength } = validatePassword(password);

  if (!password) {
    return null;
  }

  const strengthConfig = {
    weak: { label: "Weak", color: "bg-red-500", width: "w-1/3" },
    fair: { label: "Fair", color: "bg-orange-500", width: "w-2/3" },
    strong: { label: "Strong", color: "bg-green-500", width: "w-full" },
  };

  const config = strengthConfig[strength];

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Password strength</span>
          <span
            className={cn(
              "font-bold",
              strength === "weak" && "text-red-600",
              strength === "fair" && "text-orange-600",
              strength === "strong" && "text-green-600"
            )}
          >
            {config.label}
          </span>
        </div>
        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-[width] duration-300 ease-out rounded-full motion-reduce:transition-none",
              config.color,
              config.width
            )}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
          {PASSWORD_REQUIREMENTS.map((req) => {
            const met = req.test(password);
            return (
              <div
                key={req.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  met ? "text-green-600" : "text-neutral-400"
                )}
              >
                {met ? (
                  <Check className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <X className="h-3 w-3 flex-shrink-0" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
