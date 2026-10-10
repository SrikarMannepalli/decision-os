import { SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { DecisionCard, DecisionTableHeader } from "@/components/DecisionCard";
import { DecisionDetail } from "@/components/DecisionDetail";
import { DecisionFilters, EMPTY_FILTERS, type DecisionFilterState } from "@/components/DecisionFilters";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { decisionById, decisions } from "@/data/decisions";
import { projectById } from "@/data/projects";
import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";
import type { Decision } from "@/types";

function matches(d: Decision, f: DecisionFilterState, personName: (id: string) => string): boolean {
  if (f.status && d.status !== f.status) return false;
  if (f.projectId && d.projectId !== f.projectId) return false;
  if (f.ownerId && d.ownerId !== f.ownerId) return false;
  if (f.from && d.updatedAt < f.from) return false;
  if (f.to && d.updatedAt > f.to) return false;
  const q = f.query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [d.title, d.id, d.projectId, projectById(d.projectId)?.name, personName(d.ownerId), d.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function DecisionLogPage() {
  const { route, navigate } = useUI();
  const { personName } = useCatalog();
  const [filters, setFilters] = useState<DecisionFilterState>(EMPTY_FILTERS);

  const visible = useMemo(() => decisions.filter((d) => matches(d, filters, personName)), [filters, personName]);
  const selected = route.id ? decisionById(route.id) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Decision Log"
        description="Every recorded decision with its status, owner, and the evidence behind it."
      />
      <DecisionFilters value={filters} onChange={setFilters} />
      <div className="flex items-center justify-between px-6 py-2 text-xs text-muted" aria-live="polite">
        <span>
          {visible.length} of {decisions.length} decisions
        </span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No decisions match these filters"
            description="Try a different search term, or clear the filters to see every decision."
            action={
              <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div role="table" aria-label="Decisions">
            <div role="rowgroup">
              <DecisionTableHeader />
            </div>
            <div role="rowgroup">
              {visible.map((d) => (
                <DecisionCard key={d.id} decision={d} onOpen={(id) => navigate({ view: "decisions", id })} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && navigate({ view: "decisions" })}>
        {selected ? (
          <SheetContent title={`${selected.id}: ${selected.title}`} className="max-w-[640px]">
            <DecisionDetail decision={selected} />
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
