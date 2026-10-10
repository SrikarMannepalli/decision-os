import { Fragment, type ReactNode } from "react";

const SPEAKER_RE = /^([A-Z][\w.'-]*(?: [A-Z][\w.'-]*){0,2}): (.+)$/;

function withHighlight(text: string, highlight?: string): ReactNode {
  if (!highlight) return text;
  const index = text.indexOf(highlight);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-accent-soft px-0.5 text-foreground">{highlight}</mark>
      {text.slice(index + highlight.length)}
    </>
  );
}

function renderLine(line: string, highlight?: string): ReactNode {
  const speaker = SPEAKER_RE.exec(line);
  if (speaker) {
    return (
      <>
        <span className="font-semibold">{speaker[1]}:</span> {withHighlight(speaker[2], highlight)}
      </>
    );
  }
  return withHighlight(line, highlight);
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "lines"; lines: string[] };

function parse(content: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of content.split(/\n\s*\n/)) {
    let list: string[] = [];
    let lines: string[] = [];
    const flush = () => {
      if (list.length) blocks.push({ kind: "list", items: list });
      if (lines.length) blocks.push({ kind: "lines", lines });
      list = [];
      lines = [];
    };
    for (const raw of chunk.split("\n")) {
      const line = raw.trimEnd();
      if (!line.trim()) continue;
      if (line.startsWith("## ")) {
        flush();
        blocks.push({ kind: "heading", text: line.slice(3) });
      } else if (line.startsWith("- ")) {
        if (lines.length) flush();
        list.push(line.slice(2));
      } else if (line.startsWith("> ")) {
        flush();
        blocks.push({ kind: "quote", text: line.slice(2) });
      } else {
        if (list.length) flush();
        lines.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/**
 * Renders the lightweight markdown used by seeded documents. A highlight that
 * spans several lines is matched per line, so only single-line passages are marked.
 */
export function DocumentBody({ content, highlight }: { content: string; highlight?: string }) {
  const blocks = parse(content);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return (
              <h3 key={i} className="pt-2 text-sm font-semibold tracking-tight first:pt-0">
                {block.text}
              </h3>
            );
          case "list":
            return (
              <ul key={i} className="list-disc space-y-1 pl-5 marker:text-muted">
                {block.items.map((item, j) => (
                  <li key={j}>{withHighlight(item, highlight)}</li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-accent/40 pl-3 text-muted">
                {withHighlight(block.text, highlight)}
              </blockquote>
            );
          default:
            return (
              <p key={i}>
                {block.lines.map((line, j) => (
                  <Fragment key={j}>
                    {j > 0 ? <br /> : null}
                    {renderLine(line, highlight)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
