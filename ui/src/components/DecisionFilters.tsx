import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { decisions } from "@/data/decisions";
import { employeeById } from "@/data/employees";
import { projects } from "@/data/projects";
import type { DecisionStatus } from "@/types";

export interface DecisionFilterState {
  query: string;
  status: DecisionStatus | "";
  projectId: string;
  ownerId: string;
  from: string;
  to: string;
}

export const EMPTY_FILTERS: DecisionFilterState = { query: "", status: "", projectId: "", ownerId: "", from: "", to: "" };

const STATUSES: DecisionStatus[] = ["Proposed", "Approved", "Approved with follow-up", "Rejected", "Superseded"];

const ownerIds = [...new Set(decisions.map((d) => d.ownerId))];

export function hasActiveFilters(f: DecisionFilterState): boolean {
  return Object.values(f).some((v) => v !== "");
}

interface Props {
  value: DecisionFilterState;
  onChange: (next: DecisionFilterState) => void;
}

export function DecisionFilters({ value, onChange }: Props) {
  const set = <K extends keyof DecisionFilterState>(key: K, v: DecisionFilterState[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3 border-b border-border px-6 py-4" role="search" aria-label="Filter decisions">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
        <Input
          type="search"
          aria-label="Search decisions"
          placeholder="Search by title, ID, project, owner, or status"
          className="pl-9"
          value={value.query}
          onChange={(e) => set("query", e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect label="Status" value={value.status} onChange={(e) => set("status", e.target.value as DecisionStatus | "")}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect label="Project" value={value.projectId} onChange={(e) => set("projectId", e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} · {p.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect label="Decision owner" value={value.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
          <option value="">All owners</option>
          {ownerIds.map((id) => (
            <option key={id} value={id}>
              {employeeById(id)?.name ?? id}
            </option>
          ))}
        </NativeSelect>
        <fieldset className="flex items-center gap-1.5">
          <legend className="sr-only">Last updated date range</legend>
          <span className="text-xs text-muted" aria-hidden>
            Last updated
          </span>
          <Input type="date" aria-label="Last updated from" className="w-36" value={value.from} max={value.to || undefined} onChange={(e) => set("from", e.target.value)} />
          <span className="text-xs text-muted" aria-hidden>
            to
          </span>
          <Input type="date" aria-label="Last updated to" className="w-36" value={value.to} min={value.from || undefined} onChange={(e) => set("to", e.target.value)} />
        </fieldset>
        {hasActiveFilters(value) ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
            <X aria-hidden className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
