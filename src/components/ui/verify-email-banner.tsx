"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function VerifyEmailBanner({
  className,
}: {
  className?: string;
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

  if (!email || isVerified) return null;

  return (
    <div className={className ?? "border-2 border-orange-400 bg-orange-50 p-4"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-bold text-black">Verify your email to upload tracks</p>
          <p className="text-sm text-neutral-700">
            We sent a verification link to <span className="font-mono">{email}</span>.
          </p>
          {message && <p className="text-sm text-neutral-700 mt-1">{message}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="border-2 border-black"
            isLoading={isSending}
            onClick={async () => {
              if (!email) return;
              setIsSending(true);
              setMessage("");
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
                setMessage("Verification email sent. Check your inbox.");
              } catch {
                setMessage("Couldn't resend verification email");
              } finally {
                setIsSending(false);
              }
            }}
          >
            Resend verification
          </Button>

          <Link
            href={`/verify-email?email=${encodeURIComponent(email)}`}
            className="text-sm font-bold text-lime-700 hover:text-lime-800"
          >
            I already have a link
          </Link>
        </div>
      </div>
    </div>
  );
}
