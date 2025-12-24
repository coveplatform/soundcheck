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
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b-2 border-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <span className="text-sm text-neutral-400">Admin</span>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-neutral-600 hover:text-neutral-900">
                Overview
              </Link>
              <Link href="/admin/users" className="text-neutral-600 hover:text-neutral-900">
                Users
              </Link>
              <Link href="/admin/tracks" className="text-neutral-600 hover:text-neutral-900">
                Tracks
              </Link>
              <Link href="/admin/reviews" className="text-neutral-600 hover:text-neutral-900">
                Reviews
              </Link>
              <Link href="/admin/reviewers" className="text-neutral-600 hover:text-neutral-900">
                Reviewers
              </Link>
              <Link href="/admin/support" className="text-neutral-600 hover:text-neutral-900">
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
