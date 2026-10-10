import { DecisionStatusBadge } from "@/components/DecisionStatusBadge";
import { DocumentBody } from "@/components/DocumentBody";
import { DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { PersonLink, ProjectLink } from "@/components/RecordMeta";
import { decisionById } from "@/data/decisions";
import { useUI } from "@/hooks/useUI";
import { formatDate } from "@/lib/format";
import type { DocumentDetail } from "@/types";

export function DocumentDetail({ document }: { document: DocumentDetail }) {
  const { navigate } = useUI();
  const decisions = document.decisionIds.flatMap((id) => {
    const d = decisionById(id);
    return d ? [d] : [];
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-border px-6 pb-4 pr-14 pt-5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <DocumentTypeIcon type={document.type} className="h-3.5 w-3.5" />
          <span>{document.type}</span>
          <span aria-hidden>·</span>
          <span className="font-mono">{document.id}</span>
        </div>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{document.title}</h2>
        <p className="mt-1 text-sm text-muted">{document.summary}</p>
      </header>

      <div className="scroll-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Project</dt>
          <dd>
            <ProjectLink projectId={document.projectId} />
          </dd>
          <dt className="text-muted">Created</dt>
          <dd>{formatDate(document.createdAt)}</dd>
          <dt className="text-muted">{document.type === "Zoom transcript" || document.type === "Slack thread" ? "Participants" : "Authors"}</dt>
          <dd className="flex flex-wrap gap-x-4 gap-y-1">
            {document.authorIds.map((id) => (
              <PersonLink key={id} employeeId={id} />
            ))}
          </dd>
        </dl>

        <section aria-labelledby="doc-related-decisions">
          <h3 id="doc-related-decisions" className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Related decisions
          </h3>
          <ul className="space-y-2">
            {decisions.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => navigate({ view: "decisions", id: d.id })}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-left hover:bg-subtle"
                >
                  <span className="min-w-0">
                    <span className="font-mono text-xs text-muted">{d.id}</span>
                    <span className="block truncate text-sm font-medium">{d.title}</span>
                  </span>
                  <DecisionStatusBadge status={d.status} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {document.excerpts && document.excerpts.length > 0 ? (
          <section aria-labelledby="doc-key-excerpts">
            <h3 id="doc-key-excerpts" className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Key excerpts
            </h3>
            <ul className="space-y-3">
              {document.excerpts.map((e) => (
                <li key={e.id} className="rounded-md border border-border bg-background px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">{e.label}</p>
                  <blockquote className="mt-1.5 whitespace-pre-line border-l-2 border-accent/40 pl-3 text-sm text-muted">{e.text}</blockquote>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="doc-full-content">
          <h3 id="doc-full-content" className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Full document
          </h3>
          <div className="rounded-md border border-border bg-surface p-4">
            <DocumentBody content={document.content} />
          </div>
        </section>
      </div>
    </div>
  );
}
