import { useCallback, useEffect, useState } from "react";
import type { ViewId } from "@/types";

export interface Route {
  view: ViewId;
  /** Optional record ID, e.g. DEC-001 or ZOOM-001 */
  id?: string;
}

const VIEWS: ViewId[] = ["ask", "decisions", "documents", "projects", "people", "settings"];

export function parseHash(hash: string): Route {
  const [, view, id] = hash.replace(/^#/, "").split("/");
  const found = VIEWS.find((v) => v === view);
  return { view: found ?? "ask", id: id ? decodeURIComponent(id) : undefined };
}

export function routeToHash(route: Route): string {
  return `#/${route.view}${route.id ? `/${encodeURIComponent(route.id)}` : ""}`;
}

/** Tiny hash router: every record is deep-linkable and back/forward just works. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((to: Route) => {
    const hash = routeToHash(to);
    if (window.location.hash !== hash) window.location.hash = hash;
  }, []);

  return { route, navigate };
}
