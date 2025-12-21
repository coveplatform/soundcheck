"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, Headphones, Users } from "lucide-react";

type Role = "artist" | "reviewer" | "both";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Sign in after successful signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but couldn't sign in. Please try logging in.");
      } else {
        // Redirect based on role
        if (data.isArtist) {
          router.push("/artist/onboarding");
        } else {
          router.push("/reviewer/onboarding");
        }
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "role") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join SoundCheck</CardTitle>
          <CardDescription>
            How do you want to use SoundCheck?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => handleRoleSelect("artist")}
            className="w-full p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-left flex items-start gap-4"
          >
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Music className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">I&apos;m an Artist</h3>
              <p className="text-sm text-neutral-500">
                Get genuine feedback on your tracks before release
              </p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("reviewer")}
            className="w-full p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-left flex items-start gap-4"
          >
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">I&apos;m a Reviewer</h3>
              <p className="text-sm text-neutral-500">
                Get paid to discover new music and share feedback
              </p>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("both")}
            className="w-full p-4 border border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-colors text-left flex items-start gap-4"
          >
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Both</h3>
              <p className="text-sm text-neutral-500">
                Submit tracks and review others&apos; music
              </p>
            </div>
          </button>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-neutral-500 text-center w-full">
            Already have an account?{" "}
            <Link href="/login" className="text-neutral-900 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          {role === "artist" && "Start getting feedback on your music"}
          {role === "reviewer" && "Start discovering and reviewing music"}
          {role === "both" && "Submit tracks and review music"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create account
          </Button>
          <button
            type="button"
            onClick={() => setStep("role")}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Back to role selection
          </button>
        </CardFooter>
      </form>
    </Card>
  );
}
