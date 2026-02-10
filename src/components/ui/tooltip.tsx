"use client";

import * as React from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState<"top" | "bottom">("top");
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Check if there's enough space above
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const tooltipHeight = tooltipRect.height;

    // Flip to bottom if not enough space above
    if (spaceAbove < tooltipHeight + 8 && spaceBelow > tooltipHeight + 8) {
      setPosition("bottom");
    } else {
      setPosition("top");
    }

    // Check horizontal overflow
    const tooltipLeft = rect.left + rect.width / 2 - tooltipRect.width / 2;
    const tooltipRight = tooltipLeft + tooltipRect.width;

    if (tooltipLeft < 8) {
      // Too far left
      tooltip.style.left = "8px";
      tooltip.style.transform = "translateX(0)";
    } else if (tooltipRight > window.innerWidth - 8) {
      // Too far right
      tooltip.style.left = "auto";
      tooltip.style.right = "8px";
      tooltip.style.transform = "translateX(0)";
    } else {
      // Centered
      tooltip.style.left = "50%";
      tooltip.style.right = "auto";
      tooltip.style.transform = "translateX(-50%)";
    }
  }, [isVisible]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 px-3 py-2 text-xs font-semibold
            text-purple-900 bg-purple-50 border-2 border-purple-200
            rounded-lg shadow-lg whitespace-nowrap pointer-events-none
            ${
              position === "top"
                ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
                : "top-full left-1/2 -translate-x-1/2 mt-2"
            }
          `}
        >
          {content}
          {/* Arrow pointer */}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 w-0 h-0
              border-l-[6px] border-l-transparent
              border-r-[6px] border-r-transparent
              ${
                position === "top"
                  ? "top-full -mt-[2px] border-t-[6px] border-t-purple-200"
                  : "bottom-full -mb-[2px] border-b-[6px] border-b-purple-200"
              }
            `}
          />
        </div>
      )}
    </div>
  );
}
