import { FileText, Hash, Landmark, ListChecks, PenTool, Video, Wrench, type LucideIcon } from "lucide-react";
import type { DocumentType } from "@/types";

const ICONS: Record<DocumentType, LucideIcon> = {
  "Zoom transcript": Video,
  "Slack thread": Hash,
  PRD: FileText,
  ADR: Landmark,
  "Design doc": PenTool,
  "Engineering update": Wrench,
  "Follow-up": ListChecks,
};

export function DocumentTypeIcon({ type, className }: { type: DocumentType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon aria-hidden className={className ?? "h-4 w-4"} />;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  "Zoom transcript",
  "Slack thread",
  "PRD",
  "ADR",
  "Design doc",
  "Engineering update",
  "Follow-up",
];
