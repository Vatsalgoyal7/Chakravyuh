import React, { useState, useEffect } from "react";
import { Trophy, Calendar, MapPin, Zap, Users, Flame, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface PublicHeroProps {
  onRegisterClick: () => void;
  onExploreClick: () => void;
}

export default function PublicHero({ onRegisterClick, onExploreClick }: PublicHeroProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date("2026-10-10T09:00:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

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

  const stats = [
    { value: "15+", label: "Top Colleges", icon: Users },
    { value: "12+", label: "Sports Events", icon: Trophy },
    { value: "2,000+", label: "Athletes", icon: Flame },
    { value: "₹1,00,000+", label: "Cash Prizes", icon: Zap },
  ];

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between overflow-hidden bg-[#07080a] py-12 md:py-20 border-b border-white/5">
      {/* Background Graphic Lines & Ambient Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,88,12,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.05),transparent_40%)] pointer-events-none" />
      
      {/* Faint Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Headline Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-500 font-mono text-[10px] uppercase tracking-widest font-semibold"
            >
              <Flame className="w-3.5 h-3.5 animate-pulse text-orange-500" />
              <span>The Gladiator Battleground is Calling</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-mono font-extrabold tracking-tight text-white leading-[0.95]"
            >
              CHAKRAVYUH <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400">
                2K26
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-gray-400 font-sans max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-relaxed"
            >
              IMSEC Engineering College proudly presents the ultimate Inter-College Sports Festival. 
              Bring your champion squad, breach the rings of defense, and engrave your name 
              on the glorious halls of athletic eternity.
            </motion.p>

            {/* Quick Event Logistics Metadata */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-mono text-gray-300"
            >
              <div className="flex items-center gap-1.5 bg-[#0f1115] px-3.5 py-2 rounded-lg border border-white/5">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span>October 10 - 11, 2026</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0f1115] px-3.5 py-2 rounded-lg border border-white/5">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>IMSEC Engineering College, NH-24, Ghaziabad</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button 
                onClick={onRegisterClick}
                className="px-8 py-4 font-mono font-bold uppercase text-xs tracking-widest text-[#07080a] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 rounded shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:scale-102"
              >
                Register Roster
              </button>
              <button 
                onClick={onExploreClick}
                className="px-8 py-4 font-mono font-medium uppercase text-xs tracking-widest text-white border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 rounded transition-all"
              >
                Browse Sports
              </button>
            </motion.div>
          </div>

          {/* Hero Countdown Panel */}
          <div className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#0f1115] border border-orange-500/10 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-black"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <span className="font-mono text-xs uppercase tracking-widest font-semibold text-orange-500">
                  Arena Commencing In
                </span>
              </div>

              {/* Countdown Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Mins" },
                  { value: timeLeft.seconds, label: "Secs" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#07080a] rounded-xl border border-white/5 p-3 md:p-4 relative">
                    <span className="block font-mono text-xl sm:text-3xl font-extrabold text-white">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                      {item.label}
                    </span>
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                  </div>
                ))}
              </div>

              {/* Deadline Warn */}
              <div className="mt-6 p-3 bg-white/2 rounded-lg border border-white/5 text-center flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-[11px] font-sans text-gray-400">
                  Registration closes strictly on <strong className="text-white">Oct 15, 2026</strong>. 
                  Spot entries are strictly prohibited.
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12 md:mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0a0c10] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="text-center p-3 md:p-4 group border-r border-white/5 last:border-0">
                <div className="mx-auto w-10 h-10 rounded-lg bg-orange-500/5 flex items-center justify-center mb-2.5 group-hover:bg-orange-500/10 transition-colors">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <span className="block font-mono text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none">
                  {stat.value}
                </span>
                <span className="block text-[11px] font-sans text-gray-400 mt-1 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
