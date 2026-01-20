import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-mono tracking-widest text-black/50 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.02]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-base sm:text-lg text-black/70 leading-relaxed max-w-prose">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
