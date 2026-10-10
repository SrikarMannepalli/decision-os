import { useEffect, useState } from "react";
import { DocumentDetail } from "@/components/DocumentDetail";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";
import { CircleAlert, Loader } from "lucide-react";
import type { DocumentDetail as DocumentDetailType } from "@/types";

type DetailState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; document: DocumentDetailType };

/** Fetches the document's detail (content, bodyStartLine) when the drawer opens. */
function DocumentDetailPanel({ id, onMissing }: { id: string; onMissing: () => void }) {
  const { loadDocument, documentById } = useCatalog();
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    loadDocument(id, controller.signal)
      .then((document) => {
        if (controller.signal.aborted) return;
        if (!document) {
          onMissing();
          return;
        }
        setState({ status: "ready", document });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : "Could not load this document." });
      });
    return () => controller.abort();
  }, [id, loadDocument, onMissing]);

  if (state.status === "loading") {
    return (
      <div className="p-6" role="status">
        <EmptyState icon={Loader} title="Loading document" description="Reading the document from the corpus." />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="p-6" role="alert">
        <EmptyState icon={CircleAlert} title="Couldn't load this document" description={state.message} />
      </div>
    );
  }
  const title = state.document.title || documentById(id)?.title || id;
  return (
    <SheetContent title={`${state.document.id}: ${title}`} className="max-w-[680px]">
      <DocumentDetail document={state.document} />
    </SheetContent>
  );
}

export function DocumentsPage() {
  const { route, navigate } = useUI();
  const selectedId = route.id ?? undefined;
  const close = () => navigate({ view: "documents" });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Documents"
        description="Meeting transcripts, Slack threads, PRDs, ADRs, design docs, and engineering updates that back FinFlow's decisions."
      />
      <DocumentLibrary />
      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && close()}>
        {selectedId ? <DocumentDetailPanel id={selectedId} onMissing={close} /> : null}
      </Sheet>
    </div>
  );
}
