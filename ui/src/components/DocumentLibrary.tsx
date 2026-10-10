import { FileSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DOCUMENT_TYPES, DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { EmptyState } from "@/components/EmptyState";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { documents } from "@/data/documents";
import { projectById, projects } from "@/data/projects";
import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";
import { formatDate } from "@/lib/format";
import type { Document } from "@/types";

interface Filters {
  query: string;
  projectId: string;
  type: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = { query: "", projectId: "", type: "", from: "", to: "" };

function authorNames(doc: Document, personName: (id: string) => string): string {
  return doc.authorIds.map(personName).join(", ");
}

function matches(doc: Document, f: Filters, personName: (id: string) => string): boolean {
  if (f.projectId && doc.projectId !== f.projectId) return false;
  if (f.type && doc.type !== f.type) return false;
  if (f.from && doc.createdAt < f.from) return false;
  if (f.to && doc.createdAt > f.to) return false;
  const q = f.query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [doc.title, doc.id, doc.type, doc.summary, doc.content, authorNames(doc, personName)].join("\n").toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}

function AuthorStack({ doc }: { doc: Document }) {
  const { personById } = useCatalog();
  const shown = doc.authorIds.slice(0, 4);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex -space-x-1.5">
        {shown.map((id) => (
          <PersonAvatar key={id} employeeId={id} size="sm" className="ring-2 ring-surface" />
        ))}
      </span>
      <span className="truncate text-xs text-muted">
        {personById(doc.authorIds[0])?.name}
        {doc.authorIds.length > 1 ? ` +${doc.authorIds.length - 1}` : ""}
      </span>
    </div>
  );
}

function DecisionLinks({ doc }: { doc: Document }) {
  const { navigate } = useUI();
  return (
    <span className="flex flex-wrap gap-1">
      {doc.decisionIds.map((id) => (
        <button
          key={id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ view: "decisions", id });
          }}
          className="cursor-pointer rounded border border-border bg-surface px-1.5 py-px font-mono text-[11px] text-accent-ink hover:border-accent"
        >
          {id}
        </button>
      ))}
    </span>
  );
}

export function DocumentLibrary() {
  const { navigate } = useUI();
  const { personName } = useCatalog();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const set = (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch }));

  const results = useMemo(
    () => documents.filter((d) => matches(d, filters, personName)).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)),
    [filters, personName],
  );
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  const open = (id: string) => navigate({ view: "documents", id });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-border px-6 py-4">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            aria-label="Search documents"
            placeholder="Search by title, ID, content, or person…"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect label="Filter by project" value={filters.projectId} onChange={(e) => set({ projectId: e.target.value })}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect label="Filter by document type" value={filters.type} onChange={(e) => set({ type: e.target.value })}>
            <option value="">All types</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            From
            <Input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value })} className="w-36" />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            To
            <Input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value })} className="w-36" />
          </label>
          {filtered ? (
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </Button>
          ) : null}
          <span className="ml-auto text-xs text-muted" aria-live="polite">
            {results.length} of {documents.length} documents
          </span>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No documents match these filters"
            description="Try a different search term, widen the date range, or clear the filters to see all seeded documents."
            action={
              <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div role="table" aria-label="Documents" className="hidden md:block">
              <div role="row" className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.4fr)_100px_110px] gap-4 border-b border-border px-6 py-2 text-xs font-medium uppercase tracking-wide text-muted">
                <span role="columnheader">Document</span>
                <span role="columnheader">Project</span>
                <span role="columnheader">Authors</span>
                <span role="columnheader">Created</span>
                <span role="columnheader">Decisions</span>
              </div>
              {results.map((doc) => (
                <div
                  key={doc.id}
                  role="row"
                  tabIndex={0}
                  onClick={() => open(doc.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open(doc.id);
                    }
                  }}
                  className="grid cursor-pointer grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.4fr)_100px_110px] items-center gap-4 border-b border-border px-6 py-3 hover:bg-subtle"
                >
                  <div role="cell" className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <DocumentTypeIcon type={doc.type} className="h-3.5 w-3.5" />
                      <span>{doc.type}</span>
                      <span aria-hidden>·</span>
                      <span className="font-mono">{doc.id}</span>
                    </div>
                    <div className="truncate text-sm font-medium">{doc.title}</div>
                  </div>
                  <div role="cell" className="min-w-0 truncate text-sm text-muted">
                    {projectById(doc.projectId)?.name ?? doc.projectId}
                  </div>
                  <div role="cell" className="min-w-0">
                    <AuthorStack doc={doc} />
                  </div>
                  <div role="cell" className="text-sm text-muted">
                    {formatDate(doc.createdAt)}
                  </div>
                  <div role="cell">
                    <DecisionLinks doc={doc} />
                  </div>
                </div>
              ))}
            </div>

            <ul className="divide-y divide-border md:hidden">
              {results.map((doc) => (
                <li key={doc.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => open(doc.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        open(doc.id);
                      }
                    }}
                    className="block cursor-pointer space-y-1.5 px-4 py-3 hover:bg-subtle"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <DocumentTypeIcon type={doc.type} className="h-3.5 w-3.5" />
                      <span>{doc.type}</span>
                      <span aria-hidden>·</span>
                      <span className="font-mono">{doc.id}</span>
                    </div>
                    <div className="text-sm font-medium">{doc.title}</div>
                    <div className="text-xs text-muted">
                      {projectById(doc.projectId)?.name} · {formatDate(doc.createdAt)}
                    </div>
                    <AuthorStack doc={doc} />
                    <DecisionLinks doc={doc} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
