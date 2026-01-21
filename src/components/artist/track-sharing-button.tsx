"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackSharingModal } from "./track-sharing-modal";

interface TrackSharingButtonProps {
  trackId: string;
  trackTitle: string;
  sourceType: string;
  sharingEnabled: boolean;
}

export function TrackSharingButton({
  trackId,
  trackTitle,
  sourceType,
  sharingEnabled,
}: TrackSharingButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant={sharingEnabled ? "airy" : "default"}
        className={
          !sharingEnabled
            ? "bg-purple-500 hover:bg-purple-600 text-white border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            : ""
        }
      >
        <Share2 className="h-4 w-4 mr-2" />
        {sharingEnabled ? "Manage Sharing" : "Enable Sharing"}
      </Button>

      <TrackSharingModal
        trackId={trackId}
        trackTitle={trackTitle}
        sourceType={sourceType}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          router.refresh();
        }}
      />
    </>
  );
}
