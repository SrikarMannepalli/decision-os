import { ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

/** Styled native <select>: accessible by default, no custom popover to maintain. */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, label, children, ...props }, ref) => (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <select
        ref={ref}
        className="h-9 w-full cursor-pointer appearance-none rounded-md border border-border bg-surface pl-3 pr-8 text-sm text-foreground hover:bg-subtle"
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 h-4 w-4 text-muted" />
    </label>
  ),
);
NativeSelect.displayName = "NativeSelect";
