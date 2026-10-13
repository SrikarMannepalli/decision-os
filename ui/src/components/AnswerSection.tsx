import { CalendarClock } from "lucide-react";
import { CitationChip } from "@/components/CitationChip";
import { DispositionBadge } from "@/components/DecisionStatusBadge";
import { PersonAvatar, PersonName } from "@/components/PersonAvatar";
import { RichText } from "@/components/RichText";
import { formatDate } from "@/lib/format";
import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";
import type { AnswerSection as AnswerSectionData } from "@/types";

export function AnswerSection({ section }: { section: AnswerSectionData }) {
  const { navigate } = useUI();
  const { personById } = useCatalog();
  return (
    <section aria-labelledby={`sec-${section.kind}-${section.title}`} className="mt-5">
      <h3 id={`sec-${section.kind}-${section.title}`} className="mb-1.5 text-[13px] font-semibold text-foreground">
        {section.title}
      </h3>

      {section.paragraphs?.map((p, i) => (
        <p key={i} className="mb-2 text-sm leading-relaxed text-foreground/90">
          <RichText text={p} />
        </p>
      ))}

      {section.bullets ? (
        <ul className="mb-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90 marker:text-muted">
          {section.bullets.map((b, i) => (
            <li key={i}>
              <RichText text={b} />
            </li>
          ))}
        </ul>
      ) : null}

      {section.alternatives ? (
        <ul className="mb-2 divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
          {section.alternatives.map((a) => (
            <li key={a.title} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3">
              <DispositionBadge disposition={a.disposition} className="self-start sm:mt-0.5 sm:w-[132px] sm:justify-center" />
              <div className="min-w-0 text-sm">
                <p className="font-medium">{a.title}</p>
                <p className="text-muted">{a.rationale}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {section.people ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {section.people.map((p) => {
            const employee = personById(p.employeeId);
            return (
              <li key={p.employeeId}>
                <button
                  type="button"
                  onClick={() => navigate({ view: "people", id: p.employeeId })}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2 text-left hover:bg-subtle"
                >
                  <PersonAvatar employeeId={p.employeeId} />
                  <span className="min-w-0 text-sm">
                    <span className="block truncate font-medium">
                      <PersonName employeeId={p.employeeId} />
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {p.role}
                      {employee ? ` · ${employee.role}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {section.actions && section.actions.length > 0 ? (
        <ul className="mb-2 space-y-2">
          {section.actions.map((a) => (
            <li key={a.description} className="flex items-start gap-2.5 rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <PersonAvatar employeeId={a.ownerId} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p>{a.description}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  <span>
                    Owner: <PersonName employeeId={a.ownerId} />
                  </span>
                  {a.dueDate ? (
                    <span className="inline-flex items-center gap-1 font-medium text-warn">
                      <CalendarClock aria-hidden className="h-3 w-3" />
                      Due {formatDate(a.dueDate)}
                    </span>
                  ) : (
                    <span>No due date recorded</span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {section.evidence ? (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
          {section.evidence.map((e) => (
            <li key={`${e.artifactId}-${e.excerptId}`} className="flex items-start gap-2 px-3 py-2 text-sm">
              <CitationChip artifactId={e.artifactId} excerptId={e.excerptId} className="mt-0.5 shrink-0" />
              <span className="text-foreground/90">{e.claim}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
