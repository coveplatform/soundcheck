import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DebugProPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ArtistProfile: true,
    },
  });

  const isPro = user?.ArtistProfile?.subscriptionStatus === "active";

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-white border-2 border-black rounded-2xl p-8 space-y-4">
        <h1 className="text-2xl font-black">Pro Status Debug</h1>

        <div className="space-y-2">
          <p><strong>Session Email:</strong> {session.user.email}</p>
          <p><strong>Session User ID:</strong> {session.user.id}</p>
          <p><strong>User ID from DB:</strong> {user?.id || "not found"}</p>
          <p><strong>User Email from DB:</strong> {user?.email || "not found"}</p>
          <p><strong>Has Artist Profile:</strong> {user?.ArtistProfile ? "Yes" : "No"}</p>
          {user?.ArtistProfile && (
            <>
              <p><strong>Artist Profile ID:</strong> {user.ArtistProfile.id}</p>
              <p><strong>Artist Name:</strong> {user.ArtistProfile.artistName}</p>
              <p><strong>Subscription Status:</strong> {user.ArtistProfile.subscriptionStatus || "null"}</p>
              <p><strong>Subscription Tier:</strong> {user.ArtistProfile.subscriptionTier || "null"}</p>
            </>
          )}
          <p className="text-2xl font-black pt-4">
            <strong>isPro:</strong> {isPro ? "✅ TRUE" : "❌ FALSE"}
          </p>
        </div>
      </div>
    </div>
  );
}
