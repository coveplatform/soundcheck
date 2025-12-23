import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/nav";

export const dynamic = "force-dynamic";

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardNav user={session.user} />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-2 border-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="font-bold text-lg tracking-tight">
              MixReflect
            </Link>
            <nav className="flex items-center gap-4 text-sm font-bold text-neutral-600">
              <Link href="/login" className="hover:text-black">
                Log in
              </Link>
              <Link href="/signup" className="hover:text-black">
                Sign up
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
