import { useEffect, useRef } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage, ThinkingIndicator } from "@/components/ChatMessage";
import { useChat } from "@/hooks/useChat";
import { isLiveMode } from "@/services/decisionOSService";
import { SUGGESTED_PROMPTS } from "@/services/mockRetrieval";

export function ChatView() {
  const { active, isThinking, send, retry } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageCount = active?.messages.length ?? 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [active?.id, messageCount, isThinking]);

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-5 py-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-[34px] sm:leading-[1.15]">
            Your company's memory, one question away.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-balance text-center text-[15px] text-muted">
            Understand decisions, trace the reasoning, and find the evidence across FinFlow.
          </p>
          <div className="mt-8">
            <ChatInput onSubmit={send} autoFocus />
          </div>
          <div className={isLiveMode ? "hidden" : "mt-4 grid gap-2 sm:grid-cols-2"} role="group" aria-label="Suggested questions">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="cursor-pointer rounded-lg border border-border bg-surface px-3.5 py-3 text-left text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft/60"
              >
                {prompt}
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            {isLiveMode
              ? "Answers come from the DecisionOS backend and cite the corpus files they read."
              : "Answers come from seeded FinFlow documents using deterministic keyword matching — not an LLM."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-5 py-8">
          {active.messages.map((message, i) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={i === active.messages.length - 1}
              onFollowUp={send}
              onRetry={retry}
              disabled={isThinking}
            />
          ))}
          {isThinking ? <ThinkingIndicator /> : null}
        </div>
      </div>
      <div className="bg-gradient-to-t from-background via-background to-transparent px-5 pb-4 pt-2">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput onSubmit={send} disabled={isThinking} autoFocus />
        </div>
      </div>
    </div>
  );
}
