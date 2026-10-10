import { PersonAvatar, PersonName } from "@/components/PersonAvatar";
import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";

/** Project name that links to the Projects view. */
export function ProjectLink({ projectId }: { projectId: string }) {
  const { navigate } = useUI();
  const project = useCatalog().projectById(projectId);
  return (
    <button
      type="button"
      onClick={() => navigate({ view: "projects", id: projectId })}
      className="cursor-pointer text-left text-foreground underline decoration-border underline-offset-2 hover:decoration-accent"
    >
      <span className="font-mono text-xs text-muted">{projectId}</span> {project?.name ?? projectId}
    </button>
  );
}

/** Person with avatar that links to the People view. */
export function PersonLink({ employeeId }: { employeeId: string }) {
  const { navigate } = useUI();
  return (
    <button
      type="button"
      onClick={() => navigate({ view: "people", id: employeeId })}
      className="inline-flex cursor-pointer items-center gap-1.5 text-left hover:text-accent-ink"
    >
      <PersonAvatar employeeId={employeeId} size="sm" />
      <PersonName employeeId={employeeId} />
    </button>
  );
}
