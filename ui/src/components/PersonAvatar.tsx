import { useCatalog } from "@/hooks/useCatalog";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PersonAvatar({ employeeId, size = "md", className }: { employeeId: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const { personName } = useCatalog();
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-subtle font-medium text-foreground ring-1 ring-border",
        size === "sm" && "h-5 w-5 text-[9px]",
        size === "md" && "h-7 w-7 text-[11px]",
        size === "lg" && "h-10 w-10 text-sm",
        className,
      )}
    >
      {initials(personName(employeeId))}
    </span>
  );
}

export function PersonName({ employeeId }: { employeeId: string }) {
  return <>{useCatalog().personName(employeeId)}</>;
}
