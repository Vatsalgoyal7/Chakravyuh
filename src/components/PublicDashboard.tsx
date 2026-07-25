import React, { useState, useEffect } from "react";
import { Search, Info, ShieldAlert, CheckCircle2, AlertCircle, XCircle, Clock, Volume2, Calendar } from "lucide-react";
import { dbService } from "../lib/dbService";
import { Announcement, PublicRegistrationStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";

export default function PublicDashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<PublicRegistrationStatus | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch announcements
  useEffect(() => {
    async function loadData() {
      try {
        const notices = await dbService.getAnnouncements();
        // filter active ones
        setAnnouncements(notices.filter(n => n.isActive));
      } catch (err) {
        console.error("Failed to load announcements for public portal", err);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    }
    loadData();
  }, []);

  // Handle registration search lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      setSearchResult(await dbService.getPublicRegistrationStatus(searchQuery));
    } catch (err) {
      console.error("Search query failed:", err);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: PublicRegistrationStatus["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            APPROVED
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="bg-[#07080a] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Ticker / Announcement Bar */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-center gap-3.5 overflow-hidden relative">
          <div className="flex items-center gap-2 bg-orange-600 text-[#07080a] font-mono text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md flex-shrink-0">
            <Volume2 className="w-3.5 h-3.5 stroke-[2.5] animate-bounce" />
            <span>Live Bulletin</span>
          </div>
          <div className="text-xs font-mono text-orange-400 font-medium truncate flex-1">
            {announcements.length > 0 
              ? `🔥 LATEST NEWS: ${announcements[0].title} — ${announcements[0].message}`
              : "⏳ Stay tuned for live brackets, announcements, and scheduling changes."}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Live Bulletins & Alerts */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-mono font-extrabold text-white tracking-tight uppercase">
                Announcements & <span className="text-orange-500">Alerts</span>
              </h2>
              <p className="text-gray-500 text-xs font-sans mt-1">
                Official updates, bracket releases, and schedule adjustments published by the committee.
              </p>
            </div>

            {isLoadingAnnouncements ? (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="bg-[#0f1115] border border-white/5 rounded-xl h-24 animate-pulse" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                <Info className="w-10 h-10 text-gray-600 mb-3" />
                <span className="block font-mono text-xs text-gray-400 uppercase tracking-wider">No active announcements</span>
                <span className="block text-gray-600 text-xs mt-1">All systems operating within normal parameters.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((notif) => {
                  const isUrgent = notif.type === "urgent";
                  const isAlert = notif.type === "alert";
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={notif.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isUrgent 
                          ? "bg-red-500/5 border-red-500/10 hover:border-red-500/20" 
                          : isAlert 
                          ? "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20"
                          : "bg-[#0f1115] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isUrgent && (
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-red-500/10 text-red-500 uppercase tracking-widest border border-red-500/20">
                                URGENT
                              </span>
                            )}
                            {isAlert && (
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/20">
                                ALERT
                              </span>
                            )}
                            <h3 className="font-mono text-sm font-bold text-white group-hover:text-orange-500">
                              {notif.title}
                            </h3>
                          </div>
                          <p className="text-gray-400 text-xs leading-relaxed font-sans mt-2">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          Published: {new Date(notif.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Live Roster Registration Tracker */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-mono font-extrabold text-white tracking-tight uppercase">
                Roster <span className="text-orange-500">Inquiry Tracker</span>
              </h2>
              <p className="text-gray-500 text-xs font-sans mt-1">
                Verify if your registration has been approved by our central review committee.
              </p>
            </div>

            <div className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl shadow-black/40">
              <form onSubmit={handleLookup} className="space-y-3">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                  Enter Registration Tracking Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. CHK-A1B2C3D4E5F6"
                    className="w-full bg-[#07080a] border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 font-mono tracking-wide"
                  />
                  <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full py-3 bg-white/5 hover:bg-orange-500 hover:text-[#07080a] text-white rounded-xl font-mono font-bold text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-orange-500 flex items-center justify-center gap-2"
                >
                  {isSearching ? "Searching Records..." : "Query Status"}
                </button>
              </form>

              {/* Inquiry Search Results */}
              <AnimatePresence mode="wait">
                {hasSearched && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-white/5 space-y-4"
                  >
                    {!searchResult ? (
                      <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl text-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1.5" />
                        <span className="block font-mono text-[11px] text-red-400 uppercase tracking-widest font-bold">
                          No Record Located
                        </span>
                        <span className="block text-gray-500 text-[10px] mt-1">
                          Enter the tracking code from your registration confirmation.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <span className="block font-mono text-[10px] text-orange-500 uppercase tracking-widest font-bold">
                          Registration Located
                        </span>
                        {(() => { const reg = searchResult; return (
                          <div 
                            key={reg.trackingCode} 
                            className="bg-[#07080a] border border-white/5 p-4 rounded-xl space-y-3.5 hover:border-white/10 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
                              <div>
                                <h4 className="font-mono text-xs font-bold text-white uppercase">
                                  {reg.eventTitle}
                                </h4>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  Tracking code: {reg.trackingCode}
                                </span>
                              </div>
                              {renderStatusBadge(reg.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-sans text-gray-400">
                              <div>
                                <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Registration date</span>
                                <span className="text-white font-medium">{new Date(reg.registeredAt).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 block">Team/Sport Type</span>
                                <span className="text-white font-medium capitalize">
                                  {reg.sportType === "team" ? `Team (${reg.teamName})` : "Individual"}
                                </span>
                              </div>
                            </div>

                            {reg.checkedIn && <div className="text-emerald-400 text-[10px] font-mono uppercase">Checked in at venue</div>}
                          </div>
                        ); })()}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
