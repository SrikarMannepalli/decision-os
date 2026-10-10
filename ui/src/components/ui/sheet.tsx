import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right";
  /** Accessible name for screen readers; callers render their own visible heading */
  title: string;
  description?: string;
}

export const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, SheetContentProps>(
  ({ side = "right", title, description, className, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/25 [animation:dos-fade-in_150ms_ease-out]" />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        className={cn(
          "fixed top-0 z-50 flex h-full w-full flex-col border-border bg-surface shadow-xl focus:outline-none",
          side === "right"
            ? "right-0 max-w-[560px] border-l [animation:dos-slide-in-right_200ms_ease-out]"
            : "left-0 max-w-[300px] border-r [animation:dos-slide-in-left_200ms_ease-out]",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
        ) : null}
        {children}
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
SheetContent.displayName = "SheetContent";
