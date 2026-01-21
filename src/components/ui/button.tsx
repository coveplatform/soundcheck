"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white hover:bg-neutral-800 active:scale-[0.98]",
        primary:
          "bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] shadow-sm hover:shadow-md",
        secondary:
          "bg-teal-500 text-white hover:bg-teal-600 active:scale-[0.98] shadow-sm hover:shadow-md",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
        outline:
          "border-2 border-neutral-300 bg-white text-black hover:bg-neutral-50 hover:border-neutral-400 active:scale-[0.98]",
        outlinePrimary:
          "border-2 border-purple-600 bg-white text-purple-600 hover:bg-purple-50 active:scale-[0.98]",
        ghost:
          "text-neutral-700 hover:bg-neutral-100 hover:text-black active:bg-neutral-200",
        link:
          "text-purple-600 underline-offset-4 hover:underline hover:text-purple-700",

        // Keep legacy variants for gradual migration
        airy:
          "bg-white/60 text-black border border-black/10 hover:bg-white/80",
        airyPrimary:
          "bg-black text-white border border-black/10 hover:bg-black/90",
        airyOutline:
          "bg-transparent text-black border border-black/20 hover:bg-black/5",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-6 text-base rounded-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
