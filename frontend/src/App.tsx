import { useState } from "react";
import Sidebar from "./components/Sidebar";
import RecipesPage from "./modules/recipes/components/RecipesPage";
import ProfilePage from "./modules/profile/components/ProfilePage";
import ChatPage from "./modules/chat/components/ChatPage";
import MonitorPage from "./modules/monitor/components/MonitorPage";
import CookingAssistantView from "./modules/recipes/components/CookingAssistantView";
import ExplorerPage from "./modules/recipes/components/ExplorerPage";

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [currentRecipe, setCurrentRecipe] = useState<any>(null);

  const startCooking = (recipe: any) => {
    setCurrentRecipe(recipe);
    setActivePage("cooking");
  };

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <RecipesPage onStartCooking={startCooking} onNavigate={setActivePage} />;
      case "profile":
        return <ProfilePage />;
      case "ai":
        return <ChatPage />;
      case "monitor":
        return <MonitorPage />;
      case "cooking":
        return currentRecipe ? (
          <CookingAssistantView
            recipe={currentRecipe}
            onClose={() => setActivePage("home")}
          />
        ) : <RecipesPage onStartCooking={startCooking} onNavigate={setActivePage} />;
      case "explore":
        return <ExplorerPage onStartCooking={startCooking} />;
      default:
        return <RecipesPage onStartCooking={startCooking} />;
    }
  };

  return (
    <div style={styles.root}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      {renderPage()}
    </div>
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