import React, { useState } from "react";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import PublicHome from "./PublicHome";
import PublicAbout from "./PublicAbout";
import PublicEvents from "./PublicEvents";
import PublicSchedule from "./PublicSchedule";
import PublicRegistration from "./PublicRegistration";
import PublicGallery from "./PublicGallery";
import PublicRulesContact from "./PublicRulesContact";
import PublicFAQ from "./PublicFAQ";
import PublicDashboard from "./PublicDashboard";
import ArenaPageFrame from "./ArenaPageFrame";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import ThemeSwitcher from "./ThemeSwitcher";
import ThemeToggle from "./ThemeToggle";

function PublicPortalContent() {
  const { isWhiteBg } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("home");
  const [preselectedEventId, setPreselectedEventId] = useState<string | null>(null);

  const handleRegisterSelect = (eventId: string) => {
    setPreselectedEventId(eventId);
    setActiveTab("registration");
  };

  const handleClearPreselection = () => {
    setPreselectedEventId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <PublicHome
            onExploreEvents={() => setActiveTab("events")}
            onRegisterNow={() => setActiveTab("registration")}
          />
        );

      case "about":
        return <PublicAbout />;

      case "events":
        return <PublicEvents onRegisterSelect={handleRegisterSelect} />;

      case "schedule":
        return <PublicSchedule />;

      case "registration":
        return (
          <PublicRegistration
            preselectedEventId={preselectedEventId}
            onClearPreselection={handleClearPreselection}
            onNavigateToSchedule={() => setActiveTab("schedule")}
          />
        );

      case "gallery":
        return <PublicGallery />;

      case "rules":
        return <PublicRulesContact />;

      case "faq":
        return <PublicFAQ />;

      case "track":
        return <PublicDashboard />;

      default:
        return (
          <PublicHome
            onExploreEvents={() => setActiveTab("events")}
            onRegisterNow={() => setActiveTab("registration")}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between select-none transition-colors duration-300 ${
        isWhiteBg
          ? "bg-white text-gray-900"
          : "bg-[#0d0f12] text-white"
      }`}
    >
      <div>
        <PublicNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main>
          {activeTab === "home" ? (
            renderContent()
          ) : (
            <ArenaPageFrame scene={activeTab as "about" | "events" | "schedule" | "registration" | "gallery" | "rules" | "faq" | "track"}>
              {renderContent()}
            </ArenaPageFrame>
          )}
        </main>
      </div>

      <PublicFooter setActiveTab={setActiveTab} />
      <ThemeToggle />
      <ThemeSwitcher />
    </div>
  );
}

export default function PublicPortal() {
  return (
    <ThemeProvider>
      <PublicPortalContent />
    </ThemeProvider>
  );
}
