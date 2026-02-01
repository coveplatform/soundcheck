"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Mail, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VerifyEmailBanner({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "compact";
}) {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const emailVerified = session?.user?.emailVerified;

  const isVerified = useMemo(() => {
    if (!emailVerified) return false;
    return true;
  }, [emailVerified]);

  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!email || isVerified) return null;

  const handleResend = async () => {
    if (!email) return;
    setIsSending(true);
    setMessage("");
    setSentSuccess(false);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Couldn't resend verification email");
        return;
      }
      setMessage("Verification email sent! Check your inbox.");
      setSentSuccess(true);
    } catch {
      setMessage("Couldn't resend verification email");
    } finally {
      setIsSending(false);
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn(
        "rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3",
        className
      )}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-900 flex-1">
            <span className="font-semibold">Verify your email</span> to upload tracks
          </p>
          <Button
            type="button"
            variant="airyOutline"
            size="sm"
            isLoading={isSending}
            onClick={handleResend}
            className="h-8 text-xs"
          >
            Resend
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5",
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Mail className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-bold text-amber-900">Email verification required</h3>
          </div>
          <p className="text-sm text-amber-800 mt-1">
            Verify your email to upload tracks and access all features. We sent a link to{" "}
            <span className="font-mono text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">{email}</span>
          </p>

          {message && (
            <div className={cn(
              "mt-3 flex items-center gap-2 text-sm",
              sentSuccess ? "text-emerald-700" : "text-amber-700"
            )}>
              {sentSuccess && <Check className="h-4 w-4" />}
              {message}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button
              type="button"
              variant="airyPrimary"
              size="sm"
              isLoading={isSending}
              onClick={handleResend}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Resend verification email
            </Button>

            <Link
              href={`/verify-email?email=${encodeURIComponent(email)}`}
              className="text-sm font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
            >
              I have a verification code
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
