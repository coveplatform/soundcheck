"use client";

import { useAnimateOnScroll } from "@/hooks/use-animate-on-scroll";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export function AnimatedSection({ children, className, stagger }: AnimatedSectionProps) {
  const ref = useAnimateOnScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        stagger ? "stagger-children" : "animate-on-scroll",
        className
      )}
    >
      {children}
    </div>
  );
}
