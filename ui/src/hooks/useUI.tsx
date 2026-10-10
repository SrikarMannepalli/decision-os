import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useHashRoute, type Route } from "./useHashRoute";

export interface SourceTarget {
  artifactId: string;
  excerptId?: string;
}

interface UIContextValue {
  route: Route;
  navigate: (to: Route) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  contextCollapsed: boolean;
  toggleContext: () => void;
  /** Expand the context panel (desktop) or open its drawer (smaller screens) */
  revealContext: (isDesktop: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  mobileContextOpen: boolean;
  setMobileContextOpen: (open: boolean) => void;
  source: SourceTarget | null;
  openSource: (target: SourceTarget) => void;
  closeSource: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const { route, navigate } = useHashRoute();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileContextOpen, setMobileContextOpen] = useState(false);
  const [source, setSource] = useState<SourceTarget | null>(null);

  const openSource = useCallback((target: SourceTarget) => setSource(target), []);
  const closeSource = useCallback(() => setSource(null), []);

  const value = useMemo<UIContextValue>(
    () => ({
      route,
      navigate: (to) => {
        setMobileNavOpen(false);
        setSource(null);
        navigate(to);
      },
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((v) => !v),
      contextCollapsed,
      toggleContext: () => setContextCollapsed((v) => !v),
      revealContext: (isDesktop) => (isDesktop ? setContextCollapsed(false) : setMobileContextOpen(true)),
      mobileNavOpen,
      setMobileNavOpen,
      mobileContextOpen,
      setMobileContextOpen,
      source,
      openSource,
      closeSource,
    }),
    [route, navigate, sidebarCollapsed, contextCollapsed, mobileNavOpen, mobileContextOpen, source, openSource, closeSource],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
