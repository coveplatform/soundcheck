"use client";

import { useState } from "react";
import { WelcomeModal } from "./welcome-modal";

interface WelcomeModalWrapperProps {
  showWelcome: boolean;
  freeCredits: number;
}

export function WelcomeModalWrapper({ showWelcome, freeCredits }: WelcomeModalWrapperProps) {
  const [isOpen, setIsOpen] = useState(showWelcome);

  if (!showWelcome) return null;

  return (
    <WelcomeModal
      open={isOpen}
      onDismiss={() => setIsOpen(false)}
      freeCredits={freeCredits}
    />
  );
}
