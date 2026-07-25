import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { ScheduleItem } from "../types";
import { Search, Calendar, MapPin, Clock, Trophy, RefreshCw, AlertCircle, Play } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../lib/ThemeContext";

export default function PublicSchedule() {
  const { isWhiteBg } = useTheme();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const list = await dbService.getSchedules();
      setSchedules(list);
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const days = [
    { num: 1, label: "Day 1 (Oct 10)" },
    { num: 2, label: "Day 2 (Oct 11)" },
  ];

  // Filtering
  const filteredSchedules = schedules.filter((item) => {
    const matchesDay = item.day === selectedDay;
    const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDay && matchesQuery;
  });

  // Sort by time/id
  const sortedSchedules = [...filteredSchedules].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  // Render Status Badge
  const renderStatusBadge = (status: ScheduleItem["status"]) => {
    switch (status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-black bg-red-600/10 text-red-500 border border-red-500/20 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            🔴 LIVE NOW
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold bg-green-500/10 text-green-500 border border-green-500/20 rounded-full">
            ✓ COMPLETED
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-medium bg-white/5 text-gray-500 border border-white/5 rounded-full line-through">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
            UPCOMING
          </span>
        );
    }
  };

  return (
    <div className={`bg-transparent py-12 md:py-16 min-h-screen ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <span className="font-mono text-xs text-orange-500 uppercase tracking-widest font-bold block">
              Match Center
            </span>
            <h1 className={`text-3xl md:text-5xl font-mono font-extrabold tracking-tight uppercase leading-none ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
              LIVE <span className="text-orange-500">SCHEDULE</span>
            </h1>
            <p className={`text-xs md:text-sm max-w-md font-sans mt-2 ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>
              Stay updated with active fixtures, court/field allocations, daily results, and live matches.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search match / squad..."
                className={`w-full border rounded-xl px-4 py-2.5 pl-10 text-xs placeholder-gray-500 focus:outline-none focus:border-orange-500/50 ${isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#0f1115] border-white/10 text-white'}`}
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Refresh CTA */}
            <button
              onClick={loadSchedules}
              className={`p-2.5 rounded-xl border transition-colors ${isWhiteBg ? 'bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-500 border-gray-300' : 'bg-[#0f1115] hover:bg-orange-500/5 text-gray-400 hover:text-orange-500 border-white/5'}`}
              title="Sync Schedule"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day selection tabs */}
        <div className={`grid grid-cols-2 gap-3 border-b pb-5 ${isWhiteBg ? 'border-gray-200' : 'border-white/[0.05]'}`}>
          {days.map((day) => (
            <button
              key={day.num}
              onClick={() => setSelectedDay(day.num)}
              className={`py-4 rounded-2xl font-mono text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                selectedDay === day.num
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-[#07080a] font-black border-orange-500 shadow-lg shadow-orange-500/20"
                  : isWhiteBg
                    ? "text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:text-gray-900"
                    : "text-gray-400 bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.04] hover:text-white"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Schedule List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-gray-950/40 border border-white/[0.05] rounded-3xl h-28 animate-pulse" />
            ))}
          </div>
        ) : sortedSchedules.length === 0 ? (
          <div className={`rounded-3xl p-12 text-center max-w-sm mx-auto shadow-xl border ${isWhiteBg ? 'bg-white border-gray-300' : 'glass-panel border-white/[0.05]'}`}>
            <Trophy className={`w-12 h-12 mx-auto mb-4 ${isWhiteBg ? 'text-gray-400' : 'text-gray-700'}`} />
            <span className={`block font-mono text-xs uppercase tracking-widest font-bold ${isWhiteBg ? 'text-gray-900' : 'text-gray-300'}`}>No Matches Scheduled</span>
            <span className={`block text-[11px] mt-2 font-sans leading-normal ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>
              There are no matches scheduled matching this day or search criteria.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSchedules.map((match) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={match.id}
                className={`rounded-3xl p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-lg border ${isWhiteBg ? 'bg-white border-gray-300' : 'glass-panel hover:glass-panel-glow border-white/[0.05]'}`}
              >
                {/* Decorative accent for live ones */}
                {match.status === "live" && (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500 animate-pulse" />
                )}

                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-lg font-mono text-[9px] font-bold bg-[#07080a] text-gray-400 uppercase border border-white/[0.05]">
                      Day {match.day} Match
                    </span>
                    {renderStatusBadge(match.status)}
                  </div>

                  <h3 className={`font-mono text-sm md:text-base font-bold tracking-wide uppercase ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                    {match.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      {match.timeSlot}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      {match.venue}
                    </span>
                  </div>
                </div>

                {/* Micro Action Button for match detail or status */}
                {match.status === "live" && (
                  <div className="flex items-center justify-start md:justify-end">
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-2xl text-[10px] text-red-500 font-mono uppercase font-bold tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Match In Progress
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
