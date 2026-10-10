// Minimal stand-in for agent/index.mjs: same JSONL contract, canned replies.
// Used by tests/test_sidecar.py to exercise SidecarAgent without a model.
import readline from "node:readline";

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
	const trimmed = line.trim();
	if (!trimmed) continue;
	const request = JSON.parse(trimmed);
	if (request.question === "explode") {
		process.stdout.write(`${JSON.stringify({ id: request.id, ok: false, error: "boom" })}\n`);
		continue;
	}
	process.stdout.write(
		`${JSON.stringify({
			id: request.id,
			ok: true,
			answer: `echo:${request.conversationId}:${request.question}`,
			citations: [{ path: "decisions/a.md", lines: [3, 6] }],
		})}\n`,
	);
}
