import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardBackdrop } from "@/components/dashboard/backdrop";

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] relative">
      <DashboardBackdrop />
      <DashboardNav user={session.user} />
      <main className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-8 sm:py-12 pb-28 md:pb-12 md:pl-64 lg:pl-72">
        {children}
      </main>
    </div>
  );
}
