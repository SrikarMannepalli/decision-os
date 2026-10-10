import type { CorpusCitation } from "@/types";
import { BackendError, failure, type ApiClient } from "./apiClient";

export interface FileLine {
  n: number;
  text: string;
}

/** Response of GET /files/{path}: 1-based inclusive line numbers over the raw file. */
export interface FileSlice {
  path: string;
  start: number;
  end: number;
  totalLines: number;
  lines: FileLine[];
  entity: { kind: string; id: string } | null;
}

/** Lines of context shown on each side of a cited range. */
export const CONTEXT_LINES = 3;

/** The backend refuses windows over this many lines. */
export const MAX_WINDOW = 500;

/** The range to request for a citation: the cited lines plus a few lines of context. */
export function sourceWindow([first, last]: [number, number], context = CONTEXT_LINES): [number, number] {
  const start = Math.max(1, first - context);
  return [start, Math.min(last + context, start + MAX_WINDOW - 1)];
}

const encodePath = (path: string): string => path.split("/").map(encodeURIComponent).join("/");

export async function fetchFileSlice(api: ApiClient, citation: CorpusCitation, signal?: AbortSignal): Promise<FileSlice> {
  const [start, end] = sourceWindow(citation.lines);
  const res = await api.get(`/files/${encodePath(citation.path)}?start=${start}&end=${end}`, signal);
  if (res.status === 404) throw new BackendError("This file is no longer in the corpus.");
  if (res.status === 422) throw new BackendError("The cited lines can't be shown from this file.");
  if (!res.ok) throw failure(res.status, "load that source");
  return (await res.json()) as FileSlice;
}
