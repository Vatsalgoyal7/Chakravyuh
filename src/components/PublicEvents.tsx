import React, { useEffect, useState } from "react";
import { 
  Search, 
  MapPin, 
  Users, 
  Calendar, 
  Phone, 
  Mail, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { dbService } from "../lib/dbService";
import { SportEvent } from "../types";

interface PublicEventsProps {
  onRegisterSelect: (eventId: string) => void;
}

export default function PublicEvents({ onRegisterSelect }: PublicEventsProps) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Indoor" | "Outdoor">("All");
  const [expandedRulesId, setExpandedRulesId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const list = await dbService.getEvents();
        // Only show active sports
        setEvents(list.filter(e => e.isActive));
      } catch (err) {
        console.error("Failed to load public events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.rules.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-transparent text-white min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-2">
            ATHLETIC DISCIPLINES
          </h1>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white">
            SPORTS CATALOG
          </h2>
          <p className="text-xs font-mono text-gray-500 max-w-xl mt-2">
            Filter and explore standard tournament details, contact details of student coordinators, and sign up teams instantly.
          </p>
        </div>

        {/* Toolbar (Search & Filter) */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 pb-6 border-b border-gray-800/40">
          
          {/* Category tabs */}
          <div className="flex gap-2 p-1 bg-gray-900/60 rounded-xl border border-gray-800 font-mono text-xs w-full md:w-auto">
            {["All", "Indoor", "Outdoor"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat as any)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold transition-all ${
                  categoryFilter === cat
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/15"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-md font-mono text-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sports, venues, or rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#12151a] border border-gray-800 rounded-xl focus:border-orange-500 focus:outline-none placeholder-gray-600 text-white transition-all"
            />
          </div>

        </div>

        {/* List Content */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <span>Fetching sports databases...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-[#12151a] border border-gray-800/50 rounded-2xl p-8 font-mono">
            <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-xs text-gray-400">No sports disciplines matched your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const isClosed = new Date(ev.registrationDeadline).getTime() < Date.now();
              const isFull = (ev.registrationCount || 0) >= (ev.maxRegistrations || 32);
              const isExpanded = expandedRulesId === ev.id;
              
              // Progress percent
              const spotsPercent = Math.min(
                100,
                Math.round(((ev.registrationCount || 0) / (ev.maxRegistrations || 32)) * 100)
              );

              return (
                <div
                  key={ev.id}
                  className="glass-panel hover:glass-panel-glow rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group h-full shadow-lg hover:shadow-orange-500/[0.02]"
                >
                  
                  {/* Card Image */}
                  <div className="h-48 w-full relative overflow-hidden bg-gray-950 shrink-0">
                    <img
                      src={ev.image || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800"}
                      alt={ev.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Floating category badges */}
                    <div className="absolute top-4 left-4 flex gap-2 font-mono text-[9px] font-bold uppercase tracking-wider">
                      <span className="px-2.5 py-1 bg-[#0a0b0d]/80 backdrop-blur-md text-orange-400 rounded-lg border border-orange-500/20">
                        {ev.category}
                      </span>
                      <span className="px-2.5 py-1 bg-[#0a0b0d]/80 backdrop-blur-md text-teal-400 rounded-lg border border-teal-500/20">
                        {ev.type}
                      </span>
                    </div>

                    {/* Deadline warnings */}
                    {isClosed && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-xs">
                        <span className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black font-mono tracking-widest uppercase rounded-xl border border-rose-500/50 shadow-xl">
                          REGISTRATIONS CLOSED
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      {/* Title */}
                      <h3 className="text-lg font-extrabold uppercase tracking-tight text-white mb-2 leading-snug">
                        {ev.title}
                      </h3>

                      {/* Info lines */}
                      <div className="space-y-2.5 text-xs text-gray-400 font-mono mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span>
                            {ev.type === "team" 
                              ? `Team Roster: ${ev.minTeamSize}-${ev.maxTeamSize} players`
                              : "Individual (Single Player)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>Deadline: {formatDate(ev.registrationDeadline)}</span>
                        </div>
                      </div>

                      {/* Spots Progress Bar */}
                      <div className="font-mono text-[10px] mb-4 bg-gray-950/60 p-3.5 rounded-2xl border border-white/[0.04]">
                        <div className="flex justify-between text-gray-400 mb-1.5">
                          <span>Registrations Filled</span>
                          <span className="font-bold text-white">
                            {ev.registrationCount} / {ev.maxRegistrations} Slots
                          </span>
                        </div>
                        <div className="w-full bg-[#0d0f12] h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r transition-all duration-500 ${
                              spotsPercent >= 85 
                                ? "from-rose-600 to-red-500 animate-pulse" 
                                : spotsPercent >= 60 
                                  ? "from-amber-500 to-orange-500" 
                                  : "from-orange-500 to-yellow-400"
                            }`}
                            style={{ width: `${spotsPercent}%` }}
                          />
                        </div>
                        {spotsPercent >= 85 && !isClosed && !isFull && (
                          <span className="block text-[8px] text-rose-500 font-bold uppercase tracking-wider mt-1.5 text-right animate-pulse">
                            ⚠️ Slots filling fast! Book immediately
                          </span>
                        )}
                      </div>

                      {/* Rules Dropdown block */}
                      <div className="border border-white/[0.05] rounded-2xl mb-4 overflow-hidden">
                        <button
                          onClick={() => setExpandedRulesId(isExpanded ? null : ev.id)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-950/40 text-[11px] font-mono font-bold text-gray-400 hover:text-white transition-all outline-none"
                        >
                          <span className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                            Rules & Conduct Guidelines
                          </span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        
                        {isExpanded && (
                          <div className="p-3.5 bg-gray-950/80 text-[10px] font-mono text-gray-400 border-t border-white/[0.05] whitespace-pre-line leading-relaxed">
                            {ev.rules || "No special rules declared. Standard sports guidelines apply."}
                          </div>
                        )}
                      </div>

                      {/* Coordinators subblock */}
                      {ev.coordinators && ev.coordinators.length > 0 && (
                        <div className="bg-[#0c0d10]/40 rounded-2xl p-3.5 border border-white/[0.04] mb-4 font-mono">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Student Coordinators
                          </span>
                          <div className="space-y-2.5">
                            {ev.coordinators.map((co, cidx) => (
                              <div key={cidx} className="text-[10px] border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                                <div className="text-white font-bold mb-1">{co.name}</div>
                                <div className="flex justify-between text-gray-500 gap-1.5">
                                  <button
                                    onClick={() => handleCopy(co.phone, `${ev.id}_p_${cidx}`)}
                                    className="flex items-center gap-1 hover:text-orange-400 transition-all text-left"
                                  >
                                    <Phone className="w-2.5 h-2.5 text-orange-500 shrink-0" />
                                    <span>{co.phone}</span>
                                    {copiedId === `${ev.id}_p_${cidx}` ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleCopy(co.email, `${ev.id}_e_${cidx}`)}
                                    className="flex items-center gap-1 hover:text-orange-400 transition-all text-left max-w-[130px] truncate"
                                  >
                                    <Mail className="w-2.5 h-2.5 text-orange-500 shrink-0" />
                                    <span className="truncate">{co.email}</span>
                                    {copiedId === `${ev.id}_e_${cidx}` ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Register button */}
                    <button
                      disabled={isClosed || isFull}
                      onClick={() => onRegisterSelect(ev.id)}
                      className={`w-full py-3.5 rounded-2xl text-xs font-bold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isClosed || isFull
                          ? "bg-gray-900 text-gray-500 border border-white/[0.04] cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/10 active:scale-98"
                      }`}
                    >
                      <span>
                        {isClosed 
                          ? "Registrations Closed" 
                          : isFull 
                            ? "Slots Filled" 
                            : "Register Online"}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
