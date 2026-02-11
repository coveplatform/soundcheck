import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";

export const dynamic = "force-dynamic";

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-14">
      <header className="bg-white border-b border-neutral-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href={session?.user ? "/dashboard" : "/"} className="flex items-center">
              <Logo />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-neutral-600">
              {session?.user ? (
                <Link href="/dashboard" className="hover:text-black transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hover:text-black transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" className="hover:text-black transition-colors">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
