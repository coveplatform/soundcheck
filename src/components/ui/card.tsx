import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
  variant?: "brutal" | "soft" | "airy";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, elevated, variant = "brutal", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        variant === "brutal"
          ? "border-2 border-black bg-white text-neutral-950"
          : variant === "soft"
            ? "rounded-3xl border border-black/10 bg-white/70 text-neutral-950 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            : "rounded-3xl border border-black/10 bg-white/55 text-neutral-950 backdrop-blur-sm",
        elevated &&
          (variant === "brutal"
            ? "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            : variant === "soft"
              ? "bg-white shadow-[0_16px_40px_rgba(0,0,0,0.10)]"
              : "shadow-[0_12px_40px_rgba(0,0,0,0.06)]"),
        interactive &&
          (variant === "brutal"
            ? "cursor-pointer transition-transform transition-shadow duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none motion-reduce:transform-none"
            : variant === "soft"
              ? "cursor-pointer transition-transform transition-shadow duration-150 ease-out hover:-translate-y-[1px] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] active:translate-y-[1px] active:shadow-[0_10px_30px_rgba(0,0,0,0.10)] motion-reduce:transition-none motion-reduce:transform-none"
              : "cursor-pointer transition-colors duration-150 ease-out hover:bg-white/75 motion-reduce:transition-none"),
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-600", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
