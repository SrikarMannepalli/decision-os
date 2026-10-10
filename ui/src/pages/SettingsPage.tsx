import { PageHeader } from "@/components/PageHeader";

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
              <dd>DecisionOS API over the markdown corpus</dd>
              <dt className="text-muted">Editing</dt>
              <dd className="text-muted">Read-only. Workspace settings are not implemented.</dd>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">How answers are produced</h2>
            <p className="mt-2 text-sm text-muted">
              Every page — chat, the Decision Log, Documents, Projects and People — reads the FastAPI backend, which serves the
              FinFlow corpus. Chat questions go to the conversation endpoints, where a read-only agent searches the corpus and
              answers with the file paths and lines it used. Asking a question needs <code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs">ROUTERPLUS_API_KEY</code>;
              the other pages work without it.
            </p>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Running it</h2>
            <p className="mt-2 text-sm text-muted">
              Start the API (<code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs">uvicorn decisionos.main:app --port 8000</code> from the repo
              root) and then <code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs">npm run dev</code> here; the dev server proxies
              <code className="mx-1 rounded bg-subtle px-1 py-0.5 font-mono text-xs">/api</code> to it. Or use
              <code className="mx-1 rounded bg-subtle px-1 py-0.5 font-mono text-xs">scripts/dev-live.sh</code> from the repo root, which starts both.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
