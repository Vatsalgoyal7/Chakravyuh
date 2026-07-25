import React from "react";
import { useTheme } from "../lib/ThemeContext";
import {
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  Image,
  ShieldCheck,
  Search,
  Trophy,
  Users,
} from "lucide-react";

type Scene = "about" | "events" | "schedule" | "registration" | "gallery" | "rules" | "faq" | "track";

interface ArenaPageFrameProps {
  scene: Scene;
  children: React.ReactNode;
}

const sceneConfig = {
  about: { label: "THE PEOPLE BEHIND THE ARENA", Icon: Users, tone: "sky" },
  events: { label: "SELECT YOUR BATTLEGROUND", Icon: Trophy, tone: "orange" },
  schedule: { label: "FIXTURES IN MOTION", Icon: CalendarDays, tone: "violet" },
  registration: { label: "BUILD YOUR CHAMPIONSHIP ROSTER", Icon: ClipboardCheck, tone: "emerald" },
  gallery: { label: "MOMENTS THAT MADE HISTORY", Icon: Image, tone: "pink" },
  rules: { label: "PLAY WITH HONOUR", Icon: ShieldCheck, tone: "amber" },
  faq: { label: "ARENA INTELLIGENCE DESK", Icon: CircleHelp, tone: "sky" },
  track: { label: "ROSTER STATUS COMMAND CENTER", Icon: Search, tone: "violet" },
} as const;

export default function ArenaPageFrame({ scene, children }: ArenaPageFrameProps) {
  const { isWhiteBg } = useTheme();
  const { label, Icon, tone } = sceneConfig[scene];

  return (
    <section className={`arena-page-shell arena-tone-${tone} relative isolate overflow-hidden ${isWhiteBg ? "arena-page-shell-light" : ""}`}>
      {!isWhiteBg && (
        <>
          <div className="arena-page-grid absolute inset-0 pointer-events-none" />

          <div className="arena-page-glow absolute -top-40 -right-28 w-[34rem] h-[34rem] rounded-full pointer-events-none opacity-60" />

          <div
            className="absolute -top-60 right-10 w-[40rem] h-[40rem] rounded-full pointer-events-none opacity-30 blur-3xl"
            style={{
              background: "radial-gradient(circle, var(--theme-glow) 0%, transparent 68%)"
            }}
          />
        </>
      )}

      <div className="relative z-10 pt-12 md:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2">
          <div 
            className="arena-page-kicker inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-mono font-bold tracking-[0.16em] uppercase"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-accent) 30%, var(--arena-ball) 30%)",
              boxShadow: "0 0 26px color-mix(in srgb, var(--theme-glow) 25%, var(--arena-glow) 25%)",
              color: "color-mix(in srgb, var(--theme-accent) 50%, var(--arena-ball) 50%)"
            }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: "var(--theme-accent)" }} />
            <span>{label}</span>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
