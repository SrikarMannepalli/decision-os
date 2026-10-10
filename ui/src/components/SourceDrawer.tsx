import { ExternalLink } from "lucide-react";
import { DecisionStatusBadge } from "@/components/DecisionStatusBadge";
import { DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { PersonLink, ProjectLink } from "@/components/RecordMeta";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { documentById } from "@/data/documents";
import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Source-detail drawer opened from any citation chip. */
export function SourceDrawer() {
  const { source, closeSource, navigate } = useUI();
  const { decisionById } = useCatalog();
  const doc = source ? documentById(source.artifactId) : undefined;
  const cited = doc?.excerpts.find((e) => e.id === source?.excerptId) ?? doc?.excerpts[0];
  const others = doc?.excerpts.filter((e) => e.id !== cited?.id) ?? [];

  return (
    <Sheet open={Boolean(doc)} onOpenChange={(open) => !open && closeSource()}>
      {doc ? (
        <SheetContent title={`Source ${doc.id}: ${doc.title}`} description="Source document excerpt and metadata">
          <div className="border-b border-border px-5 pb-4 pt-5 pr-14">
            <p className="flex items-center gap-2 text-xs text-muted">
              <DocumentTypeIcon type={doc.type} className="h-3.5 w-3.5" />
              <span>{doc.type}</span>
              <span aria-hidden>·</span>
              <span className="font-mono font-medium text-accent-ink">{doc.id}</span>
            </p>
            <h2 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight">{doc.title}</h2>
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted">Artifact ID</dt>
              <dd className="font-mono">{doc.id}</dd>
              <dt className="text-muted">Type</dt>
              <dd>{doc.type}</dd>
              <dt className="text-muted">Created</dt>
              <dd>{formatDate(doc.createdAt)}</dd>
              <dt className="text-muted">Project</dt>
              <dd>
                <ProjectLink projectId={doc.projectId} />
              </dd>
              <dt className="text-muted">{doc.type === "Zoom transcript" || doc.type === "Slack thread" ? "Participants" : "Authors"}</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1">
                {doc.authorIds.map((id) => (
                  <PersonLink key={id} employeeId={id} />
                ))}
              </dd>
              <dt className="text-muted">Decisions</dt>
              <dd className="flex flex-col gap-1.5">
                {doc.decisionIds.map((id) => {
                  const d = decisionById(id);
                  return d ? (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigate({ view: "decisions", id })}
                      className="flex cursor-pointer flex-wrap items-center gap-2 text-left hover:text-accent-ink"
                    >
                      <span className="font-mono text-xs font-medium">{id}</span>
                      <span className="underline decoration-border underline-offset-2">{d.title}</span>
                      <DecisionStatusBadge status={d.status} />
                    </button>
                  ) : null;
                })}
              </dd>
            </dl>

            {cited ? (
              <section className="mt-5" aria-labelledby="cited-excerpt">
                <h3 id="cited-excerpt" className="mb-1.5 text-[13px] font-semibold">
                  Cited excerpt
                </h3>
                <p className="mb-2 text-sm text-muted">{cited.label}</p>
                <blockquote className="whitespace-pre-wrap rounded-md border-l-2 border-accent bg-accent-soft/60 px-4 py-3 text-sm leading-relaxed text-foreground">
                  {cited.text}
                </blockquote>
              </section>
            ) : null}

            {others.length > 0 ? (
              <section className="mt-5" aria-labelledby="other-excerpts">
                <h3 id="other-excerpts" className="mb-1.5 text-[13px] font-semibold">
                  Other excerpts from this document
                </h3>
                <ul className="space-y-2">
                  {others.map((e) => (
                    <li key={e.id} className={cn("rounded-md border border-border bg-subtle/50 px-3 py-2 text-sm")}>
                      <p className="text-xs text-muted">{e.label}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-relaxed">{e.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
            <p className="text-xs text-muted">Seeded FinFlow document</p>
            <Button onClick={() => navigate({ view: "documents", id: doc.id })}>
              <ExternalLink aria-hidden className="h-4 w-4" />
              Open full document
            </Button>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
