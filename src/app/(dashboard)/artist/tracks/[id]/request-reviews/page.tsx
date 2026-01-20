"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowRight } from "lucide-react";

export default function RequestReviewsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const trackId = params?.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const requestReviews = async () => {
    if (!trackId) {
      setError("No track specified");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tracks/${trackId}/request-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType: "STANDARD" }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (
          res.status === 403 &&
          typeof data?.error === "string" &&
          data.error.toLowerCase().includes("verify")
        ) {
          router.push("/verify-email");
          router.refresh();
          return;
        }

        setError((data as any)?.error || "Failed to request reviews");
        return;
      }

      // Redirect to track page after successful submission
      router.push(`/artist/tracks/${trackId}`);
    } catch {
      setError("Failed to request reviews");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-14 sm:pt-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href={trackId ? `/artist/tracks/${trackId}` : "/artist/tracks"}
            className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors duration-150 ease-out motion-reduce:transition-none"
          >
            ← Back
          </Link>

          <PageHeader
            className="mt-6"
            eyebrow="Reviews"
            title="Request reviews"
            description="Submit your track to receive feedback from listeners"
          />
        </div>

        {error && (
          <Card variant="soft" elevated className="mb-6 border border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800 font-bold">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card variant="soft" elevated className="mb-6">
          <CardContent className="pt-6">
            <h3 className="text-xl font-light tracking-tight mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-black/60">
              <li>• Your track will be added to the listening queue</li>
              <li>• Listeners will provide detailed feedback</li>
              <li>• You'll receive notifications as reviews come in</li>
            </ul>
          </CardContent>
        </Card>

        <Button
          onClick={requestReviews}
          isLoading={isSubmitting}
          variant="airyPrimary"
          className="w-full h-12"
          disabled={!trackId || isSubmitting}
        >
          Request reviews
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
