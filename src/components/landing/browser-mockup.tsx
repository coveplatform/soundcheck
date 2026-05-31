"use client";

interface BrowserMockupProps {
  url: string;
  children: React.ReactNode;
}

export function BrowserMockup({ url, children }: BrowserMockupProps) {
  return (
    <div className="rounded-3xl overflow-hidden border border-black/8 bg-white shadow-[0_24px_64px_-8px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)] transition-transform transition-shadow duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_32px_80px_-8px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.05)] motion-reduce:transition-none motion-reduce:transform-none">
      {/* Browser Chrome */}
      <div className="bg-[#faf7f2] border-b border-black/8 px-4 py-3 flex items-center gap-3">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-sm" />
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-lg mx-auto">
          <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-neutral-500 border border-black/8 text-center font-mono shadow-sm">
            {url}
          </div>
        </div>

        {/* Spacer to balance */}
        <div className="w-[52px]" />
      </div>

      {/* Content */}
      <div className="bg-[#faf7f2]">
        {children}
      </div>
    </div>
  );
}
