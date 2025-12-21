import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["artist", "reviewer", "both"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role flags
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isArtist: role === "artist" || role === "both",
        isReviewer: role === "reviewer" || role === "both",
      },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: user.id,
        isArtist: user.isArtist,
        isReviewer: user.isReviewer,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
