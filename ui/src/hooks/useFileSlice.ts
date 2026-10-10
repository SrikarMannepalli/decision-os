import { useCallback, useEffect, useState } from "react";
import { decisionOS } from "@/services/decisionOSService";
import type { FileSlice } from "@/services/corpusFiles";
import type { CorpusCitation } from "@/types";

export type FileSliceState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; slice: FileSlice };

/** Loads the cited lines of a corpus file (plus context) from the backend. */
export function useFileSlice(citation: CorpusCitation | null): { state: FileSliceState; retry: () => void } {
  const [state, setState] = useState<FileSliceState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const path = citation?.path;
  const first = citation?.lines[0];
  const last = citation?.lines[1];

  useEffect(() => {
    if (path === undefined || first === undefined || last === undefined) return;
    if (!decisionOS.fetchSource) {
      setState({ status: "error", message: "Cited lines can only be shown when connected to the DecisionOS backend." });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    decisionOS
      .fetchSource({ path, lines: [first, last] }, controller.signal)
      .then((slice) => setState({ status: "ready", slice }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: err instanceof Error ? err.message : "Could not load this source." });
      });
    return () => controller.abort();
  }, [path, first, last, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
