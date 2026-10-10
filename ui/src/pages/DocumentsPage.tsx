import { DocumentDetail } from "@/components/DocumentDetail";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { PageHeader } from "@/components/PageHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { documentById } from "@/data/documents";
import { useUI } from "@/hooks/useUI";

export function DocumentsPage() {
  const { route, navigate } = useUI();
  const selected = route.id ? documentById(route.id) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Documents"
        description="Meeting transcripts, Slack threads, PRDs, ADRs, design docs, and engineering updates that back FinFlow's decisions."
      />
      <DocumentLibrary />
      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && navigate({ view: "documents" })}>
        {selected ? (
          <SheetContent title={`${selected.id}: ${selected.title}`} className="max-w-[680px]">
            <DocumentDetail document={selected} />
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}
