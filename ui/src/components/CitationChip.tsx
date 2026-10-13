import { documentById } from "@/data/documents";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";

interface CitationChipProps {
  artifactId: string;
  excerptId?: string;
  className?: string;
}

/** Clickable source reference. Renders nothing interactive for IDs that are not in the seeded corpus. */
export function CitationChip({ artifactId, excerptId, className }: CitationChipProps) {
  const { openSource } = useUI();
  const doc = documentById(artifactId);
  if (!doc) return <span className="text-muted">[{artifactId}]</span>;
  return (
    <button
      type="button"
      onClick={() => openSource({ artifactId, excerptId })}
      title={`${doc.title} — open source`}
      className={cn(
        "mx-0.5 inline-flex cursor-pointer items-center rounded border border-accent/25 bg-accent-soft px-1.5 py-px align-baseline font-mono text-[11px] font-medium leading-4 text-accent-ink hover:border-accent hover:bg-accent/10",
        className,
      )}
    >
      {artifactId}
    </button>
  );
}
