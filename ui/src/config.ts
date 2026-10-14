/**
 * The one switch for where every page and the chat read from:
 *   seed   - the UI's own bundled data and mock answer engine (src/data), no backend. Default.
 *   corpus - the FastAPI backend reading corpus/finflow (chat also needs ROUTERPLUS_API_KEY).
 * Set VITE_DATA_SOURCE (see .env.example) and restart `npm run dev`.
 */
export type DataSource = "seed" | "corpus";

export const dataSource: DataSource = import.meta.env.VITE_DATA_SOURCE === "corpus" ? "corpus" : "seed";

export const isLiveMode = dataSource === "corpus";
