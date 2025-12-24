import * as React from "react";

import { cn } from "@/lib/utils";

export type LogoProps = React.ComponentPropsWithoutRef<"div">;

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-2 text-black", className)}
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
          x="20"
          y="20"
          width="160"
          height="160"
          fill="none"
          stroke="currentColor"
          strokeWidth="15"
        />

        <g fill="currentColor">
          <rect x="45" y="90" width="10" height="20" />
          <rect x="55" y="75" width="10" height="50" />
          <rect x="65" y="60" width="10" height="80" />
          <rect x="75" y="80" width="10" height="40" />
          <rect x="85" y="50" width="10" height="100" />
          <rect x="95" y="70" width="10" height="60" />
          <rect x="105" y="40" width="10" height="120" />
          <rect x="115" y="85" width="10" height="30" />
          <rect x="125" y="65" width="10" height="70" />
          <rect x="135" y="90" width="10" height="20" />
          <rect x="145" y="80" width="10" height="40" />
        </g>
      </svg>

      <span className="inline-block h-7 text-xl font-bold leading-7">
        mixreflect
      </span>
    </div>
  );
}
