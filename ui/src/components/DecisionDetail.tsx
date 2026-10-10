import type { ReactNode } from "react";
import { CitationChip } from "@/components/CitationChip";
import { DecisionStatusBadge, DispositionBadge } from "@/components/DecisionStatusBadge";
import { DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { RichText } from "@/components/RichText";
import { PersonLink, ProjectLink } from "@/components/RecordMeta";
import { decisionById } from "@/data/decisions";
import { documentById } from "@/data/documents";
import { useUI } from "@/hooks/useUI";
import { formatDate } from "@/lib/format";
import type { Decision } from "@/types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

function DecisionIdList({ ids }: { ids: string[] }) {
  const { navigate } = useUI();
  if (ids.length === 0) return <p className="text-sm text-muted">None</p>;
  return (
    <ul className="space-y-1 text-sm">
      {ids.map((id) => (
        <li key={id}>
          <button type="button" onClick={() => navigate({ view: "decisions", id })} className="cursor-pointer text-accent-ink underline underline-offset-2">
            {id}
          </button>{" "}
          {decisionById(id)?.title}
        </li>
      ))}
    </ul>
  );
}

export function DecisionDetail({ decision }: { decision: Decision }) {
  const { openSource } = useUI();
  const isFinal = decision.finalDecision !== null;
  const docs = decision.artifactIds.map((id) => documentById(id)).filter((d) => d !== undefined);

  const people: { id: string; role: string }[] = [
    { id: decision.ownerId, role: "Decision owner" },
    ...(decision.technicalOwnerId ? [{ id: decision.technicalOwnerId, role: "Technical owner for follow-up" }] : []),
  ];
  const approvers = decision.approverIds;
  const contributors = decision.contributorIds.filter((id) => id !== decision.ownerId && id !== decision.technicalOwnerId && !approvers.includes(id));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="space-y-2 border-b border-border px-6 py-5 pr-14">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">{decision.id}</span>
          <DecisionStatusBadge status={decision.status} />
        </div>
        <h2 className="text-lg font-semibold leading-snug tracking-tight">{decision.title}</h2>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted">Project</dt>
            <dd><ProjectLink projectId={decision.projectId} /></dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Owner</dt>
            <dd><PersonLink employeeId={decision.ownerId} /></dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Decided</dt>
            <dd>{decision.decidedAt ? formatDate(decision.decidedAt) : "Not decided"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Updated</dt>
            <dd>{formatDate(decision.updatedAt)}</dd>
          </div>
        </dl>
      </header>

      <div className="scroll-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <Section title="Problem statement">
          <p className="text-sm leading-relaxed">{decision.problem}</p>
        </Section>

        <Section title={isFinal ? "Final decision" : "Decision status"}>
          {isFinal ? (
            <p className="rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-relaxed">{decision.finalDecision}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">No final decision has been made.</p>
              {decision.leadingProposal ? (
                <div className="rounded-md border border-dashed border-accent/50 bg-accent-soft px-3 py-2.5 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">Leading proposal — not approved</p>
                  <p className="mt-1 leading-relaxed">{decision.leadingProposal}</p>
                </div>
              ) : null}
            </div>
          )}
        </Section>

        {decision.caveats.length > 0 ? (
          <Section title="Caveats">
            <ul className="space-y-2">
              {decision.caveats.map((c, i) => (
                <li key={i} className="rounded-md border border-warn/25 bg-warn-soft px-3 py-2.5 text-sm leading-relaxed text-warn">
                  <RichText text={c} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Rationale">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-muted">
            {decision.rationale.map((r, i) => (
              <li key={i}><RichText text={r} /></li>
            ))}
          </ul>
        </Section>

        <Section title="Alternatives and dispositions">
          <ul className="space-y-2">
            {decision.alternatives.map((a) => (
              <li key={a.title} className="rounded-md border border-border px-3 py-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium">{a.title}</p>
                  <DispositionBadge disposition={a.disposition} />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{a.rationale}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-y-1">
                  {a.artifactIds.map((id) => (
                    <CitationChip key={id} artifactId={id} className="ml-0 mr-1" />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Open questions">
          {decision.openQuestions.length === 0 ? (
            <p className="text-sm text-muted">None recorded.</p>
          ) : (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed marker:text-muted">
              {decision.openQuestions.map((q, i) => (
                <li key={i}><RichText text={q} /></li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Follow-up actions">
          {decision.followUps.length === 0 ? (
            <p className="text-sm text-muted">No follow-up actions recorded.</p>
          ) : (
            <ul className="space-y-2">
              {decision.followUps.map((f) => (
                <li key={f.id} className="rounded-md border border-border px-3 py-2.5 text-sm">
                  <p className="leading-relaxed">{f.description}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">Owner <span className="text-sm text-foreground"><PersonLink employeeId={f.ownerId} /></span></span>
                    <span>{f.dueDate ? `Due ${formatDate(f.dueDate)}` : "No due date"}</span>
                    <span className="rounded bg-subtle px-1.5 py-0.5 font-medium text-foreground">{f.status}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Supporting evidence">
          <ul className="space-y-2">
            {docs.map((doc) => {
              const key = doc.excerpts[0];
              return (
                <li key={doc.id} className="rounded-md border border-border px-3 py-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <DocumentTypeIcon type={doc.type} className="h-4 w-4 text-muted" />
                    <span className="font-medium">{doc.title}</span>
                    <CitationChip artifactId={doc.id} excerptId={key?.id} className="mx-0" />
                  </div>
                  <p className="mt-1 text-muted">{doc.summary}</p>
                  {key ? (
                    <button
                      type="button"
                      onClick={() => openSource({ artifactId: doc.id, excerptId: key.id })}
                      className="mt-1 cursor-pointer text-left text-accent-ink underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
                    >
                      {key.label}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Contributors and approvers">
          <ul className="space-y-1.5 text-sm">
            {people.map((p) => (
              <li key={`${p.role}-${p.id}`} className="flex items-center justify-between gap-3">
                <PersonLink employeeId={p.id} />
                <span className="text-xs text-muted">{p.role}</span>
              </li>
            ))}
            {approvers.length === 0 ? (
              <li className="flex items-center justify-between gap-3 text-muted">
                <span>None — not yet approved</span>
                <span className="text-xs">Approver</span>
              </li>
            ) : (
              approvers.map((id) => (
                <li key={`approver-${id}`} className="flex items-center justify-between gap-3">
                  <PersonLink employeeId={id} />
                  <span className="text-xs text-muted">Approver</span>
                </li>
              ))
            )}
            {contributors.map((id) => (
              <li key={`contributor-${id}`} className="flex items-center justify-between gap-3">
                <PersonLink employeeId={id} />
                <span className="text-xs text-muted">Contributor</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Supersedes">
          <DecisionIdList ids={decision.supersedes} />
        </Section>
        <Section title="Superseded by">
          <DecisionIdList ids={decision.supersededBy} />
        </Section>

        <Section title={`All related artifacts (${docs.length})`}>
          <ul className="divide-y divide-border rounded-md border border-border text-sm">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 px-3 py-2">
                <DocumentTypeIcon type={doc.type} className="h-4 w-4 shrink-0 text-muted" />
                <CitationChip artifactId={doc.id} className="mx-0" />
                <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                <span className="shrink-0 text-xs text-muted">{doc.type} · {formatDate(doc.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
