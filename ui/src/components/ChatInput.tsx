import { ArrowUp, FileSearch } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { documents } from "@/data/documents";
import { isLiveMode } from "@/services/decisionOSService";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const CHAT_PLACEHOLDER = "Ask why we made a decision, what changed, or where the evidence lives…";

export function ChatInput({ onSubmit, disabled, autoFocus }: ChatInputProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <form
      onSubmit={onFormSubmit}
      className="rounded-xl border border-border bg-surface shadow-sm focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15"
    >
      <label htmlFor="chat-input" className="sr-only">
        Ask Decision OS
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={CHAT_PLACEHOLDER}
        className="block max-h-[200px] w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-[15px] leading-6 text-foreground placeholder:text-muted/80 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <FileSearch aria-hidden className="h-3.5 w-3.5" />
          {isLiveMode ? "Searching the DecisionOS corpus" : `Searching ${documents.length} FinFlow documents`}
        </span>
        <Button type="submit" size="icon" disabled={disabled || value.trim().length === 0} aria-label="Send question">
          <ArrowUp aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
