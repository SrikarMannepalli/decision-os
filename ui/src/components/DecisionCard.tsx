import { CitationChip } from "@/components/CitationChip";
import { DecisionStatusBadge } from "@/components/DecisionStatusBadge";
import { employeeById } from "@/data/employees";
import { projectById } from "@/data/projects";
import { formatDate } from "@/lib/format";
import type { Decision } from "@/types";

export const DECISION_GRID =
  "md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.6fr)] md:items-start md:gap-4";

export function DecisionTableHeader() {
  const cell = "text-xs font-medium uppercase tracking-wide text-muted";
  return (
    <div role="row" className={`hidden border-b border-border px-6 py-2 ${DECISION_GRID}`}>
      <div role="columnheader" className={cell}>Decision</div>
      <div role="columnheader" className={cell}>Owner</div>
      <div role="columnheader" className={cell}>Status</div>
      <div role="columnheader" className={cell}>Decided</div>
      <div role="columnheader" className={cell}>Updated</div>
      <div role="columnheader" className={cell}>Documents</div>
    </div>
  );
}

/** Table row on md+, stacked card below. Title button stretches over the row; chips sit above it. */
export function DecisionCard({ decision, onOpen }: { decision: Decision; onOpen: (id: string) => void }) {
  const project = projectById(decision.projectId);
  const owner = employeeById(decision.ownerId);
  const label = "text-xs text-muted md:hidden";
  return (
    <div
      role="row"
      className={`relative flex flex-col gap-2 border-b border-border px-6 py-3.5 hover:bg-subtle/60 focus-within:bg-subtle/60 ${DECISION_GRID}`}
    >
      <div role="cell" className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">{decision.id}</span>
        </div>
        <button
          type="button"
          onClick={() => onOpen(decision.id)}
          className="cursor-pointer text-left text-sm font-medium text-foreground after:absolute after:inset-0 hover:text-accent-ink"
        >
          {decision.title}
        </button>
        <p className="text-xs text-muted">
          {decision.projectId} · {project?.name}
        </p>
      </div>
      <div role="cell" className="text-sm">
        <span className={label}>Owner: </span>
        {owner?.name ?? decision.ownerId}
      </div>
      <div role="cell">
        <DecisionStatusBadge status={decision.status} />
      </div>
      <div role="cell" className="text-sm">
        <span className={label}>Decided: </span>
        {decision.decidedAt ? formatDate(decision.decidedAt) : <span className="text-muted">Not decided</span>}
      </div>
      <div role="cell" className="text-sm">
        <span className={label}>Updated: </span>
        {formatDate(decision.updatedAt)}
      </div>
      <div role="cell" className="relative z-10 flex flex-wrap gap-y-1">
        {decision.artifactIds.map((id) => (
          <CitationChip key={id} artifactId={id} />
        ))}
      </div>
    </div>
  );
}
