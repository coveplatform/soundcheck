"use client";

interface BrowserMockupProps {
  url: string;
  children: React.ReactNode;
}

export function BrowserMockup({ url, children }: BrowserMockupProps) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl shadow-neutral-300/50 border border-neutral-200/80 bg-white">
      {/* Browser Chrome */}
      <div className="bg-gradient-to-b from-neutral-100 to-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-sm" />
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-lg mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-1.5 text-sm text-neutral-500 border border-neutral-200/80 text-center font-mono">
            {url}
          </div>
        </div>

        {/* Spacer to balance */}
        <div className="w-[52px]" />
      </div>

      {/* Content */}
      <div className="bg-[#f7f7f5]">
        {children}
      </div>
    </div>
  );
}
