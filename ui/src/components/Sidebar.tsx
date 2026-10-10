import {
  BookOpen,
  Check,
  ChevronsUpDown,
  FolderKanban,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ScrollText,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/useChat";
import { useUI } from "@/hooks/useUI";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/types";

const NAV: { view: ViewId; label: string; icon: LucideIcon }[] = [
  { view: "ask", label: "Ask Decision OS", icon: MessageSquare },
  { view: "decisions", label: "Decision Log", icon: ScrollText },
  { view: "documents", label: "Documents", icon: BookOpen },
  { view: "projects", label: "Projects", icon: FolderKanban },
  { view: "people", label: "People", icon: Users },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white", className)}>
      <Check className="h-4 w-4" strokeWidth={3} />
    </span>
  );
}

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch workspace"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-left hover:bg-subtle",
          collapsed && "justify-center px-0",
        )}
      >
        <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-foreground text-[10px] font-semibold text-white">
          F
        </span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">FinFlow</span>
            <ChevronsUpDown aria-hidden className="h-3.5 w-3.5 text-muted" />
          </>
        ) : null}
      </button>
      {open ? (
        <div role="listbox" aria-label="Workspaces" className="absolute left-0 top-full z-30 mt-1 w-56 rounded-md border border-border bg-surface p-1 shadow-lg">
          <div role="option" aria-selected className="flex items-center gap-2 rounded px-2 py-1.5 text-sm">
            <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-[10px] font-semibold text-white">F</span>
            <span className="flex-1">FinFlow</span>
            <Check aria-hidden className="h-3.5 w-3.5 text-accent" />
          </div>
          <div role="option" aria-selected="false" aria-disabled className="px-2 py-1.5 text-xs text-muted">
            Additional workspaces are not available in this prototype.
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  /** Show the collapse toggle (desktop only) */
  showToggle?: boolean;
}

export function SidebarContent({ collapsed, showToggle }: SidebarContentProps) {
  const { route, navigate, toggleSidebar } = useUI();
  const { conversations, activeId, newChat, select } = useChat();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return q ? sorted.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.role === "user" && m.content.toLowerCase().includes(q))) : sorted;
  }, [conversations, query]);

  const startNewChat = () => {
    newChat();
    navigate({ view: "ask" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-12 shrink-0 items-center gap-2 px-3", collapsed && "justify-center px-0")}>
        <Logo />
        {!collapsed ? <span className="flex-1 text-[15px] font-semibold tracking-tight">Decision OS</span> : null}
        {showToggle && !collapsed ? (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Collapse sidebar">
            <PanelLeftClose aria-hidden className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className={cn("space-y-2 px-3 pb-2", collapsed && "px-2")}>
        <WorkspaceSwitcher collapsed={collapsed} />
        {collapsed ? (
          <Button variant="default" size="icon" className="w-full" onClick={startNewChat} aria-label="New chat">
            <Plus aria-hidden className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="default" className="w-full justify-start" onClick={startNewChat}>
            <Plus aria-hidden className="h-4 w-4" />
            New chat
          </Button>
        )}
      </div>

      <nav aria-label="Primary" className={cn("px-3 py-1", collapsed && "px-2")}>
        <ul className="space-y-0.5">
          {NAV.map(({ view, label, icon: Icon }) => {
            const current = route.view === view;
            return (
              <li key={view}>
                <button
                  type="button"
                  aria-current={current ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  onClick={() => navigate({ view })}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
                    current ? "bg-accent-soft font-medium text-accent-ink" : "text-foreground/80 hover:bg-subtle hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon aria-hidden className="h-4 w-4 shrink-0" />
                  {!collapsed ? label : <span className="sr-only">{label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed ? (
        <div className="mt-2 flex min-h-0 flex-1 flex-col px-3">
          <div className="relative mb-2">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input
              type="search"
              aria-label="Search conversations"
              placeholder="Search conversations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 bg-background pl-8 text-[13px]"
            />
          </div>
          <h2 className="px-2.5 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted">Recent</h2>
          <ul className="scroll-thin -mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1">
            {filtered.length === 0 ? (
              <li className="px-2.5 py-2 text-xs text-muted">No conversations match “{query}”.</li>
            ) : (
              filtered.map((c) => {
                const current = route.view === "ask" && activeId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-current={current ? "true" : undefined}
                      onClick={() => {
                        select(c.id);
                        navigate({ view: "ask" });
                      }}
                      className={cn(
                        "w-full cursor-pointer truncate rounded-md px-2.5 py-1.5 text-left text-[13px]",
                        current ? "bg-subtle font-medium text-foreground" : "text-foreground/75 hover:bg-subtle hover:text-foreground",
                      )}
                    >
                      {c.title}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className={cn("space-y-1 border-t border-border px-3 py-2", collapsed && "px-2")}>
        <button
          type="button"
          aria-current={route.view === "settings" ? "page" : undefined}
          title={collapsed ? "Settings" : undefined}
          onClick={() => navigate({ view: "settings" })}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
            route.view === "settings" ? "bg-accent-soft font-medium text-accent-ink" : "text-foreground/80 hover:bg-subtle hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <Settings aria-hidden className="h-4 w-4 shrink-0" />
          {!collapsed ? "Settings" : <span className="sr-only">Settings</span>}
        </button>
        {!collapsed ? (
          <p className="flex items-center gap-1.5 px-2.5 pb-1 text-xs text-muted">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" />
            Workspace: FinFlow
          </p>
        ) : null}
        {showToggle && collapsed ? (
          <Button variant="ghost" size="icon" className="w-full" onClick={toggleSidebar} aria-label="Expand sidebar">
            <PanelLeftOpen aria-hidden className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
