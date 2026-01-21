import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArtistSidebar } from "@/components/dashboard/artist-sidebar";
import { VerifyEmailBanner } from "@/components/ui/verify-email-banner";
import { ArtistLayoutClient } from "@/components/dashboard/artist-layout-client";

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
    <ArtistLayoutClient>
      <div className="min-h-screen bg-[#faf8f5]">
        <ArtistSidebar
          user={{
            name: session.user.name,
            email: session.user.email,
            isReviewer: session.user.isReviewer,
          }}
          artistName={artistName}
          hasEarnings={hasEarnings}
        />

        {/* Main content with sidebar offset */}
        <div className="md:pl-64">
          {!user?.emailVerified && (
            <div className="pt-6 px-6 sm:px-8">
              <VerifyEmailBanner />
            </div>
          )}

          <main className="pb-24 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    </ArtistLayoutClient>
  );
}
