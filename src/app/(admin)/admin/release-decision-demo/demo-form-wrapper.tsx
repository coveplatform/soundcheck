"use client";

import { useState } from "react";
import { ReleaseDecisionForm } from "@/app/(dashboard)/reviewer/review/[id]/components/release-decision-form";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

export function DemoFormWrapper() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDemoSubmit = async (data: any) => {
    setIsSubmitting(true);
    console.log("Demo submission:", data);
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black mb-1 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Reviewer Experience
        </h2>
        <p className="text-sm text-neutral-600 mb-4">The form PRO reviewers fill out (scrollable demo)</p>
      </div>

      <Card variant="soft" elevated className="sticky top-6">
        <CardContent className="pt-6">
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <p className="text-sm font-semibold text-purple-900">
              <strong>Note:</strong> This is a preview. Form submissions won't be saved.
            </p>
          </div>

          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 -mr-2">
            <ReleaseDecisionForm
              trackId="demo-track-id"
              trackTitle="Demo Track"
              onSubmit={handleDemoSubmit}
              listenTime={200}
              minListenTime={180}
              isSubmitting={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
