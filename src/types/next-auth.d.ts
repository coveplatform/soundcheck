import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      emailVerified?: string | null;
      name?: string | null;
      image?: string | null;
      isArtist: boolean;
      isReviewer: boolean;
      artistProfileId?: string;
      listenerProfileId?: string;
      reviewerProfileId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isArtist?: boolean;
    isReviewer?: boolean;
    artistProfileId?: string;
    listenerProfileId?: string;
    reviewerProfileId?: string;
    emailVerified?: string | null;
  }
}
