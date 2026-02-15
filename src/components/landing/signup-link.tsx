"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface SignupLinkProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Client component that preserves ?ref= parameter when linking to signup
 */
export function SignupLink({ children, className }: SignupLinkProps) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  const signupUrl = ref ? `/signup?ref=${ref}` : "/signup";

  return (
    <Link href={signupUrl} className={className}>
      {children}
    </Link>
  );
}
