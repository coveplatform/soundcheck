import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountSettingsClient } from "@/components/account/account-settings-client";
import { SparklesDoodle, StarDoodle } from "@/components/dashboard/doodles";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, password: true },
  });

  if (!dbUser?.email) {
    redirect("/login");
  }

  const reviewerProfile = await prisma.reviewerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // Get artist profile for credit balance
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      artistName: true,
      reviewCredits: true,
      subscriptionStatus: true,
    },
  });

  const isReviewer = Boolean(reviewerProfile);
  const isPro = artistProfile?.subscriptionStatus === "active";
  const credits = artistProfile?.reviewCredits ?? 0;

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative overflow-hidden">
          <SparklesDoodle className="absolute -bottom-4 left-[42%] w-20 h-20 text-purple-400/20 pointer-events-none" />
          <StarDoodle className="absolute top-2 right-[34%] w-10 h-10 text-purple-400/15 pointer-events-none" />
          <div className="flex items-start justify-between gap-6 relative">
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
                Account.
              </h1>
              <p className="text-sm text-black/40 font-medium mt-2">
                Manage your profile, credits, and preferences.
              </p>
            </div>
            {artistProfile && (
              <div className="flex-shrink-0 text-right pl-5 sm:pl-8 border-l-2 border-black/10">
                <p className="text-5xl sm:text-6xl font-black text-black leading-none tabular-nums">
                  {artistProfile.reviewCredits ?? 0}
                </p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1.5">
                  credits
                </p>
                <Link
                  href="/review"
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-800 mt-2 block transition-colors"
                >
                  Earn more →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DARK STRIP ──────────────────────────────────────────── */}
      <div className="bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/55">Account</span>
          <span className="w-px h-3 bg-white/15" />
          <span className="text-[11px] font-bold text-white/55">
            {artistProfile?.artistName ?? dbUser.name ?? dbUser.email}
          </span>
        </div>
      </div>

      {/* ── PLAN & CREDITS ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="border-2 border-black rounded-2xl overflow-hidden bg-white">
          <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/30 mb-1">Current plan</p>
              <p className="text-lg font-black text-black leading-none">{isPro ? "Pro" : "Free"}</p>
              <p className="text-xs text-black/40 font-medium mt-0.5">{isPro ? "Active subscription" : "Pay per credit"}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-black tabular-nums leading-none">{credits}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35 mt-1">credits</p>
              <Link href="/review" className="text-[11px] font-bold text-purple-600 hover:text-purple-800 mt-1.5 block transition-colors">
                Earn more →
              </Link>
            </div>
          </div>
          {!isPro && (
            <Link href="/pro" className="flex items-center gap-3 px-5 py-4 bg-black hover:bg-neutral-900 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-purple-400 leading-none">Upgrade to Pro</p>
                <p className="text-xs text-white/40 font-medium mt-0.5">30 credits/mo · unlimited reviews/day · up to 10 reviews per track</p>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400/50 flex-shrink-0" />
            </Link>
          )}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-4">
          <AccountSettingsClient
            initialName={dbUser.name ?? ""}
            artistName={artistProfile?.artistName ?? null}
            email={dbUser.email}
            hasPassword={Boolean(dbUser.password)}
            reviewCredits={artistProfile?.reviewCredits ?? 0}
          />

        </div>
      </div>
    </div>
  );
}
