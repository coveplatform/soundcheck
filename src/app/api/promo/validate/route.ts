import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "No code provided" });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check if promo code is in the valid list
    const validPromoCodes = (process.env.PROMO_CODES ?? "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (!validPromoCodes.includes(normalizedCode)) {
      return NextResponse.json({ valid: false, error: "Invalid promo code" });
    }

    // Check if user already used a promo code before
    const existingPromoUsage = await prisma.payment.findFirst({
      where: {
        stripeSessionId: { startsWith: "promo_" },
        track: {
          artist: {
            userId: session.user.id,
          },
        },
      },
    });

    if (existingPromoUsage) {
      return NextResponse.json({
        valid: false,
        error: "You have already used a promo code",
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
