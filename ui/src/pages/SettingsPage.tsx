import { PageHeader } from "@/components/PageHeader";

const SWAPS = [
  {
    name: "Answer service",
    detail: "Implement the DecisionOSClient interface in services/decisionOSService.ts against a real API and replace mockDecisionOSClient.",
  },
  {
    name: "Retrieval backend",
    detail: "Replace the keyword and intent matcher in services/mockRetrieval.ts with retrieval over an indexed corpus and an LLM that cites sources.",
  },
  {
    name: "Document ingestion",
    detail: "Replace the seeded files in data/ with a pipeline that ingests meetings, Slack threads, PRDs, ADRs, and design docs.",
  },
];

export function SettingsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Settings" description="Workspace information for this prototype." />
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Workspace</h2>
            <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted">Name</dt>
              <dd>FinFlow</dd>
              <dt className="text-muted">Data source</dt>
              <dd>Local seeded mock data</dd>
              <dt className="text-muted">Editing</dt>
              <dd className="text-muted">Read-only. Workspace settings are not implemented.</dd>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">How answers are produced</h2>
            <p className="mt-2 text-sm text-muted">
              This prototype runs on a local, deterministic mock-data layer. There is no LLM, no backend, and no API key. Answers come from keyword
              and intent matching over the seeded FinFlow documents. It is not semantic search, and it can only answer about the seeded decisions.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">What a real integration would replace</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {SWAPS.map((s) => (
                <li key={s.name} className="text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-2 rounded bg-neutral-soft px-1.5 py-0.5 text-xs text-muted">Not implemented</span>
                  <p className="mt-0.5 text-muted">{s.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
