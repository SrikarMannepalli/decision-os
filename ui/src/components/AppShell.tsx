import { Menu, PanelRightOpen } from "lucide-react";
import type { ReactNode } from "react";
import { ContextPanel, ContextPanelBody } from "@/components/ContextPanel";
import { Logo, SidebarContent } from "@/components/Sidebar";
import { CorpusSourceView } from "@/components/CorpusSourceView";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useChat } from "@/hooks/useChat";
import { useIsLg, useIsMd } from "@/hooks/useMediaQuery";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";

const VIEW_TITLES = {
  ask: "Ask Decision OS",
  decisions: "Decision Log",
  documents: "Documents",
  projects: "Projects",
  people: "People",
  settings: "Settings",
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const ui = useUI();
  const { active } = useChat();
  const isMd = useIsMd();
  const isLg = useIsLg();
  const { route } = ui;
  const onAsk = route.view === "ask";
  const showPanelInline = onAsk && isLg && !ui.contextCollapsed;

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-1.5">
        Skip to content
      </a>

      {isMd ? (
        <aside
          aria-label="Sidebar"
          className={cn("shrink-0 border-r border-border bg-sidebar transition-[width] duration-150", ui.sidebarCollapsed ? "w-14" : "w-[260px]")}
        >
          <SidebarContent collapsed={ui.sidebarCollapsed} showToggle />
        </aside>
      ) : (
        <Sheet open={ui.mobileNavOpen} onOpenChange={ui.setMobileNavOpen}>
          <SheetContent side="left" title="Navigation" className="bg-sidebar">
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
          {!isMd ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => ui.setMobileNavOpen(true)} aria-label="Open navigation">
                <Menu aria-hidden className="h-4 w-4" />
              </Button>
              <Logo className="h-6 w-6" />
            </>
          ) : null}
          <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
            {onAsk && active ? active.title : VIEW_TITLES[route.view]}
          </h2>
          {onAsk && !showPanelInline ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => (isLg ? ui.toggleContext() : ui.setMobileContextOpen(true))}
              aria-label="Show context and evidence"
            >
              <PanelRightOpen aria-hidden className="h-4 w-4" />
              <span className="hidden sm:inline">Context</span>
            </Button>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1">
          <main id="main" className="min-w-0 flex-1 overflow-hidden" tabIndex={-1}>
            {children}
          </main>
          {showPanelInline ? <ContextPanel /> : null}
        </div>
      </div>

      {!isLg ? (
        <Sheet open={onAsk && ui.mobileContextOpen} onOpenChange={ui.setMobileContextOpen}>
          <SheetContent title="Context and evidence" className="max-w-[380px]">
            <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
              <h2 className="text-sm font-semibold">Context &amp; evidence</h2>
            </div>
            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
              <ContextPanelBody />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      <CorpusSourceView />
    </div>
  );
}
