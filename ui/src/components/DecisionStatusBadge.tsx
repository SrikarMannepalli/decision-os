import { CheckCircle2, CircleDashed, CircleSlash, History, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlternativeDisposition, DecisionStatus } from "@/types";

const STATUS_STYLE: Record<DecisionStatus, { className: string; icon: typeof CheckCircle2 }> = {
  Approved: { className: "bg-ok-soft text-ok", icon: CheckCircle2 },
  "Approved with follow-up": { className: "bg-warn-soft text-warn", icon: ListChecks },
  Proposed: { className: "border border-dashed border-accent/50 bg-accent-soft text-accent-ink", icon: CircleDashed },
  Rejected: { className: "bg-bad-soft text-bad", icon: CircleSlash },
  Superseded: { className: "bg-neutral-soft text-muted", icon: History },
};

export function DecisionStatusBadge({ status, className }: { status: DecisionStatus; className?: string }) {
  const { className: tone, icon: Icon } = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium", tone, className)}>
      <Icon aria-hidden className="h-3 w-3" />
      {status}
    </span>
  );
}

const DISPOSITION_STYLE: Record<AlternativeDisposition, string> = {
  Selected: "bg-ok-soft text-ok",
  Rejected: "bg-bad-soft text-bad",
  Deferred: "bg-neutral-soft text-muted",
  Proposed: "border border-dashed border-accent/50 bg-accent-soft text-accent-ink",
  "Under consideration": "bg-neutral-soft text-foreground",
};

export function DispositionBadge({ disposition, className }: { disposition: AlternativeDisposition; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium", DISPOSITION_STYLE[disposition], className)}>
      {disposition}
    </span>
  );
}
