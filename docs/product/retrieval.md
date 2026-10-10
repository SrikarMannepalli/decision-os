# Ask why a decision was made

## Who it is for

A product manager joining a team, or anyone else who needs the reason for a past product decision and cannot find it in a single document.

## Behavior

The corpus is markdown files on disk. Names carry a date and a topic.

The person sends a question, such as "Why was invoice automation deprioritized, and what would make us look again?"

DecisionOS reads only as far as it needs to. It may list directories, search file contents, and read a file or a line range. It then answers in prose and names each file path and line range that supports the answer.

A follow-up on the same topic can open a later file when that file changes the earlier decision. The answer says what changed and cites both files.

The corpus is unchanged after a question.

## Acceptance criteria

- A question returns an answer that cites at least one path inside the corpus.
- The cited lines contain the facts the answer uses.
- A question whose answer depends on two files cites both.
- After the question, every corpus file has the same contents as before.
- A question does not require the caller to name the file that holds the answer.

## Later

Decision records, a timeline, and a search index are separate product documents. V1 is complete when the behavior above holds on a small markdown corpus.
