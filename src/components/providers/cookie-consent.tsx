"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";

type ConsentStatus = "granted" | "denied" | null;

const STORAGE_KEY = "mixreflect_cookie_consent";

const CookieConsentContext = createContext<{
  consent: ConsentStatus;
  grant: () => void;
  deny: () => void;
}>({ consent: null, grant: () => {}, deny: () => {} });

export function CookieConsentProvider({ children, requiresConsent = false }: { children: React.ReactNode; requiresConsent?: boolean }) {
  const [consent, setConsent] = useState<ConsentStatus>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      setConsent(stored);
    }
  }, []);

  const grant = () => {
    localStorage.setItem(STORAGE_KEY, "granted");
    setConsent("granted");
  };

  const deny = () => {
    localStorage.setItem(STORAGE_KEY, "denied");
    setConsent("denied");
  };

  // If the user isn't in a GDPR jurisdiction, treat as granted without showing the banner
  const effectiveConsent = requiresConsent ? consent : "granted";

  return (
    <CookieConsentContext.Provider value={{ consent: effectiveConsent, grant, deny }}>
      {children}
      {requiresConsent && consent === null && <CookieConsentBanner grant={grant} deny={deny} />}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}

function CookieConsentBanner({ grant, deny }: { grant: () => void; deny: () => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black p-4">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-neutral-700 flex-1">
          We use analytics and advertising cookies (PostHog, Microsoft Clarity, TikTok, Reddit) to improve
          the product and measure marketing performance. Essential login cookies are always active.{" "}
          <Link href="/privacy" className="underline font-bold">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={deny}
            className="px-4 py-2 text-sm border-2 border-black font-bold hover:bg-neutral-100 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={grant}
            className="px-4 py-2 text-sm bg-black text-white font-bold hover:bg-neutral-800 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
