import { AlertTriangle, Check, Copy, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/RichText";
import { Button } from "@/components/ui/button";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";
import { formatLines } from "@/lib/format";
import type { ChatMessage as ChatMessageData, CorpusCitation } from "@/types";

interface ChatMessageProps {
  message: ChatMessageData;
  isLast: boolean;
  onRetry: () => void;
  disabled: boolean;
}

export function ChatMessage({ message, isLast, onRetry, disabled }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-subtle px-4 py-2.5 text-[15px] leading-relaxed">{message.content}</p>
      </div>
    );
  }
  if (message.error) return <ErrorMessage message={message} onRetry={onRetry} disabled={disabled || !isLast} />;
  return <AssistantMessage message={message} />;
}

function AssistantAvatar() {
  return (
    <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-white">
      <Check className="h-4 w-4" strokeWidth={3} />
    </span>
  );
}

function ErrorMessage({ message, onRetry, disabled }: { message: ChatMessageData; onRetry: () => void; disabled: boolean }) {
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div role="alert" className="min-w-0 flex-1 rounded-md border border-bad/25 bg-bad-soft px-4 py-3 text-sm text-bad">
        <p className="flex items-center gap-2 font-medium">
          <AlertTriangle aria-hidden className="h-4 w-4" />
          Couldn't get an answer
        </p>
        <p className="mt-1 text-bad/90">{message.content}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry} disabled={disabled}>
          <RotateCw aria-hidden className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessageData }) {
  const answer = message.answer;
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!answer) return null;
  const insufficient = answer.confidence === "insufficient";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="flex gap-3" aria-label="Decision OS answer">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[15px] leading-relaxed",
            insufficient && "rounded-md border border-border bg-subtle/70 px-3.5 py-3",
            answer.confidence === "unresolved" && "border-l-2 border-accent/60 pl-3",
          )}
        >
          {insufficient ? (
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              <AlertTriangle aria-hidden className="h-3.5 w-3.5" /> Not enough evidence
            </p>
          ) : null}
          <p className="whitespace-pre-line">
            <RichText text={answer.directAnswer} />
          </p>
        </div>

        {answer.sources.length > 0 ? <CorpusSources sources={answer.sources} /> : null}

        <div className="mt-4 flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy answer">
            {copied ? <Check aria-hidden className="h-3.5 w-3.5 text-ok" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy answer"}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function CorpusSources({ sources, heading = true }: { sources: CorpusCitation[]; heading?: boolean }) {
  const { openCorpusSource } = useUI();
  return (
    <section className="mt-3" aria-label="Cited sources">
      {heading ? <h3 className="mb-1.5 text-[13px] font-semibold">Sources</h3> : null}
      <ul className="divide-y divide-border rounded-md border border-border bg-surface text-sm">
        {sources.map((s) => (
          <li key={`${s.path}:${s.lines.join("-")}`}>
            <button
              type="button"
              onClick={() => openCorpusSource(s)}
              aria-label={`Open ${s.path}, ${formatLines(s.lines)}`}
              className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-left hover:bg-subtle"
            >
              <code className="break-all font-mono text-xs text-accent-ink">{s.path}</code>
              <span className="text-xs text-muted">{formatLines(s.lines)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <AssistantAvatar />
      <div className="flex items-center gap-2.5 pt-1 text-sm text-muted">
        <span aria-hidden className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-accent"
              style={{ animation: `dos-pulse 1.1s ${i * 0.15}s infinite ease-in-out` }}
            />
          ))}
        </span>
        Searching the corpus…
      </div>
    </div>
  );
}
