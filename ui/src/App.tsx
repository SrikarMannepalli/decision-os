import { AppShell } from "@/components/AppShell";
import { ChatView } from "@/components/ChatView";
import { ChatProvider } from "@/hooks/useChat";
import { UIProvider, useUI } from "@/hooks/useUI";
import { DecisionLogPage } from "@/pages/DecisionLogPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { PeoplePage } from "@/pages/PeoplePage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function CurrentView() {
  const { route } = useUI();
  switch (route.view) {
    case "decisions":
      return <DecisionLogPage />;
    case "documents":
      return <DocumentsPage />;
    case "projects":
      return <ProjectsPage />;
    case "people":
      return <PeoplePage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <ChatView />;
  }
}

export function App() {
  return (
    <UIProvider>
      <ChatProvider>
        <AppShell>
          <CurrentView />
        </AppShell>
      </ChatProvider>
    </UIProvider>
  );
}
