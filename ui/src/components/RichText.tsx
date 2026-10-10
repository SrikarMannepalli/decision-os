import { Fragment } from "react";
import { CitationChip } from "@/components/CitationChip";
import { useUI } from "@/hooks/useUI";
import { tokenizeRichText } from "@/lib/richText";

/** Renders text with clickable [ARTIFACT-ID] citations and DEC-### links. */
export function RichText({ text }: { text: string }) {
  const { navigate } = useUI();
  return (
    <>
      {tokenizeRichText(text).map((token, i) => {
        if (token.kind === "cite") return <CitationChip key={i} artifactId={token.id} />;
        if (token.kind === "decision") {
          return (
            <button
              key={i}
              type="button"
              onClick={() => navigate({ view: "decisions", id: token.id })}
              className="cursor-pointer font-medium text-accent-ink underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
            >
              {token.id}
            </button>
          );
        }
        return <Fragment key={i}>{token.text}</Fragment>;
      })}
    </>
  );
}
