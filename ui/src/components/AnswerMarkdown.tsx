import { Children, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import { RichText } from "@/components/RichText";

/** Text nodes go through RichText so citations and decision IDs stay clickable; elements pass through. */
function linkify(children: ReactNode): ReactNode {
  return Children.map(children, (child) => (typeof child === "string" ? <RichText text={child} /> : child));
}

const heading: Components["h3"] = ({ children }) => (
  <h3 className="pt-1 text-base font-semibold tracking-tight first:pt-0">{linkify(children)}</h3>
);

const components: Components = {
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  p: ({ children }) => <p>{linkify(children)}</p>,
  strong: ({ children }) => <strong className="font-semibold">{linkify(children)}</strong>,
  em: ({ children }) => <em>{linkify(children)}</em>,
  li: ({ children }) => <li>{linkify(children)}</li>,
  ul: ({ children }) => <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1.5 pl-5 marker:text-muted">{children}</ol>,
  code: ({ children }) => <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.85em]">{children}</code>,
};

/** Renders a model answer's markdown. Raw HTML in the answer is not rendered. */
export function AnswerMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      <Markdown components={components}>{text}</Markdown>
    </div>
  );
}
