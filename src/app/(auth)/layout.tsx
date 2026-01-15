import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-neutral-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black/40 backdrop-blur">
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
  );
}
