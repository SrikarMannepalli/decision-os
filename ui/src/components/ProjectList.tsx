import { CircleAlert, Loader } from "lucide-react";
import { useEffect, useRef } from "react";
import { CitationChip } from "@/components/CitationChip";
import { DecisionStatusBadge } from "@/components/DecisionStatusBadge";
import { DocumentTypeIcon } from "@/components/DocumentTypeIcon";
import { EmptyState } from "@/components/EmptyState";
import { PersonLink } from "@/components/RecordMeta";
import { decisions } from "@/data/decisions";
import { documents } from "@/data/documents";
import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";

export function ProjectList({ highlightId }: { highlightId?: string }) {
  const { navigate } = useUI();
  const { projects, status, error } = useCatalog();
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (highlightId) refs.current[highlightId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId]);

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-4xl p-6" role="status">
        <EmptyState icon={Loader} title="Loading projects" description="Reading the projects from the corpus." />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-4xl p-6" role="alert">
        <EmptyState icon={CircleAlert} title="Couldn't load projects" description={error ?? "Check that the API is running."} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
      {projects.map((project) => {
        const projectDecisions = decisions.filter((d) => d.projectId === project.id);
        const artifacts = documents.filter((d) => d.projectId === project.id);
        return (
          <section
            key={project.id}
            ref={(el) => {
              refs.current[project.id] = el;
            }}
            aria-labelledby={`${project.id}-title`}
            className={cn(
              "rounded-lg border border-border bg-surface p-5",
              highlightId === project.id && "ring-2 ring-accent/40",
            )}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs text-muted">{project.id}</span>
              <h2 id={`${project.id}-title`} className="text-base font-semibold">
                {project.name}
              </h2>
              <span className="ml-auto text-xs text-muted">
                {projectDecisions.length} {projectDecisions.length === 1 ? "decision" : "decisions"} · {artifacts.length} artifacts
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{project.description}</p>
            <p className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted">Owner</span>
              <PersonLink employeeId={project.ownerId} />
            </p>

            <h3 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Decisions</h3>
            {projectDecisions.length === 0 ? (
              <p className="mt-1 text-sm text-muted">No decisions recorded for this project.</p>
            ) : (
              <ul className="mt-1 divide-y divide-border">
                {projectDecisions.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ view: "decisions", id: d.id })}
                      className="flex w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded px-1 py-2 text-left hover:bg-subtle"
                    >
                      <span className="font-mono text-xs text-muted">{d.id}</span>
                      <span className="text-sm font-medium">{d.title}</span>
                      <DecisionStatusBadge status={d.status} className="ml-auto" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Linked artifacts</h3>
            {artifacts.length === 0 ? (
              <p className="mt-1 text-sm text-muted">No artifacts linked to this project.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {artifacts.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <DocumentTypeIcon type={doc.type} className="h-3.5 w-3.5 text-muted" />
                    <CitationChip artifactId={doc.id} className="mx-0" />
                    <span>{doc.title}</span>
                    <span className="text-xs text-muted">{doc.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
