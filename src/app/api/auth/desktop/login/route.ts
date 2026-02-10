import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate API key for desktop app
    // In production, store this in database with expiration
    const apiKey = crypto.randomBytes(32).toString("hex");

    // For now, we'll use a simple JWT-like format
    // Format: userId.apiKey (you should encrypt this in production)
    const token = `${user.id}.${apiKey}`;

    return NextResponse.json({
      success: true,
      apiKey: token,
      email: user.email,
      userId: user.id,
    });
  } catch (error) {
    console.error("Desktop login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
