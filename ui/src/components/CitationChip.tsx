import { useCatalog } from "@/hooks/useCatalog";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";

interface CitationChipProps {
  artifactId: string;
  className?: string;
}

/** Clickable source reference. Renders plain text for IDs that are not in the catalog. */
export function CitationChip({ artifactId, className }: CitationChipProps) {
  const { navigate } = useUI();
  const { documentById } = useCatalog();
  const doc = documentById(artifactId);
  if (!doc) return <span className="text-muted">[{artifactId}]</span>;
  return (
    <button
      type="button"
      onClick={() => navigate({ view: "documents", id: artifactId })}
      title={`${doc.title} — open document`}
      className={cn(
        "mx-0.5 inline-flex cursor-pointer items-center rounded border border-accent/25 bg-accent-soft px-1.5 py-px align-baseline font-mono text-[11px] font-medium leading-4 text-accent-ink hover:border-accent hover:bg-accent/10",
        className,
      )}
    >
      {artifactId}
    </button>
  );
}
