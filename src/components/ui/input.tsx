import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border border-black/10 rounded-xl bg-white px-3 py-2 text-base md:text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 [-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] [-webkit-autofill]:[-webkit-text-fill-color:rgb(10,10,10)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
