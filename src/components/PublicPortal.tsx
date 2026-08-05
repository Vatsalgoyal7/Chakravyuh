import React, { useState, useEffect } from "react";
import { Gift, Zap } from "lucide-react";
import { dbService } from "../lib/dbService";
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

function PrizePoolCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) return;

    const totalDuration = 1500; // 1.5 seconds animation
    const incrementTime = 30; // 30ms step
    const totalSteps = totalDuration / incrementTime;
    const stepValue = end / totalSteps;

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-extrabold tracking-wider font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/25 ml-1 animate-pulse">
      ₹{count.toLocaleString("en-IN")}
    </span>
  );
}

function PublicPortalContent() {
  const { isWhiteBg } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("home");
  const [preselectedEventId, setPreselectedEventId] = useState<string | null>(null);

  const [bannerSettings, setBannerSettings] = useState<{
    bannerEnabled: boolean;
    bannerText: string;
    prizePoolAmount: number;
  }>({
    bannerEnabled: false,
    bannerText: "Rewards And Prizes : Prizes Worth",
    prizePoolAmount: 100000
  });

  useEffect(() => {
    dbService.getHomepageSettings().then(res => {
      setBannerSettings({
        bannerEnabled: res.bannerEnabled ?? false,
        bannerText: res.bannerText ?? "Rewards And Prizes : Prizes Worth",
        prizePoolAmount: res.prizePoolAmount ?? 100000
      });
    }).catch(console.error);
  }, [activeTab]); // reload banner settings when tab changes/user navigates

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
            onTrackStatus={(recover = false) => {
              setActiveTab("track");
              if (recover) {
                sessionStorage.setItem("chakravyuh_auto_show_recover", "true");
              }
            }}
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
            onTrackStatus={(recover = false) => {
              setActiveTab("track");
              if (recover) {
                sessionStorage.setItem("chakravyuh_auto_show_recover", "true");
              }
            }}
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
        {bannerSettings.bannerEnabled && (
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-2.5 px-4 text-xs font-mono flex items-center justify-center gap-2 relative z-50 border-b border-orange-500/30 shadow-lg shadow-orange-500/10 select-none">
            <Gift className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span className="font-bold tracking-wide uppercase">{bannerSettings.bannerText}</span>
              <PrizePoolCounter target={bannerSettings.prizePoolAmount} />
              <Zap className="w-3 h-3 text-amber-300 animate-pulse ml-1" />
            </div>
          </div>
        )}

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
