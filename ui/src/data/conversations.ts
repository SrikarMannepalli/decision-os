import { answerSync } from "@/services/decisionOSService";
import type { ChatMessage, Conversation } from "@/types";

function buildConversation(id: string, title: string, day: string, questions: string[]): Conversation {
  const messages: ChatMessage[] = [];
  questions.forEach((question, i) => {
    const minute = String(i * 2).padStart(2, "0");
    messages.push({ id: `${id}-u${i}`, role: "user", content: question, createdAt: `${day}T09:${minute}:00Z` });
    const result = answerSync(question, messages);
    messages.push({
      id: `${id}-a${i}`,
      role: "assistant",
      content: result.text,
      createdAt: `${day}T09:${minute}:30Z`,
      answer: result.answer,
    });
  });
  return { id, title, createdAt: messages[0].createdAt, updatedAt: messages[messages.length - 1].createdAt, messages };
}

/** Seeded history shown in the sidebar. Answers come from the same engine as live chat. */
export const seededConversations: Conversation[] = [
  buildConversation("conv-recon", "Large-account reconciliation delay", "2026-10-09", [
    "Why did we delay large-account reconciliation?",
    "Who approved the phased rollout?",
  ]),
  buildConversation("conv-bulk", "Bulk invoice review step", "2026-10-08", [
    "What did we decide about bulk invoice actions?",
    "What's still open?",
  ]),
  buildConversation("conv-forecast", "Forecast explanation status", "2026-10-08", [
    "Is the forecast explanation design finalized?",
    "What alternatives did we consider for cash-flow forecasts?",
  ]),
  buildConversation("conv-unresolved", "Unresolved decisions", "2026-10-07", ["Which decisions are still unresolved?"]),
];
