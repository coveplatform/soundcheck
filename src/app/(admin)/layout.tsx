import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { Logo } from "@/components/ui/logo";
import { jakarta } from "./admin-ui";

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

  const navLinks = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/tracks", label: "Tracks" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/reviewers", label: "Reviewers" },
    { href: "/admin/support", label: "Support" },
  ];

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef]`}>
      <header className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/" className="flex items-center">
                <Logo />
              </Link>
              <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-bold bg-[#6ee7ff]/15 text-[#6ee7ff] rounded border border-[#6ee7ff]/30 uppercase tracking-wider">
                Admin
              </span>
            </div>
            <nav className="flex items-center gap-1 text-sm overflow-x-auto no-scrollbar">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-2.5 sm:px-3 py-1.5 rounded-md text-white/55 hover:text-[#6ee7ff] hover:bg-white/5 font-medium transition-colors whitespace-nowrap text-xs sm:text-sm"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
