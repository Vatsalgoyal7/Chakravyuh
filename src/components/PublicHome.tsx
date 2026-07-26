import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  Trophy, 
  Users, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  Megaphone, 
  Award, 
  Activity, 
  ArrowRight,
  Flame,
  ShieldAlert,
  Play
} from "lucide-react";
import { dbService } from "../lib/dbService";
import { SportEvent, Announcement, ScheduleItem } from "../types";

interface PublicHomeProps {
  onExploreEvents: () => void;
  onRegisterNow: () => void;
  onTrackStatus?: (recover?: boolean) => void;
}

// Static particle config — generated once, never re-randomized
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 3 + (i % 5) * 2,
  left: (i * 17 + 5) % 100,
  delay: (i * 1.3) % 10,
  duration: 9 + (i % 6) * 2,
  opacity: 0.15 + (i % 4) * 0.08,
}));

export default function PublicHome({ onExploreEvents, onRegisterNow, onTrackStatus }: PublicHomeProps) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [videoSettings, setVideoSettings] = useState<{ videoUrl: string; videoEnabled: boolean }>({ videoUrl: "", videoEnabled: false });

  useEffect(() => {
    const targetDate = new Date("2026-10-10T09:00:00").getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      if (difference <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const [evs, anns, scheds] = await Promise.all([
          dbService.getEvents(),
          dbService.getAnnouncements(),
          dbService.getSchedules(),
        ]);
        setEvents(evs.filter(e => e.isActive));
        setAnnouncements(anns.filter(a => a.isActive));
        setSchedules(scheds);
      } catch (err) {
        console.error("Failed to load statistics: ", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    dbService.getHomepageSettings().then(setVideoSettings).catch(() => {});
  }, []);

  const totalRegisteredAthletes = events.reduce((total, event) => total + (event.registrationCount || 0), 0);
  const collegesDisplay = totalRegisteredAthletes > 0 ? "2+" : 1;

  const getEmbedUrl = (url: string): string => {
    if (!url) return "";
    if (url.includes("youtube.com/embed/")) return url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
    return url;
  };

  const embedUrl = getEmbedUrl(videoSettings.videoUrl);
  const isYoutube = embedUrl.includes("youtube.com/embed");

  return (
    <div className="arena-shell text-white min-h-screen">

      {/* ══ 1. HERO SECTION ══ */}
      <section className="arena-hero relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-white/10">

        {/* Existing arena bg layers */}
        <div className="arena-grid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="arena-orb absolute -right-72 -top-56 pointer-events-none" />
        <div className="arena-orb absolute -left-[31rem] bottom-[-33rem] opacity-50 pointer-events-none" />
        <div className="arena-scanline absolute inset-x-0 top-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(ellipse_at_20%_80%,rgba(var(--theme-accent-rgb),0.13),transparent_32%)] pointer-events-none" />

        {/* Animated glowing orbs */}
        <div className="hero-glow-orb" style={{ width: 420, height: 420, top: "-10%", right: "5%", background: "rgba(var(--theme-accent-rgb), 0.18)", animationDuration: "8s, 14s" }} />
        <div className="hero-glow-orb" style={{ width: 300, height: 300, bottom: "0%", left: "8%", background: "rgba(14,165,233,0.13)", animationDuration: "11s, 18s", animationDelay: "2s, 3s" }} />
        <div className="hero-glow-orb" style={{ width: 200, height: 200, top: "40%", left: "40%", background: "rgba(var(--theme-accent-rgb), 0.08)", animationDuration: "7s, 22s", animationDelay: "1s" }} />

        {/* Floating particles */}
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="hero-particle"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              bottom: "-10px",
              background: p.id % 3 === 0
                ? `rgba(var(--theme-accent-rgb), ${p.opacity})`
                : p.id % 3 === 1
                ? `rgba(251,191,36,${p.opacity})`
                : `rgba(14,165,233,${p.opacity * 0.7})`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 ${p.size * 2}px rgba(var(--theme-accent-rgb),0.4)`,
            }}
          />
        ))}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left: text */}
            <div className="lg:col-span-7 space-y-5 text-center lg:text-left">

              {/* IMSEC College Logo */}
              <motion.div
  initial={{ opacity: 0, y: -15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="flex flex-col items-center lg:items-start"
>
  <img
      src="/chakravyuh-logo.png"
    alt="IMSEC Logo"
    className="w-36 h-36 md:w-48 md:h-48 object-contain"
  />

  <div className="text-center lg:text-left mt-4">
    <p className="text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-orange-400">
  CHAKRAVYUH 2K26
</p>

<p className="text-xs md:text-sm uppercase tracking-[0.3em] text-gray-400 mt-1">
  PRESENTS
</p>
  </div>
</motion.div>

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--theme-accent-bg)] border border-[var(--theme-accent-border)] text-[var(--theme-accent-text)] rounded-full text-[10px] font-bold font-mono tracking-widest uppercase shadow-[0_0_28px_var(--theme-glow)]"
              >
                <Flame className="w-3.5 h-3.5 text-[var(--theme-accent)] animate-pulse" />
                <span>ANNUAL SPORTS EXTRAVAGANZA</span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="arena-heading text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-[-0.06em] uppercase font-sans leading-[0.88]"
              >
                RISE OF THE <br />
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r glow-text-orange"
                  style={{ backgroundImage: "linear-gradient(to right, var(--theme-accent-gradient-from), var(--theme-accent-gradient-via), var(--theme-accent-gradient-to))" }}
                >
                  CHAMPIONS
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="max-w-xl mx-auto lg:mx-0 text-sm text-gray-400 font-sans tracking-wide leading-relaxed"
              >
                Chakravyuh is the ultimate inter-college sporting arena. Break barriers, showcase true grit, and seal your legacy on the battlefields of IMS Engineering College.
              </motion.p>

              {/* Logistics */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3 text-xs font-mono text-gray-300"
              >
                <div className="flex items-center gap-1.5 bg-gray-900/60 px-3.5 py-2 rounded-xl border border-gray-800">
                  <Calendar className="w-4 h-4" style={{ color: "var(--theme-accent)" }} />
                  <span>October 10 - 11, 2026</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-900/60 px-3.5 py-2 rounded-xl border border-gray-800">
                  <MapPin className="w-4 h-4" style={{ color: "var(--theme-accent)" }} />
                  <span>IMSEC Play Ground, Ghaziabad</span>
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start items-center font-mono pt-2"
              >
                <button
                  onClick={onRegisterNow}
                  className="w-full sm:w-auto px-8 py-4 text-[#090b0f] font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-1 shadow-[0_10px_35px_rgba(var(--theme-accent-rgb),0.3)] hover:shadow-[0_16px_42px_var(--theme-glow)] cursor-pointer"
                  style={{ backgroundImage: "linear-gradient(to right, var(--theme-accent-gradient-from), var(--theme-accent-gradient-via), var(--theme-accent-gradient-to))" }}
                >
                  <span>Register Roster</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onExploreEvents}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900/70 text-gray-200 font-bold rounded-xl border border-slate-600/50 hover:border-[var(--theme-accent-border)] hover:text-white transition-all flex items-center justify-center gap-2 hover:bg-slate-800/90 cursor-pointer"
                >
                  <span>Explore Sports</span>
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--theme-accent)" }} />
                </button>
              </motion.div>

              {/* Forgot Code Shortcut Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="pt-2 text-center lg:text-left"
              >
                <button
                  onClick={() => onTrackStatus?.(true)}
                  className="text-xs font-mono text-gray-500 hover:text-orange-400 transition-all cursor-pointer underline underline-offset-4"
                >
                  Forgot your tracking code? Find it here
                </button>
              </motion.div>
            </div>

            {/* Right: video (if enabled) + countdown */}
            <div className="lg:col-span-5 w-full flex flex-col gap-6 self-start">
              {videoSettings.videoEnabled && videoSettings.videoUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black bg-[#0a0c10]"
                  style={{ aspectRatio: "16/9" }}
                >
                  {isYoutube ? (
                    <iframe
                      src={embedUrl}
                      title="Chakravyuh Event Video"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={videoSettings.videoUrl} controls className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(var(--theme-accent-rgb),0.15)" }} />
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="arena-panel rounded-3xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--theme-accent-bg)] rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -right-9 bottom-2 text-[8rem] leading-none font-black italic text-white/[0.025] pointer-events-none">26</div>

                <div className="flex items-center gap-2 mb-6 justify-center lg:justify-start">
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--theme-accent)" }} />
                  <span className="font-mono text-xs uppercase tracking-widest font-black text-[var(--theme-accent-text)]">BATTLEGROUND COMMENCING IN</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-center">
                  {[
                    { value: timeLeft.days, label: "Days" },
                    { value: timeLeft.hours, label: "Hours" },
                    { value: timeLeft.minutes, label: "Mins" },
                    { value: timeLeft.seconds, label: "Secs" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#070a0f]/90 rounded-2xl border border-white/[0.08] p-3 relative shadow-inner shadow-black/30">
                      <span className="block font-mono text-2xl sm:text-3xl font-extrabold text-white">{String(item.value).padStart(2, "0")}</span>
                      <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mt-1">{item.label}</span>
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--theme-accent-border)] to-transparent" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-[#08090c]/80 rounded-2xl border border-white/[0.04] flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    Roster submissions are audited in real-time. Outstation teams must submit valid NOC certifications. Registration deadline: <strong className="text-white">October 03, 2026</strong>.
                  </span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ 2. ANNOUNCEMENTS ══ */}
      {announcements.length > 0 && (
        <section className="border-y border-white/[0.06] py-3.5 font-mono" style={{ backgroundColor: "rgba(var(--theme-accent-rgb), 0.03)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--theme-accent-bg)] text-[var(--theme-accent-text)] border border-[var(--theme-accent-border)] rounded-lg text-[10px] font-bold uppercase tracking-widest shrink-0 animate-pulse">
              <Megaphone className="w-3.5 h-3.5 animate-bounce" style={{ color: "var(--theme-accent)" }} />
              <span>Broadcasts</span>
            </div>
            <div className="overflow-hidden relative w-full h-6 flex items-center">
              <div className="absolute flex items-center animate-marquee-scroll whitespace-nowrap text-xs text-gray-300 hover:[animation-play-state:paused] cursor-pointer">
                {announcements.map((ann) => (
                  <span key={ann.id} className="mx-8 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--theme-accent)" }} />
                    <strong className="text-white font-bold">{ann.title}</strong>: {ann.message}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}



      {/* ══ 4. LIVE STATS ══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Sports Fields", value: loading ? "..." : events.length, desc: "Active categories", icon: Trophy, color: "from-orange-500 to-amber-600" },
            { label: "Athletes Registered", value: loading ? "..." : totalRegisteredAthletes, desc: "Live players", icon: Users, color: "from-blue-500 to-indigo-600" },
            { label: "Scheduled Fixtures", value: loading ? "..." : schedules.length, desc: "Match timelines", icon: Calendar, color: "from-emerald-500 to-teal-600" },
            { label: "Colleges Competing", value: loading ? "..." : collegesDisplay, desc: "Regional rivalry", icon: MapPin, color: "from-pink-500 to-rose-600" },
          ].map((stat, i) => (
            <div key={i} className="arena-stat-card border border-slate-700/60 p-6 rounded-2xl flex flex-col justify-between hover:border-[var(--theme-accent-border)] transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono font-bold tracking-wider text-gray-500 uppercase">{stat.label}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} text-white opacity-85 group-hover:scale-110 transition-all shadow-md`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl md:text-4xl font-extrabold font-sans text-white block mb-1">{stat.value}</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wide">{stat.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 5. WHY CHAKRAVYUH ══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-800/40">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest mb-2" style={{ color: "var(--theme-accent)" }}>FEATURES & EXCELLENCE</h2>
          <p className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">CHAMPIONSHIP ADVANTAGES</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Institutional Prestige", desc: "Recognized as the primary state-level inter-college sports arena hosted under professional standards.", icon: Award, num: "01" },
            { title: "Dynamic Match Schedules", desc: "Access instant schedule logs, court updates, fixture statuses, and real-time coordinator alerts.", icon: Activity, num: "02" },
            { title: "Transparent Administration", desc: "Real-time registration validation, direct status queries, and team checks integrated through secure systems.", icon: Trophy, num: "03" },
          ].map((item, idx) => (
            <div key={idx} className="bg-gradient-to-b from-[#12151a] to-[#0e1114] border border-gray-800/50 p-8 rounded-2xl relative hover:border-[var(--theme-accent-border)] group transition-all">
              <div className="absolute top-6 right-8 text-4xl font-extrabold text-gray-800/20 font-mono group-hover:opacity-10 transition-all select-none">{item.num}</div>
              <div className="p-3 bg-gray-800/50 rounded-2xl w-fit mb-6 border border-gray-700/40" style={{ color: "var(--theme-accent)" }}>
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-white mb-3 group-hover:text-[var(--theme-accent-text)] transition-all">{item.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
