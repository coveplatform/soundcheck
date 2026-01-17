import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Inline script to set body background immediately before React hydrates */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.body.style.backgroundColor='black';`,
        }}
      />
      <div className="min-h-screen flex flex-col bg-black text-white" style={{ background: 'linear-gradient(to bottom, black, #0a0a0a, black)' }}>
        {/* Header */}
      <header className="border-b border-neutral-800 bg-black/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <Logo className="text-white" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-md sm:max-w-xl">{children}</div>
      </div>
      </div>
    </>
  );
}
