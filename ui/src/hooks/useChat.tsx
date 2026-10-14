import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { seededConversations } from "@/data/conversations";
import { BackendError } from "@/services/apiClient";
import { isLiveMode, queryDecisionOS } from "@/services/decisionOSService";
import type { ChatMessage, Conversation } from "@/types";

interface ChatContextValue {
  conversations: Conversation[];
  /** null means a fresh "New chat" that has not been started yet */
  activeId: string | null;
  active: Conversation | null;
  isThinking: boolean;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  newChat: () => void;
  select: (id: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`);
const nowIso = () => new Date().toISOString();
const titleFrom = (text: string) => (text.length > 48 ? `${text.slice(0, 45).trimEnd()}…` : text);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(isLiveMode ? [] : seededConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thinkingIds, setThinkingIds] = useState<ReadonlySet<string>>(new Set());
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const patch = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const setThinking = useCallback((id: string, on: boolean) => {
    setThinkingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const ask = useCallback(
    async (conversationId: string, question: string, history: ChatMessage[]) => {
      setThinking(conversationId, true);
      try {
        const result = await queryDecisionOS(conversationId, question, history);
        const message: ChatMessage = { id: newId(), role: "assistant", content: result.text, createdAt: nowIso(), answer: result.answer };
        patch(conversationId, (c) => ({ ...c, updatedAt: message.createdAt, messages: [...c.messages, message] }));
      } catch (err) {
        const message: ChatMessage = {
          id: newId(),
          role: "assistant",
          content:
            err instanceof BackendError
              ? err.message
              : "Something went wrong while searching the FinFlow documents. Your question was not answered.",
          createdAt: nowIso(),
          error: true,
        };
        patch(conversationId, (c) => ({ ...c, updatedAt: message.createdAt, messages: [...c.messages, message] }));
      } finally {
        setThinking(conversationId, false);
      }
    },
    [patch, setThinking],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const userMessage: ChatMessage = { id: newId(), role: "user", content: text, createdAt: nowIso() };

      if (activeId === null) {
        const conversation: Conversation = {
          id: newId(),
          title: titleFrom(text),
          createdAt: userMessage.createdAt,
          updatedAt: userMessage.createdAt,
          messages: [userMessage],
        };
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversation.id);
        await ask(conversation.id, text, [userMessage]);
        return;
      }

      const current = conversationsRef.current.find((c) => c.id === activeId);
      if (!current || thinkingIds.has(activeId)) return;
      const history = [...current.messages, userMessage];
      patch(activeId, (c) => ({ ...c, updatedAt: userMessage.createdAt, messages: history }));
      await ask(activeId, text, history);
    },
    [activeId, ask, patch, thinkingIds],
  );

  const retry = useCallback(async () => {
    if (!activeId) return;
    const current = conversationsRef.current.find((c) => c.id === activeId);
    if (!current || thinkingIds.has(activeId)) return;
    const withoutError = current.messages.filter((m, i) => !(m.error && i === current.messages.length - 1));
    const lastUser = [...withoutError].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    patch(activeId, (c) => ({ ...c, messages: withoutError }));
    await ask(activeId, lastUser.content, withoutError);
  }, [activeId, ask, patch, thinkingIds]);

  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      activeId,
      active: conversations.find((c) => c.id === activeId) ?? null,
      isThinking: activeId !== null && thinkingIds.has(activeId),
      send,
      retry,
      newChat: () => setActiveId(null),
      select: (id) => setActiveId(id),
    }),
    [conversations, activeId, thinkingIds, send, retry],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
