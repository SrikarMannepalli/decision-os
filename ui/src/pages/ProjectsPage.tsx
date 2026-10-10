import { PageHeader } from "@/components/PageHeader";
import { ProjectList } from "@/components/ProjectList";
import { useUI } from "@/hooks/useUI";

export function ProjectsPage() {
  const { route } = useUI();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Projects" description="The initiatives FinFlow decisions belong to, with their decisions and source artifacts." />
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <ProjectList highlightId={route.view === "projects" ? route.id : undefined} />
      </div>
    </div>
  );
}
