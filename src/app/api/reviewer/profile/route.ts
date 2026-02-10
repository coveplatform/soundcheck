import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Control whether new reviewer signups are allowed
const REVIEWER_SIGNUPS_OPEN = false;

const countrySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z]{2}$/.test(value), {
    message: "Country must be a 2-letter code (e.g. AU, US)",
  });

const createProfileSchema = z.object({
  genreIds: z.array(z.string()).min(3, "Select at least 3 genres").max(5),
  country: countrySchema.optional(),
});

const quizAnswersSchema = z.object({
  compression: z.string(),
  bpm: z.string(),
  eq: z.string(),
  daw: z.string(),
});

const patchProfileSchema = z.object({
  completedOnboarding: z.boolean().optional(),
  country: countrySchema.optional(),
  quizAnswers: quizAnswersSchema.optional(),
});

function scoreQuiz(answers: z.infer<typeof quizAnswersSchema>): number {
  let score = 0;
  if (answers.compression === "dynamic_range") score += 1;
  if (answers.bpm === "tempo") score += 1;
  if (answers.eq === "frequency_balance") score += 1;
  if (answers.daw === "digital_audio_workstation") score += 1;
  return score;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { genreIds, country } = createProfileSchema.parse(body);

    // Check if profile already exists
    const existingProfile = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Block new reviewer signups if closed
    if (!existingProfile && !REVIEWER_SIGNUPS_OPEN) {
      return NextResponse.json(
        { error: "Reviewer signups are currently closed" },
        { status: 403 }
      );
    }

    if (existingProfile) {
      // Update existing profile
      const profile = await prisma.reviewerProfile.update({
        where: { userId: session.user.id },
        data: {
          genres: {
            set: genreIds.map((id) => ({ id })),
          },
          country: country ?? undefined,
        },
        include: { Genre: true },
      });

      return NextResponse.json(profile);
    }

    // Create new profile
    const profile = await prisma.reviewerProfile.create({
      data: {
        userId: session.user.id,
        genres: {
          connect: genreIds.map((id) => ({ id })),
        },
        country: country ?? undefined,
      },
      include: { Genre: true },
    });

    // Update user to mark as reviewer
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isReviewer: true },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating listener profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      include: { Genre: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching listener profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { completedOnboarding, quizAnswers, country } = patchProfileSchema.parse(body);

    let profile = await prisma.reviewerProfile.findUnique({
      where: { userId: session.user.id },
      include: { Genre: true },
    });

    if (!profile) {
      // Block new reviewer signups if closed
      if (!REVIEWER_SIGNUPS_OPEN) {
        return NextResponse.json(
          { error: "Reviewer signups are currently closed" },
          { status: 403 }
        );
      }

      profile = await prisma.reviewerProfile.create({
        data: {
          userId: session.user.id,
        },
        include: { Genre: true },
      });

      await prisma.user.update({
        where: { id: session.user.id },
        data: { isReviewer: true },
      });
    }

    if (quizAnswers) {
      const score = scoreQuiz(quizAnswers);
      const passed = score >= 3;

      const updated = await prisma.reviewerProfile.update({
        where: { id: profile.id },
        data: {
          onboardingQuizScore: score,
          onboardingQuizPassed: passed,
          onboardingQuizCompletedAt: new Date(),
          country: country ?? undefined,
        },
      });

      return NextResponse.json({
        success: true,
        score,
        passed,
        profile: updated,
      });
    }

    if (completedOnboarding === true) {
      if (!profile.onboardingQuizPassed) {
        return NextResponse.json(
          { error: "Please complete the quiz before finishing onboarding" },
          { status: 400 }
        );
      }
      if (profile.genres.length < 3) {
        return NextResponse.json(
          { error: "Please select at least 3 genres" },
          { status: 400 }
        );
      }
      const completedCountry = country ?? profile.country;
      if (!completedCountry) {
        return NextResponse.json(
          { error: "Please set your country before finishing onboarding" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.reviewerProfile.update({
      where: { id: profile.id },
      data: {
        completedOnboarding: completedOnboarding ?? undefined,
        country: country ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("Error updating listener profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
