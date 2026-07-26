import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { SportEvent, Registration, ScheduleItem, Announcement, AdminUser } from "../types";
import {
  filterEventsByUserScope,
  getRegistrationEventFilter,
} from "../lib/permissions";
import { 
  Users, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Flame,
  Calendar,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

interface DashboardOverviewProps {
  user: AdminUser;
  onNavigate: (tabId: string) => void;
  onUpdateUser?: (updatedUser: AdminUser) => Promise<void> | void;
}

export default function DashboardOverview({ user, onNavigate, onUpdateUser }: DashboardOverviewProps) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.displayName);

  useEffect(() => {
    setNewName(user.displayName);
  }, [user.displayName]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    try {
      if (onUpdateUser) {
        await onUpdateUser({
          ...user,
          displayName: newName.trim()
        });
      }
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update name.");
    }
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const evs = await dbService.getEvents();
        const scopedEvents = filterEventsByUserScope(user, evs);
        const authorizedEventIds = getRegistrationEventFilter(user, evs);
        const [regs, scheds, announs] = await Promise.all([
          dbService.getRegistrations(authorizedEventIds),
          dbService.getSchedules(),
          dbService.getAnnouncements()
        ]);

        if (user.role === "coordinator" || user.role === "admin") {
          const authEventIds = scopedEvents.map((e) => e.id);
          setEvents(scopedEvents);
          setRegistrations(regs.filter((r) => authEventIds.includes(r.eventId)));
          setSchedules(user.role === "coordinator" ? scheds : scheds);
        } else {
          setEvents(evs);
          setRegistrations(regs);
          setSchedules(scheds);
        }
        setAnnouncements(announs);
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Assembling live statistics...</span>
        </div>
      </div>
    );
  }

  // Calculate high-performance key stats
  const totalRegistrationsCount = registrations.length;
  const approvedRegistrationsCount = registrations.filter(r => r.status === "approved").length;
  const pendingRegistrationsCount = registrations.filter(r => r.status === "pending").length;
  const rejectedRegistrationsCount = registrations.filter(r => r.status === "rejected").length;

  // Calculate actual participant count (including team members)
  const totalParticipantsCount = registrations.reduce((acc, reg) => {
    if (reg.status !== "approved") return acc;
    const teamSize = reg.members ? reg.members.length + 1 : 1;
    return acc + teamSize;
  }, 0);

  // Split registrations by categories (Indoor / Outdoor / Athletics)
  const sportDistribution = events.reduce((acc: { [key: string]: number }, event) => {
    const regCount = registrations.filter(r => r.eventId === event.id).length;
    acc[event.title] = (acc[event.title] || 0) + regCount;
    return acc;
  }, {});

  const distributionEntries = Object.entries(sportDistribution);
  const maxRegsValue = Math.max(...distributionEntries.map(([_, count]) => Number(count)), 1);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#11141b] border border-gray-800/60 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[20%] h-[50%] rounded-full bg-orange-500/5 blur-[50px]"></div>
        <div>
          <div className="flex items-center gap-1.5 text-orange-500 text-xs font-bold font-mono mb-1">
            <Flame className="w-4 h-4 animate-pulse" />
            <span>CHAKRAVYUH ADMIN CONSOLE</span>
          </div>
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  className="px-3 py-1 bg-[#0d0f12] border border-orange-500/40 focus:border-orange-500 rounded-lg text-sm text-white font-mono outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setNewName(user.displayName); }}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h2 className="text-2xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2">
                Welcome back, <span className="text-orange-500">{user.displayName}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Edit Name"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
              </h2>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {user.role === "super_admin"
              ? "You have complete administrative superuser privileges over events, coordinators, and registrations."
              : user.role === "admin"
              ? "Middle-tier admin — manage coordinators, registrations, schedules, and content within your assigned sport scope."
              : "You are logged in as Coordinator. Your access is locked to authorized event metrics."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#181d26] border border-gray-800 rounded-xl px-4 py-2.5 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">System Status</p>
            <div className="flex items-center gap-1.5 justify-center mt-1 text-xs font-semibold text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE INTEGRITY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-gray-500 uppercase font-bold">Total Registrations</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {totalRegistrationsCount}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <span className="text-blue-400 font-semibold">Active Entries</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-gray-500 uppercase font-bold">Approved Teams</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {approvedRegistrationsCount}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              <span className="text-emerald-400 font-semibold">{totalParticipantsCount}</span> approved athletes
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-gray-500 uppercase font-bold">Pending Approval</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {pendingRegistrationsCount}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              {pendingRegistrationsCount > 0 ? (
                <span className="text-amber-400 font-bold animate-pulse">Action required</span>
              ) : (
                <span className="text-gray-500">Inbox fully cleared</span>
              )}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-gray-500 uppercase font-bold">Active Sports</span>
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {events.length}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              Across Indoor & Outdoor
            </p>
          </div>
        </div>

      </div>

      {/* Visual Analytics Sections (Custom CSS-SVG charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Registration Distribution by Sport Chart */}
        <div className="bg-[#12141a] border border-gray-800/80 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 font-mono">Registration Breakdown</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Distribution of registration applications across active sports events</p>
            </div>
            <span className="text-[10px] font-mono text-orange-500 bg-orange-500/5 px-2.5 py-1 rounded-full border border-orange-500/10">
              Live Chart
            </span>
          </div>

          <div className="space-y-4">
            {distributionEntries.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-6 text-center font-mono">No active registration distribution yet.</p>
            ) : (
              distributionEntries.map(([sportTitle, count]) => {
                const countNum = Number(count);
                const percentage = (countNum / maxRegsValue) * 100;
                return (
                  <div key={sportTitle} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-200">{sportTitle}</span>
                      <span className="font-mono text-gray-400 font-bold">{countNum} Teams</span>
                    </div>
                    <div className="w-full bg-[#181a20] rounded-full h-2.5 overflow-hidden border border-gray-800">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className="bg-gradient-to-r from-orange-500 to-amber-600 h-full rounded-full transition-all duration-1000"
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live System Log and Quick Links */}
        <div className="bg-[#12141a] border border-gray-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 font-mono">Quick Actions</h3>
              <Sparkles className="w-4 h-4 text-orange-500" />
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={() => onNavigate("registrations")}
                className="w-full p-3 bg-[#171a22] hover:bg-orange-500/10 border border-gray-800/80 hover:border-orange-500/20 rounded-xl transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-orange-500 transition-colors">Review Pending Registrations</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Audit student forms, approve status and trigger codes.</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-orange-500 transition-all" />
              </button>

              {user.role === "super_admin" && (
                <button 
                  onClick={() => onNavigate("events")}
                  className="w-full p-3 bg-[#171a22] hover:bg-orange-500/10 border border-gray-800/80 hover:border-orange-500/20 rounded-xl transition-all text-left flex items-center justify-between group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 group-hover:text-orange-500 transition-colors">Create New Sport Category</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Publish a new individual or team game fixture.</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-orange-500 transition-all" />
                </button>
              )}

              <button 
                onClick={() => onNavigate("schedules")}
                className="w-full p-3 bg-[#171a22] hover:bg-orange-500/10 border border-gray-800/80 hover:border-orange-500/20 rounded-xl transition-all text-left flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-200 group-hover:text-orange-500 transition-colors">Modify Match Schedules</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Post-match results or live update venues.</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-orange-500 transition-all" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800/60 pt-4 mt-4">
            <h4 className="text-[10px] uppercase font-mono text-gray-500 font-bold mb-2">Live Announcement Feed</h4>
            {announcements.slice(0, 1).map(ann => (
              <div key={ann.id} className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                <span className="text-[8px] uppercase tracking-wider font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full font-bold">
                  {ann.type}
                </span>
                <h5 className="text-xs font-bold text-gray-200 mt-1.5">{ann.title}</h5>
                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{ann.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Upcoming Matches Quick View panel */}
      <div className="bg-[#12141a] border border-gray-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-300 font-mono">Today's Match Schedules</h3>
          </div>
          <button 
            onClick={() => onNavigate("schedules")}
            className="text-xs text-orange-500 hover:underline font-semibold"
          >
            Manage Fixtures
          </button>
        </div>

        {schedules.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-4 text-center font-mono">No sports fixtures currently scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.slice(0, 3).map(match => (
              <div key={match.id} className="p-4 bg-[#181a21] border border-gray-800/80 rounded-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">
                      Day {match.day}
                    </span>
                    <span className={`
                      text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full border
                      ${match.status === "live" ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : ""}
                      ${match.status === "scheduled" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : ""}
                      ${match.status === "completed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""}
                    `}>
                      {match.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-100">{match.title}</h4>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-800/40 text-[10px] text-gray-500 font-mono space-y-1">
                  <p>⏰ {match.timeSlot}</p>
                  <p>📍 {match.venue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
