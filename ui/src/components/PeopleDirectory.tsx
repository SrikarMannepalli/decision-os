import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CitationChip } from "@/components/CitationChip";
import { EmptyState } from "@/components/EmptyState";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { decisions } from "@/data/decisions";
import { documents } from "@/data/documents";
import { employees } from "@/data/employees";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";
import type { Decision, Employee } from "@/types";

function rolesIn(d: Decision, id: string): string[] {
  const roles: string[] = [];
  if (d.ownerId === id) roles.push("Owner");
  if (d.technicalOwnerId === id) roles.push("Technical owner");
  if (d.approverIds.includes(id)) roles.push("Approver");
  if (d.contributorIds.includes(id)) roles.push("Contributor");
  if (d.followUps.some((f) => f.ownerId === id) && !roles.includes("Technical owner")) roles.push("Follow-up owner");
  return roles;
}

const departments = [...new Set(employees.map((e) => e.department))].sort();

export function PeopleDirectory({ highlightId }: { highlightId?: string }) {
  const { navigate } = useUI();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (highlightId) refs.current[highlightId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter(
      (e: Employee) =>
        (!department || e.department === department) &&
        (!q || [e.name, e.role, e.department].some((v) => v.toLowerCase().includes(q))),
    );
  }, [query, department]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <Input
            aria-label="Search people"
            placeholder="Search by name, role, or department"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <NativeSelect label="Filter by department" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No people match your filters" description="Try a different name, role, or department." />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((person) => {
            const linkedDecisions = decisions
              .map((d) => ({ d, roles: rolesIn(d, person.id) }))
              .filter((x) => x.roles.length > 0);
            const linkedDocs = documents.filter((doc) => doc.authorIds.includes(person.id));
            return (
              <li
                key={person.id}
                ref={(el) => {
                  refs.current[person.id] = el;
                }}
                className={cn("rounded-lg border border-border bg-surface p-4", highlightId === person.id && "ring-2 ring-accent/40")}
              >
                <div className="flex items-center gap-3">
                  <PersonAvatar employeeId={person.id} size="lg" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{person.name}</h2>
                    <p className="text-sm text-muted">
                      {person.role} · {person.department}
                    </p>
                    <p className="text-xs text-muted">{person.email}</p>
                  </div>
                </div>

                {linkedDecisions.length === 0 && linkedDocs.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No linked decisions or documents.</p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Decisions</h3>
                      {linkedDecisions.length === 0 ? (
                        <p className="mt-1 text-sm text-muted">None</p>
                      ) : (
                        <ul className="mt-1 flex flex-col gap-1">
                          {linkedDecisions.map(({ d, roles }) => (
                            <li key={d.id}>
                              <button
                                type="button"
                                onClick={() => navigate({ view: "decisions", id: d.id })}
                                className="cursor-pointer rounded px-1 py-0.5 text-left text-sm hover:bg-subtle"
                              >
                                <span className="font-mono text-xs text-muted">{d.id}</span> {d.title}
                                <span className="block text-xs text-muted">{roles.join(" · ")}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Documents</h3>
                      {linkedDocs.length === 0 ? (
                        <p className="mt-1 text-sm text-muted">None</p>
                      ) : (
                        <p className="mt-1 flex flex-wrap gap-y-1">
                          {linkedDocs.map((doc) => (
                            <CitationChip key={doc.id} artifactId={doc.id} />
                          ))}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
