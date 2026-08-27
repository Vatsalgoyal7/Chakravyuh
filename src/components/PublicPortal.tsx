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
import PublicCustomForm from "./PublicCustomForm";
import { CustomForm } from "../types";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { onSnapshot, collection } from "firebase/firestore";
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
    <span className="font-extrabold tracking-wider font-mono text-orange-800 bg-orange-500/15 px-2 py-0.5 rounded border border-orange-500/20 ml-1 animate-pulse">
      ₹{count.toLocaleString("en-IN")}
    </span>
  );
}

function PublicPortalContent() {
  const { isWhiteBg } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("home");
  const [preselectedEventId, setPreselectedEventId] = useState<string | null>(null);
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);

  useEffect(() => {
    // 1. Initial Load fallback
    dbService.getCustomForms().then(forms => {
      setCustomForms(forms.filter(f => f.isActive));
    }).catch(console.error);

    // 2. Real-time sync if Firebase is configured
    if (isFirebaseConfigured && db) {
      try {
        const unsubscribe = onSnapshot(collection(db, "custom_forms"), (snapshot) => {
          const forms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomForm));
          setCustomForms(forms.filter(f => f.isActive).sort((a, b) => a.order - b.order));
        }, (err) => {
          console.error("Firestore custom_forms listener failed:", err);
        });
        return () => unsubscribe();
      } catch (err) {
        console.error("Failed to set up custom_forms listener:", err);
      }
    }
  }, []);

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
        prizePoolAmount: Number(res.prizePoolAmount) || 100000
      });
    }).catch(console.error);
    window.scrollTo(0, 0);
  }, [activeTab]); // reload banner settings & reset scroll to top when tab changes/user navigates

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

      default: {
        if (activeTab.startsWith("form_")) {
          const formId = activeTab.replace("form_", "");
          const form = customForms.find((f) => f.id === formId);
          if (form) {
            return <PublicCustomForm url={form.url} title={form.title} />;
          }
        }
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
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 py-2.5 px-4 text-xs font-mono relative z-50 border-b border-yellow-500/10 shadow-md shadow-yellow-500/[0.03] select-none overflow-hidden h-9 flex items-center">
            {/* Live Alert Badge */}
            <div className="absolute left-3 z-10 bg-amber-500/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-amber-600/35 flex items-center gap-1 shadow-sm shrink-0">
              <Gift className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
              <span className="font-black text-[9px] tracking-wider uppercase">Live Announcement</span>
            </div>
            
            {/* Marquee Wrapper */}
            <div className="w-full overflow-hidden flex items-center pl-28">
              <div className="absolute flex items-center gap-16 animate-banner-marquee whitespace-nowrap text-xs font-black text-slate-950 cursor-pointer">
                {(() => {
                  const items = bannerSettings.bannerText
                    ? bannerSettings.bannerText.split("\n").map(l => l.trim()).filter(Boolean)
                    : ["Rewards And Prizes"];
                  
                  return items.map((msg, index) => (
                    <span key={index} className="flex items-center gap-3 select-none">
                      <span className="text-[10px] opacity-60">✦</span>
                      <span>{msg}</span>
                      {index === 0 && (
                        <>
                          <PrizePoolCounter target={bannerSettings.prizePoolAmount} />
                          <Zap className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                        </>
                      )}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        <PublicNavbar activeTab={activeTab} setActiveTab={setActiveTab} customForms={customForms} />

        <main>
          {activeTab === "home" ? (
            renderContent()
          ) : (
            <ArenaPageFrame scene={activeTab.startsWith("form_") ? "custom_form" : activeTab as any}>
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
