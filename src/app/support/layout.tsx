import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardBackdrop } from "@/components/dashboard/backdrop";
import { Logo } from "@/components/ui/logo";

export const dynamic = "force-dynamic";

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] relative">
        <DashboardBackdrop />
        <DashboardNav user={session.user} />
        <main className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-8 sm:py-12 pb-12">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-14">
      <header className="bg-white border-b-2 border-black fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center">
              <Logo />
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
