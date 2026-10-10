export type DecisionStatus =
  | "Proposed"
  | "Approved"
  | "Approved with follow-up"
  | "Rejected"
  | "Superseded";

/** "Proposed" and "Under consideration" apply only to decisions that are not finalized. */
export type AlternativeDisposition = "Selected" | "Rejected" | "Deferred" | "Proposed" | "Under consideration";

export type DocumentType =
  | "Zoom transcript"
  | "Slack thread"
  | "PRD"
  | "ADR"
  | "Design doc"
  | "Engineering update"
  | "Follow-up";

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: "Product" | "Engineering" | "Design" | "Data" | "Customer Success" | "Security" | "Quality";
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

export interface Alternative {
  title: string;
  disposition: AlternativeDisposition;
  rationale: string;
  artifactIds: string[];
}

export interface FollowUpAction {
  id: string;
  description: string;
  ownerId: string;
  /** ISO date (YYYY-MM-DD) */
  dueDate?: string;
  status: "Open" | "Done";
  artifactIds: string[];
}

export interface Decision {
  id: string;
  title: string;
  projectId: string;
  status: DecisionStatus;
  ownerId: string;
  technicalOwnerId?: string;
  contributorIds: string[];
  approverIds: string[];
  /** ISO date the decision was made; null while still proposed */
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  problem: string;
  /** Final decision text; null when no decision has been made */
  finalDecision: string | null;
  /** Leading proposal for decisions that are not finalized */
  leadingProposal?: string;
  rationale: string[];
  alternatives: Alternative[];
  caveats: string[];
  openQuestions: string[];
  followUps: FollowUpAction[];
  supersedes: string[];
  supersededBy: string[];
  /** Supporting artifact IDs, in citation order */
  artifactIds: string[];
}

export interface Excerpt {
  id: string;
  label: string;
  text: string;
}

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  projectId: string;
  /** Author or participants */
  authorIds: string[];
  /** ISO date */
  createdAt: string;
  decisionIds: string[];
  summary: string;
  /** Lightweight markdown: "## heading", "- bullet", "> quote", blank-line separated paragraphs */
  content: string;
  excerpts: Excerpt[];
}

/** A pointer from an answer to a specific passage of a seeded document. */
export interface EvidenceReference {
  artifactId: string;
  excerptId: string;
  /** What this evidence supports */
  claim: string;
}

export type SectionKind =
  | "why"
  | "decided"
  | "alternatives"
  | "evidence"
  | "people"
  | "open"
  | "disagreement"
  | "decisions";

export interface AnswerAlternative {
  title: string;
  disposition: AlternativeDisposition;
  rationale: string;
}

export interface AnswerSection {
  kind: SectionKind;
  title: string;
  /** Paragraphs may contain inline citation markers such as [ZOOM-001] */
  paragraphs?: string[];
  bullets?: string[];
  alternatives?: AnswerAlternative[];
  people?: { employeeId: string; role: string }[];
  evidence?: EvidenceReference[];
  actions?: { description: string; ownerId: string; dueDate?: string }[];
}

export type AnswerConfidence = "grounded" | "unresolved" | "insufficient";

/** A passage of a corpus file cited by the live backend. */
export interface CorpusCitation {
  path: string;
  /** Inclusive 1-based line range */
  lines: [number, number];
}

export interface AssistantAnswer {
  confidence: AnswerConfidence;
  directAnswer: string;
  sections: AnswerSection[];
  decisionIds: string[];
  evidence: EvidenceReference[];
  personIds: string[];
  /** Suggested follow-up questions */
  suggestions: string[];
  /** Corpus passages cited by the live backend (absent for mock answers) */
  sources?: CorpusCitation[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  /** Plain-text rendering, used for copy and for the user's own text */
  content: string;
  createdAt: string;
  answer?: AssistantAnswer;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export type ViewId = "ask" | "decisions" | "documents" | "projects" | "people" | "settings";
