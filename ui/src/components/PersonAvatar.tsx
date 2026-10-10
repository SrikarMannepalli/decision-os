import { employeeById, initials } from "@/data/employees";
import { cn } from "@/lib/utils";

export function PersonAvatar({ employeeId, size = "md", className }: { employeeId: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const employee = employeeById(employeeId);
  const name = employee?.name ?? employeeId;
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
      {initials(name)}
    </span>
  );
}

export function PersonName({ employeeId }: { employeeId: string }) {
  return <>{employeeById(employeeId)?.name ?? employeeId}</>;
}
