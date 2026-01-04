// Platform icons for supported music platforms
// Clean, centered SVG icons optimized for display at various sizes

export function SoundCloudIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.56 8.87V17h8.76c1.85-.13 3.32-1.67 3.32-3.56 0-1.96-1.6-3.56-3.56-3.56-.39 0-.77.06-1.12.18-.25-2.56-2.4-4.57-5.01-4.57-1.02 0-1.98.3-2.79.83-.25.16-.32.27-.32.53v8.02h.72z"/>
      <path d="M2.95 12.87c-.16 0-.29.13-.3.3l-.24 2.23.24 2.18c.01.17.14.3.3.3s.29-.13.3-.3l.27-2.18-.27-2.23c-.01-.17-.14-.3-.3-.3zm-1.4 1.57c-.16 0-.28.12-.3.28l-.17 1.21.17 1.18c.02.16.14.28.3.28s.28-.12.3-.28l.19-1.18-.19-1.21c-.02-.16-.14-.28-.3-.28zm2.82-1.57c-.17 0-.31.14-.32.32l-.21 2.21.21 2.11c.01.18.15.32.32.32s.31-.14.32-.32l.24-2.11-.24-2.21c-.01-.18-.15-.32-.32-.32zm1.41-.41c-.18 0-.33.15-.34.34l-.18 2.62.18 2.46c.01.19.16.34.34.34s.33-.15.34-.34l.21-2.46-.21-2.62c-.01-.19-.16-.34-.34-.34zm1.41-.49c-.19 0-.35.16-.36.36l-.15 3.11.15 2.8c.01.2.17.36.36.36s.35-.16.36-.36l.17-2.8-.17-3.11c-.01-.2-.17-.36-.36-.36zm1.42-.17c-.2 0-.37.17-.38.38l-.12 3.28.12 2.91c.01.21.18.38.38.38s.37-.17.38-.38l.14-2.91-.14-3.28c-.01-.21-.18-.38-.38-.38z"/>
    </svg>
  );
}

export function BandcampIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
    </svg>
  );
}

export function YouTubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export function StripeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
    </svg>
  );
}

export function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
