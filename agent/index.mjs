// DecisionOS retrieval sidecar (ADR-0003).
//
// Speaks newline-delimited JSON on stdio. One request per line:
//   {"id":"...","conversationId":"...","corpus":"/abs/path","question":"..."}
// One response per request:
//   {"id":"...","ok":true,"answer":"...","citations":[{"path":"a.md","lines":[1,10]}]}
//   {"id":"...","ok":false,"error":"..."}
//
// One in-memory Pi session per conversationId. The session keeps the message
// history across turns, so a follow-up turn sees earlier questions, answers,
// and tool results. Tools are read-only and rooted at the corpus.

import readline from "node:readline";
import {
	createAgentSession,
	DefaultResourceLoader,
	getAgentDir,
	SessionManager,
} from "@earendil-works/pi-coding-agent";

const SYSTEM_PROMPT = `You answer questions about past product decisions by reading the files in this directory.

Rules:
- Explore with ls, find, and grep, then read the files that matter. Read only as far as you need.
- Answer in prose. Name each file path and the line range that supports each claim, like docs/decisions/2024-03-invoicing.md:12-18.
- If a later file changes an earlier decision, say what changed and cite both files.
- If the corpus does not answer the question, say so plainly. Do not invent.
- This directory is read-only. You have no tools that write; do not try.`;

/** conversationId -> { corpus, session, unsubscribe } */
const conversations = new Map();

function relativeTo(corpus, path) {
	const prefix = corpus.endsWith("/") ? corpus : `${corpus}/`;
	return path.startsWith(prefix)
		? path.slice(prefix.length)
		: path.replace(/^\/+/, "");
}

async function getConversation(conversationId, corpus) {
	const existing = conversations.get(conversationId);
	if (existing) {
		if (existing.corpus !== corpus) {
			throw new Error(
				`conversation ${conversationId} is bound to a different corpus`,
			);
		}
		return existing;
	}
	// Read-only sidecar: no extensions, skills, or context files leaking in
	// from ~/.pi or the corpus tree. Only the system prompt is ours.
	const loader = new DefaultResourceLoader({
		cwd: corpus,
		agentDir: getAgentDir(),
		systemPromptOverride: () => SYSTEM_PROMPT,
		noExtensions: true,
		noSkills: true,
		noPromptTemplates: true,
		noThemes: true,
		noContextFiles: true,
	});
	await loader.reload();
	const { session } = await createAgentSession({
		cwd: corpus,
		tools: ["read", "grep", "find", "ls"],
		sessionManager: SessionManager.inMemory(corpus),
		resourceLoader: loader,
	});
	const entry = { corpus, session, unsubscribe: () => {} };
	conversations.set(conversationId, entry);
	return entry;
}

function assistantText(message) {
	if (!message || message.role !== "assistant") return "";
	return (message.content ?? [])
		.filter((block) => block.type === "text")
		.map((block) => block.text ?? "")
		.join("")
		.trim();
}

async function ask({ conversationId, corpus, question }) {
	const { session } = await getConversation(conversationId, corpus);

	// Citations are per turn: only the read calls this turn's loop makes.
	const opened = new Map(); // path -> [minLine, maxLine]
	const unsubscribe = session.subscribe((event) => {
		if (event.type !== "tool_execution_start") return;
		if (event.toolName !== "read") return;
		const path = event.args?.path;
		if (typeof path !== "string" || path.length === 0) return;
		const start = Number.isFinite(event.args?.offset)
			? event.args.offset
			: 1;
		// The read tool returns up to its limit lines from offset; the exact
		// span the answer relies on is what the prose names. Record the
		// requested window; merge overlapping reads of the same file.
		const limit = Number.isFinite(event.args?.limit)
			? event.args.limit
			: 2000;
		const end = start + limit - 1;
		const span = opened.get(path);
		if (span) {
			span[0] = Math.min(span[0], start);
			span[1] = Math.max(span[1], end);
		} else {
			opened.set(path, [start, end]);
		}
	});

	let lastError = null;
	try {
		await session.prompt(question);
	} catch (error) {
		lastError = error;
	} finally {
		unsubscribe();
	}
	if (lastError) throw lastError;

	// The answer is the last assistant message of this turn.
	const messages = session.messages;
	let answer = "";
	for (let i = messages.length - 1; i >= 0; i--) {
		const text = assistantText(messages[i]);
		if (text) {
			answer = text;
			break;
		}
	}
	if (!answer) throw new Error("the agent produced no answer text");

	const citations = [...opened.entries()]
		.map(([path, [start, end]]) => ({
			path: relativeTo(corpus, path),
			lines: [start, end],
		}))
		.sort((a, b) => a.path.localeCompare(b.path));

	return { answer, citations };
}

async function main() {
	const rl = readline.createInterface({
		input: process.stdin,
		crlfDelay: Infinity,
	});
	const respond = (response) => {
		process.stdout.write(`${JSON.stringify(response)}\n`);
	};
	for await (const line of rl) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		let request;
		try {
			request = JSON.parse(trimmed);
		} catch {
			respond({ id: null, ok: false, error: "malformed JSON request" });
			continue;
		}
		try {
			const { answer, citations } = await ask(request);
			respond({ id: request.id, ok: true, answer, citations });
		} catch (error) {
			respond({
				id: request.id ?? null,
				ok: false,
				// Stack helps debugging sidecar failures; not shown to end users.
				error: error instanceof Error ? error.stack ?? error.message : String(error),
			});
		}
	}
	for (const { session } of conversations.values()) {
		session.dispose();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
