"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors transition-shadow transition-transform duration-150 ease-out active:transition-none motion-reduce:transition-none motion-reduce:transform-none",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white border-2 border-black hover:bg-neutral-800 active:bg-neutral-900",
        primary:
          "bg-lime-400 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-lime-300 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:bg-lime-500 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        destructive:
          "bg-red-500 text-white border-2 border-red-500 hover:bg-red-600 active:bg-red-700",
        outline:
          "border-2 border-black bg-white text-black hover:bg-black hover:text-white active:bg-neutral-800",
        secondary:
          "bg-neutral-100 text-black border-2 border-neutral-200 hover:bg-neutral-200 active:bg-neutral-300",
        ghost: "text-black hover:bg-neutral-100 active:bg-neutral-200",
        link: "text-black underline-offset-4 hover:underline active:opacity-70",

        airy:
          "bg-white/60 text-black border border-black/10 hover:bg-white/80",
        airyPrimary:
          "bg-black text-white border border-black/10 hover:bg-black/90",
        airyOutline:
          "bg-transparent text-black border border-black/20 hover:bg-black/5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
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
