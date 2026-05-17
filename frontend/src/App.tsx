import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import RecipesPage from "./modules/recipes/components/RecipesPage";
import ProfilePage from "./modules/profile/components/ProfilePage";
import ChatPage from "./modules/chat/components/ChatPage";
import MonitorPage from "./modules/monitor/components/MonitorPage";
import CookingAssistantView from "./modules/Cooking/components/CookingAssistantView";
import ExplorerPage from "./modules/Explorer/components/ExplorerPage";
import AuthPage from "./modules/Auth/components/AuthPage";
import { authService } from "./modules/Auth/service/authService";
import { ProfileProvider } from "./modules/profile/context/ProfileContext";

export default function App() {
  const [activePage, setActivePage] = useState("auth");
  const [currentRecipe, setCurrentRecipe] = useState<any>(null);
  const [profileParams, setProfileParams] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Explicitly always start at auth per user request
    setActivePage("auth");
  }, []);

  const handleNavigate = (page: string, params?: any) => {
    if (!authService.isAuthenticated()) {
      setActivePage("auth");
      return;
    }
    setProfileParams(params || null);
    setActivePage(page);
    // Auto-close sidebar on mobile after navigation
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const startCooking = (recipe: any) => {
    setCurrentRecipe(recipe);
    handleNavigate("cooking");
  };

  if (activePage === "auth") {
    return (
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        <AuthPage onLoginSuccess={() => setActivePage("home")} />
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "home": return <RecipesPage onStartCooking={startCooking} />;
      case "profile": return <ProfilePage username={profileParams?.username} onBack={handleNavigate} onRecipeClick={startCooking} />;
      case "ai": return <ChatPage />;
      case "monitor": return <MonitorPage />;
      case "explore": return <ExplorerPage onStartCooking={startCooking} />;
      case "cooking":
        return currentRecipe
          ? <CookingAssistantView recipe={currentRecipe} onClose={() => setActivePage("home")} />
          : <RecipesPage onStartCooking={startCooking} />;
      default: return <RecipesPage onStartCooking={startCooking} />;
    }
  };

  return (
    <ProfileProvider>
      <div style={styles.root}>
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div style={{
          flex: 1,
          height: "100%",
          overflow: "auto",
          marginLeft: sidebarOpen ? 280 : 0,
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {renderPage()}
        </div>
      </div>
    </ProfileProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    background: "#f9f1eb",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    overflow: "hidden",
  },
};