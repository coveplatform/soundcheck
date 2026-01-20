import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArtistNav } from "@/components/dashboard/artist-nav";
import { VerifyEmailBanner } from "@/components/ui/verify-email-banner";

export default async function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [user, artistProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    }),
    prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        artistName: true,
        totalEarnings: true,
      },
    }),
  ]);

  const artistName = artistProfile?.artistName || session.user.name || "Artist";
  const hasEarnings = (artistProfile?.totalEarnings || 0) > 0;

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <ArtistNav
        user={{
          name: session.user.name,
          email: session.user.email,
          isReviewer: session.user.isReviewer,
        }}
        artistName={artistName}
        hasEarnings={hasEarnings}
      />

      {!user?.emailVerified && (
        <div className="pt-16 px-6 sm:px-8">
          <VerifyEmailBanner />
        </div>
      )}

      <main className="pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
