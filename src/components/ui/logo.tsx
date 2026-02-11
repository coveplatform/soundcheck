import * as React from "react";

import { cn } from "@/lib/utils";

export type LogoProps = React.ComponentPropsWithoutRef<"div">;

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-2.5 text-black", className)}
      aria-label="MixReflect"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className="h-7 w-7 shrink-0"
        role="img"
        aria-hidden="true"
      >
        <rect
          x="10"
          y="10"
          width="180"
          height="180"
          rx="40"
          ry="40"
          fill="#9333ea"
        />

        <g fill="white">
          <rect x="42" y="78" width="16" height="44" rx="3" />
          <rect x="68" y="55" width="16" height="90" rx="3" />
          <rect x="94" y="38" width="16" height="124" rx="3" />
          <rect x="120" y="62" width="16" height="76" rx="3" />
          <rect x="146" y="82" width="16" height="36" rx="3" />
        </g>
      </svg>

      <span className="inline-block h-7 text-[20px] leading-7 tracking-tight">
        <span className="font-extrabold">Mix</span><span className="font-normal text-neutral-500">Reflect</span>
      </span>
    </div>
  );
}
