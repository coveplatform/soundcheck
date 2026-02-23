import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProPricingClient } from "@/components/pro/pro-pricing-client";

export const dynamic = "force-dynamic";

export default async function ProPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
    },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  const isPro = artistProfile.subscriptionStatus === "active";

  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 overflow-x-hidden">
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/25 mb-2">Upgrade</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-black leading-[0.95]">
            Go Pro.
          </h1>
          <p className="text-sm text-black/40 font-medium mt-3">
            More slots, faster feedback, priority placement.
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <ProPricingClient isPro={isPro} />
      </div>
    </div>
  );
}
