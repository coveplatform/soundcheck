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
    <div className="pt-8 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProPricingClient isPro={isPro} />
      </div>
    </div>
  );
}
