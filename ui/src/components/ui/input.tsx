import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted/80 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
