import { AlertTriangle, ExternalLink, RotateCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useFileSlice } from "@/hooks/useFileSlice";
import { useUI } from "@/hooks/useUI";
import { formatLines } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CorpusCitation } from "@/types";

/** Drawer showing the exact lines a live answer cited, with a few lines of context. */
export function CorpusSourceView() {
  const { corpusSource, closeSource } = useUI();
  return (
    <Sheet open={Boolean(corpusSource)} onOpenChange={(open) => !open && closeSource()}>
      {corpusSource ? (
        <SheetContent title={`Source ${corpusSource.path}`} description="Cited lines from a corpus file">
          <CorpusSourceBody citation={corpusSource} />
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function CorpusSourceBody({ citation }: { citation: CorpusCitation }) {
  const { state, retry } = useFileSlice(citation);
  const { navigate } = useUI();
  const [first, last] = citation.lines;
  const firstCited = useRef<HTMLLIElement | null>(null);
  const documentId = state.status === "ready" && state.slice.entity?.kind === "document" ? state.slice.entity.id : undefined;

  useEffect(() => {
    if (state.status === "ready") firstCited.current?.scrollIntoView?.({ block: "center" });
  }, [state.status]);

  return (
    <>
      <div className="border-b border-border px-5 pb-4 pt-5 pr-14">
        <p className="text-xs text-muted">Cited source · {formatLines(citation.lines)}</p>
        <h2 className="mt-1.5 break-all font-mono text-sm font-semibold leading-snug">{citation.path}</h2>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {state.status === "loading" ? (
          <p role="status" aria-live="polite" className="text-sm text-muted">
            Loading cited lines…
          </p>
        ) : null}

        {state.status === "error" ? (
          <div role="alert" className="rounded-md border border-bad/25 bg-bad-soft px-4 py-3 text-sm text-bad">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle aria-hidden className="h-4 w-4" />
              Couldn't load this source
            </p>
            <p className="mt-1 text-bad/90">{state.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
              <RotateCw aria-hidden className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        ) : null}

        {state.status === "ready" ? (
          state.slice.lines.length === 0 ? (
            <p className="text-sm text-muted">This file is empty.</p>
          ) : (
            <ol aria-label={`Lines of ${citation.path}`} className="overflow-x-auto rounded-md border border-border bg-surface font-mono text-xs leading-relaxed">
              {state.slice.lines.map((line) => {
                const cited = line.n >= first && line.n <= last;
                return (
                  <li
                    key={line.n}
                    ref={cited && line.n === Math.max(first, state.slice.start) ? firstCited : undefined}
                    data-cited={cited ? "true" : undefined}
                    className={cn("flex gap-3 px-3 py-0.5", cited ? "border-l-2 border-accent bg-accent-soft/70" : "border-l-2 border-transparent text-muted")}
                  >
                    <span aria-hidden className="w-9 shrink-0 select-none text-right text-muted">
                      {line.n}
                    </span>
                    <span className="sr-only">{`Line ${line.n}${cited ? ", cited" : ""}: `}</span>
                    <span className="whitespace-pre-wrap break-words">{line.text || " "}</span>
                  </li>
                );
              })}
            </ol>
          )
        ) : null}
      </div>

      {state.status === "ready" ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <p className="text-xs text-muted">
            Showing lines {state.slice.start}–{state.slice.end} of {state.slice.totalLines}
          </p>
          {documentId ? (
            <Button size="sm" onClick={() => navigate({ view: "documents", id: documentId })}>
              <ExternalLink aria-hidden className="h-4 w-4" />
              Open document {documentId}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
