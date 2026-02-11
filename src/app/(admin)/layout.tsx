import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { Logo } from "@/components/ui/logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 rounded border border-red-200 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <nav className="flex items-center gap-1 text-sm overflow-x-auto no-scrollbar">
              <Link href="/admin" className="px-2.5 sm:px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm">
                Overview
              </Link>
              <Link href="/admin/users" className="px-2.5 sm:px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm">
                Users
              </Link>
              <Link href="/admin/tracks" className="px-2.5 sm:px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm">
                Tracks
              </Link>
              <Link href="/admin/reviews" className="px-2.5 sm:px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm">
                Reviews
              </Link>
              <Link href="/admin/support" className="px-2.5 sm:px-3 py-1.5 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm">
                Support
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
