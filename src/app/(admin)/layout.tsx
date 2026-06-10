import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { Logo } from "@/components/ui/logo";
import { jakarta, mono, ACCENT } from "./admin-ui";

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
    { href: "/admin", label: "overview" },
    { href: "/admin/users", label: "users" },
    { href: "/admin/reports", label: "reports" },
    { href: "/admin/tracks", label: "tracks" },
    { href: "/admin/reviews", label: "reviews" },
    { href: "/admin/reviewers", label: "reviewers" },
    { href: "/admin/support", label: "support" },
  ];

  return (
    <div className={`${jakarta.className} min-h-screen bg-[#0a0a0a] text-[#f4f4ef]`}>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between h-16 gap-6">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href="/" className="shrink-0">
                <Logo markFill={ACCENT} barFill="#0a0a0a" className="text-white h-7" />
              </Link>
              <span className={`${mono.className} hidden sm:inline text-[11px] text-[#6ee7ff]/80 lowercase`}>
                [ admin ]
              </span>
            </div>
            <nav
              className={`${mono.className} flex items-center gap-4 sm:gap-5 text-[13px] text-white/55 overflow-x-auto no-scrollbar lowercase`}
            >
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
