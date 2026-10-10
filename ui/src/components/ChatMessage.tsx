import { AlertTriangle, Check, Copy, FileSearch, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnswerSection } from "@/components/AnswerSection";
import { DecisionStatusBadge } from "@/components/DecisionStatusBadge";
import { RichText } from "@/components/RichText";
import { Button } from "@/components/ui/button";
import { decisionById } from "@/data/decisions";
import { useUI } from "@/hooks/useUI";
import { useIsLg } from "@/hooks/useMediaQuery";
import { isLiveMode } from "@/services/decisionOSService";
import { cn } from "@/lib/utils";
import { formatLines } from "@/lib/format";
import type { ChatMessage as ChatMessageData, CorpusCitation } from "@/types";

interface ChatMessageProps {
  message: ChatMessageData;
  isLast: boolean;
  onFollowUp: (question: string) => void;
  onRetry: () => void;
  disabled: boolean;
}

export function ChatMessage({ message, isLast, onFollowUp, onRetry, disabled }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-subtle px-4 py-2.5 text-[15px] leading-relaxed">{message.content}</p>
      </div>
    );
  }
  if (message.error) return <ErrorMessage message={message} onRetry={onRetry} disabled={disabled || !isLast} />;
  return <AssistantMessage message={message} isLast={isLast} onFollowUp={onFollowUp} disabled={disabled} />;
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

function AssistantMessage({
  message,
  isLast,
  onFollowUp,
  disabled,
}: {
  message: ChatMessageData;
  isLast: boolean;
  onFollowUp: (q: string) => void;
  disabled: boolean;
}) {
  const answer = message.answer;
  const { revealContext } = useUI();
  const isLg = useIsLg();
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
        {answer.decisionIds.length > 0 && answer.decisionIds.length <= 3 ? (
          <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Decisions referenced">
            {answer.decisionIds.map((id) => {
              const d = decisionById(id);
              return d ? (
                <li key={id} className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <span className="font-mono">{id}</span>
                  <DecisionStatusBadge status={d.status} />
                </li>
              ) : null;
            })}
          </ul>
        ) : null}

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

        {answer.sources && answer.sources.length > 0 ? <CorpusSources sources={answer.sources} /> : null}

        {answer.sections.map((section) => (
          <AnswerSection key={`${section.kind}-${section.title}`} section={section} />
        ))}

        <div className="mt-4 flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy answer">
            {copied ? <Check aria-hidden className="h-3.5 w-3.5 text-ok" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy answer"}
          </Button>
          {answer.evidence.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => revealContext(isLg)}>
              <FileSearch aria-hidden className="h-3.5 w-3.5" />
              Inspect sources ({answer.evidence.length})
            </Button>
          ) : null}
        </div>

        {isLast && answer.suggestions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Suggested follow-up questions">
            {answer.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => onFollowUp(s)}
                className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground hover:border-accent/40 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function CorpusSources({ sources, heading = true }: { sources: CorpusCitation[]; heading?: boolean }) {
  return (
    <section className="mt-3" aria-label="Cited sources">
      {heading ? <h3 className="mb-1.5 text-[13px] font-semibold">Sources</h3> : null}
      <ul className="divide-y divide-border rounded-md border border-border bg-surface text-sm">
        {sources.map((s) => (
          <li key={`${s.path}:${s.lines.join("-")}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3 py-2">
            <code className="break-all font-mono text-xs text-accent-ink">{s.path}</code>
            <span className="text-xs text-muted">{formatLines(s.lines)}</span>
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
        {isLiveMode ? "Searching the corpus…" : "Searching FinFlow documents…"}
      </div>
    </div>
  );
}
