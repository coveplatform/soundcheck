import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Rate limit by email to prevent brute force attacks
        const rateLimit = await checkRateLimit(
          `login:${normalizedEmail}`,
          RATE_LIMITS.login
        );

        if (!rateLimit.success) {
          throw new Error(
            `TooManyAttempts:${rateLimit.retryAfterSeconds}`
          );
        }

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: "insensitive",
            },
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        // Note: Email verification is NOT checked at login.
        // Instead, it's enforced at specific actions that require it (e.g., paid checkout).
        // This allows new users to sign in and use their free credit without friction.

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If the url is relative, prefix with baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If the url is on the same origin, allow it
      if (new URL(url).origin === baseUrl) return url;
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Update last login timestamp on fresh login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
      // Fetch user roles from database
      if (token.email) {
        const normalizedEmail =
          typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
        const where = {
          email: {
            equals: normalizedEmail,
            mode: "insensitive" as const,
          },
        };

        const dbUser = await prisma.user.findFirst({
          where,
          select: {
            id: true,
            isArtist: true,
            isReviewer: true,
            ArtistProfile: { select: { id: true } },
            ReviewerProfile: { select: { id: true } },
          },
        });
        const db = dbUser as null | {
          id: string;
          isArtist: boolean;
          isReviewer: boolean;
          ArtistProfile?: { id: string } | null;
          ReviewerProfile?: { id: string } | null;
        };
        if (db) {
          token.id = db.id;
          token.isArtist = db.isArtist;
          token.isReviewer = db.isReviewer;
          token.artistProfileId = db.ArtistProfile?.id;
          const reviewerProfileId = db.ReviewerProfile?.id;
          token.listenerProfileId = reviewerProfileId;
          token.reviewerProfileId = reviewerProfileId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isArtist = token.isArtist as boolean;
        session.user.isReviewer = token.isReviewer as boolean;
        session.user.artistProfileId = token.artistProfileId as string | undefined;
        session.user.listenerProfileId = token.listenerProfileId as string | undefined;
        session.user.reviewerProfileId = token.reviewerProfileId as string | undefined;
      }
      return session;
    },
  },
};
