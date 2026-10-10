import { CalendarClock, PanelRightClose } from "lucide-react";
import { CorpusSources } from "@/components/ChatMessage";
import { DecisionStatusBadge } from "@/components/DecisionStatusBadge";
import { DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { PersonLink, ProjectLink } from "@/components/RecordMeta";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/useCatalog";
import { useChat } from "@/hooks/useChat";
import { useUI } from "@/hooks/useUI";
import { relatedEntitiesFromCitations } from "@/lib/relatedEntities";
import { formatDate } from "@/lib/format";
import type { AssistantAnswer, Decision } from "@/types";

function latestAnswer(messages: { answer?: AssistantAnswer }[] | undefined): AssistantAnswer | null {
  if (!messages) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const a = messages[i].answer;
    if (a && a.sources.length > 0) return a;
  }
  return null;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-4 py-4 last:border-b-0">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

/** Context for the most recent answer: decisions, sources, people, project, follow-ups. */
export function ContextPanelBody() {
  const { active } = useChat();
  const { navigate } = useUI();
  const { personById, personName, decisionById, documentById } = useCatalog();
  const answer = latestAnswer(active?.messages);

  if (!answer) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted">
        <p className="font-medium text-foreground">No context yet</p>
        <p className="mt-1">Related decisions, sources, people, and follow-ups appear here once you ask a question.</p>
      </div>
    );
  }

  // Answers cite corpus paths: derive the entities behind them via `entity`
  // (the same ids the file endpoint reports), then the people and projects those connect to.
  const cited = relatedEntitiesFromCitations(answer.sources, { decisionById, documentById });

  const decisionsById = new Map<string, Decision>();
  for (const d of cited.decisions) {
    decisionsById.set(d.id, d);
  }
  const decisions = [...decisionsById.values()];
  const projectIds = [...new Set([...decisions.map((d) => d.projectId), ...cited.projectIds])];
  const followUps = decisions.flatMap((d) => d.followUps.filter((f) => f.status === "Open").map((f) => ({ ...f, decisionId: d.id })));
  const citedDocs = cited.documents;
  const personIds = [...new Set(cited.personIds)];

  if (decisions.length === 0 && citedDocs.length === 0 && personIds.length === 0) {
    return (
      <Group title="Cited sources">
        <CorpusSources sources={answer.sources} heading={false} />
      </Group>
    );
  }

  return (
    <>
      <Group title={decisions.length > 1 ? "Related decisions" : "Decision"}>
        <ul className="space-y-2">
          {decisions.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => navigate({ view: "decisions", id: d.id })}
                className="w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-left hover:bg-subtle"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{d.id}</span>
                  <DecisionStatusBadge status={d.status} />
                </span>
                <span className="mt-1 block text-sm font-medium leading-snug">{d.title}</span>
                <span className="mt-0.5 block text-xs text-muted">Owner: {personName(d.ownerId)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group title={projectIds.length > 1 ? "Projects" : "Project"}>
        <ul className="space-y-1 text-sm">
          {projectIds.map((id) => (
            <li key={id}>
              <ProjectLink projectId={id} />
            </li>
          ))}
        </ul>
      </Group>

      {citedDocs.length > 0 ? (
        <Group title="Cited documents">
          <ul className="space-y-2">
            {citedDocs.map((doc) => (
              <li key={doc.id} className="flex items-start gap-2 text-sm">
                <DocumentTypeIcon type={doc.type} className="mt-1 h-3.5 w-3.5 shrink-0 text-muted" />
                <span className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate({ view: "documents", id: doc.id })}
                    className="cursor-pointer text-left leading-snug hover:text-accent-ink"
                  >
                    {doc.title}
                  </button>
                  <span className="mt-0.5 block text-xs text-muted">{doc.type}</span>
                </span>
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      {personIds.length > 0 ? (
        <Group title="People involved">
          <ul className="space-y-1.5 text-sm">
            {personIds.map((id) => (
              <li key={id} className="flex items-center gap-2">
                <PersonLink employeeId={id} />
                <span className="truncate text-xs text-muted">{personById(id)?.role}</span>
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      <Group title="Outstanding follow-ups">
        {followUps.length === 0 ? (
          <p className="text-sm text-muted">No open follow-up actions are recorded for these decisions.</p>
        ) : (
          <ul className="space-y-2">
            {followUps.map((f) => (
              <li key={f.id} className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                <p className="leading-snug">{f.description}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  <span>{personName(f.ownerId)}</span>
                  <span className="font-mono">{f.decisionId}</span>
                  {f.dueDate ? (
                    <span className="inline-flex items-center gap-1 font-medium text-warn">
                      <CalendarClock aria-hidden className="h-3 w-3" />
                      {formatDate(f.dueDate)}
                    </span>
                  ) : (
                    <span>No due date</span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Group>
    </>
  );
}

export function ContextPanel() {
  const { toggleContext } = useUI();
  return (
    <aside aria-label="Context and evidence" className="hidden h-full w-[320px] shrink-0 flex-col border-l border-border bg-background lg:flex">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold">Context &amp; evidence</h2>
        <Button variant="ghost" size="icon" onClick={toggleContext} aria-label="Collapse context panel">
          <PanelRightClose aria-hidden className="h-4 w-4" />
        </Button>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <ContextPanelBody />
      </div>
    </aside>
  );
}
