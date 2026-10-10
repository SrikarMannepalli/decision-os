import { decisionById } from "@/data/decisions";
import { knownArtifactIds } from "@/data/documents";

export type RichToken =
  | { kind: "text"; text: string }
  | { kind: "cite"; id: string }
  | { kind: "decision"; id: string };

const TOKEN_RE = /\[([A-Z]+-\d{3})\]|\b(DEC-\d{3})\b/g;

/**
 * Splits text into plain text, citation markers ([ZOOM-001]) and decision IDs.
 * Markers that do not resolve to a seeded record stay as plain text, so the UI
 * can never render a clickable citation for a document that does not exist.
 */
export function tokenizeRichText(input: string): RichToken[] {
  const tokens: RichToken[] = [];
  let last = 0;
  for (const match of input.matchAll(TOKEN_RE)) {
    const index = match.index ?? 0;
    const cite = match[1];
    const decision = match[2];
    let token: RichToken | null = null;
    if (cite && knownArtifactIds.has(cite)) token = { kind: "cite", id: cite };
    else if (decision && decisionById(decision)) token = { kind: "decision", id: decision };
    if (!token) continue;
    if (index > last) tokens.push({ kind: "text", text: input.slice(last, index) });
    tokens.push(token);
    last = index + match[0].length;
  }
  if (last < input.length) tokens.push({ kind: "text", text: input.slice(last) });
  return tokens;
}

/** All citation IDs mentioned in a string, in order, de-duplicated. */
export function extractCitations(input: string): string[] {
  const ids = new Set<string>();
  for (const match of input.matchAll(/\[([A-Z]+-\d{3})\]/g)) ids.add(match[1]);
  return [...ids];
}
