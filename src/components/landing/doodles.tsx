"use client";

// Hand-drawn style decorative elements - big, quirky, fills space

export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-4 -4 72 72" fill="none" className={className}>
      <path
        d="M32 6L35 26L58 32L35 38L32 58L29 38L6 32L29 26L32 6Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />
      <path d="M32 12L34 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 52L30 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 32L30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 32L34 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-4 -4 72 72" fill="none" className={className}>
      <path d="M32 6L35 26L58 32L35 38L32 58L29 38L6 32L29 26L32 6Z" fill="currentColor" />
    </svg>
  );
}

export function Blob1({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-4 -4 72 72" fill="none" className={className}>
      <path
        d="M32 6L50 46H14L32 6Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinejoin="miter"
      />
      <path
        d="M32 58L14 18H50L32 58Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinejoin="miter"
      />
      <path d="M32 14V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 42V50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="32" r="3.25" fill="white" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function Blob2({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" fill="none" className={className}>
      <path
        d="M50 10C80 10 95 30 90 55C85 80 70 100 45 105C20 110 5 85 10 55C15 25 20 10 50 10Z"
        fill="currentColor"
        opacity="0.06"
      />
      <path
        d="M50 10C80 10 95 30 90 55C85 80 70 100 45 105C20 110 5 85 10 55C15 25 20 10 50 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Scribble({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" fill="none" className={className}>
      <path
        d="M10 40C25 20 40 60 55 30C70 0 85 50 95 35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 55C20 75 50 25 75 65C85 80 95 50 98 60"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Zigzag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" fill="none" className={className}>
      <path
        d="M10 10L50 30L10 50L50 70L10 90L50 110"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Loop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-6 -6 112 72" fill="none" className={className}>
      <path
        d="M50 6L52.8 22.5L69 30L52.8 37.5L50 54L47.2 37.5L31 30L47.2 22.5L50 6Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />
      <path d="M50 12L51.6 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 48L48.4 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 30L48 28.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M64 30L52 31.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Cross({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-4 -4 68 68" fill="none" className={className}>
      <g>
        <path
          d="M20 10L22 18L30 20L22 22L20 30L18 22L10 20L18 18L20 10Z"
          fill="white"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="miter"
        />
        <path
          d="M40 30L42 40L52 42L42 44L40 54L38 44L28 42L38 40L40 30Z"
          fill="white"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
}

// Keep these for backwards compatibility but they won't be used
export function MusicNote({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-4 -4 72 72" fill="none" className={className}>
      <path
        d="M33 12V30"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M33 36V54"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12 31H30"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M36 33H56"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 20L26 26M44 40L50 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M48 18L44 26"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M22 48L28 44"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="30" cy="34" r="6" fill="white" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function Squiggle({ className = "" }: { className?: string }) {
  return <Loop className={className} />;
}

export function Circle({ className = "" }: { className?: string }) {
  return <Blob1 className={className} />;
}

export function Dots({ className = "" }: { className?: string }) {
  return <Cross className={className} />;
}
