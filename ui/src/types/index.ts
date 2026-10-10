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

/** A catalog document as the list endpoint returns it; `content` is only on the detail. */
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
  content?: string;
}

/** GET /documents/{id}: adds the body and where it starts in the corpus file. */
export interface DocumentDetail extends Document {
  content: string;
  /** 1-based line of the raw corpus file where `content` begins. */
  bodyStartLine?: number;
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
  /** Corpus passages cited by the backend */
  sources: CorpusCitation[];
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
