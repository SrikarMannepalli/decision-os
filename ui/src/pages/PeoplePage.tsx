import { PageHeader } from "@/components/PageHeader";
import { PeopleDirectory } from "@/components/PeopleDirectory";
import { useUI } from "@/hooks/useUI";

export function PeoplePage() {
  const { route } = useUI();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="People" description="FinFlow employees and the decisions and documents they are linked to." />
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <PeopleDirectory highlightId={route.view === "people" ? route.id : undefined} />
      </div>
    </div>
  );
}
