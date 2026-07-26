import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { ScheduleItem, AdminUser } from "../types";
import { canManageSchedulesFully } from "../lib/permissions";
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  X, 
  Play, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  AlertCircle 
} from "lucide-react";

export default function SchedulesManagement({ user }: { user: AdminUser }) {
  const fullAccess = canManageSchedulesFully(user);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [day, setDay] = useState(1);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [venue, setVenue] = useState("");
  const [status, setStatus] = useState<'scheduled' | 'live' | 'completed' | 'cancelled'>("scheduled");

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    setIsLoading(true);
    try {
      const data = await dbService.getSchedules();
      setSchedules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setDay(1);
    setDate("");
    setTitle("");
    setTimeSlot("");
    setVenue("");
    setStatus("scheduled");
    setIsEditing(false);
    setEditId(null);
  };

  const handleEditClick = (item: ScheduleItem) => {
    setIsEditing(true);
    setEditId(item.id);
    setDay(item.day);
    // Format date string to match YYYY-MM-DD input field
    try {
      const dStr = new Date(item.date).toISOString().slice(0, 10);
      setDate(dStr);
    } catch {
      setDate("");
    }
    setTitle(item.title);
    setTimeSlot(item.timeSlot);
    setVenue(item.venue);
    setStatus(item.status);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !timeSlot || !venue || !date) {
      alert("Please fill in all match schedule details.");
      return;
    }

    const payload = {
      day: Number(day),
      date: new Date(date).toISOString(),
      title,
      timeSlot,
      venue,
      status
    };

    try {
      if (isEditing && editId) {
        await dbService.saveScheduleItem({ ...payload, id: editId });
      } else {
        await dbService.saveScheduleItem(payload);
      }
      await dbService.logActivity({
        actorUid: user.uid,
        actorName: user.displayName,
        actorRole: user.role,
        action: "schedule_updated",
        targetType: "schedule",
        targetId: editId || title,
        summary: `${editId ? "Updated" : "Created"} schedule: ${title}`,
      });
      resetForm();
      loadSchedules();
    } catch (err) {
      console.error(err);
      alert("Failed to save schedule.");
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this scheduled match fixture?")) {
      try {
        await dbService.deleteScheduleItem(id);
        await dbService.logActivity({
          actorUid: user.uid,
          actorName: user.displayName,
          actorRole: user.role,
          action: "schedule_deleted",
          targetType: "schedule",
          targetId: id,
          summary: `Deleted schedule ${id}`,
        });
        loadSchedules();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleQuickStatusChange = async (item: ScheduleItem, nextStatus: 'scheduled' | 'live' | 'completed' | 'cancelled') => {
    try {
      await dbService.saveScheduleItem({
        ...item,
        status: nextStatus
      });
      await dbService.logActivity({
        actorUid: user.uid,
        actorName: user.displayName,
        actorRole: user.role,
        action: "schedule_updated",
        targetType: "schedule",
        targetId: item.id,
        summary: `Match status → ${nextStatus}: ${item.title}`,
      });
      loadSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Loading match schedules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Call to Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">Match Schedules & Fixtures</h2>
          <p className="text-xs text-gray-500 mt-1">
            {fullAccess
              ? "Publish daily event times, bracket updates, and live statuses."
              : "View fixtures and update live match status (scores / completion)."}
          </p>
        </div>
        {fullAccess && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Match</span>
          </button>
        )}
      </div>

      {/* Editor Block */}
      {isEditing && (
        <div className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono">
              {editId ? "Update Match Fixture Details" : "Create New Match Fixture"}
            </h3>
            <button onClick={resetForm} className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Match Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cricket QF - CSE vs IT"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Day */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Festival Day</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Date *</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Time slot */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Time Slot *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 09:30 AM - 11:30 AM"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                />
              </div>

              {/* Venue */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Match Venue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Main Football Ground"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Fixture Status</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">In Progress / LIVE</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Save Fixture
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((match) => (
          <div key={match.id} className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl flex flex-col justify-between group hover:border-gray-700 transition-all">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
                    Day {match.day}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    {new Date(match.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`
                    text-[9px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full border
                    ${match.status === "live" ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" : ""}
                    ${match.status === "scheduled" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : ""}
                    ${match.status === "completed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""}
                    ${match.status === "cancelled" ? "bg-gray-800 border-gray-700 text-gray-500" : ""}
                  `}>
                    {match.status === "live" ? "🔴 live" : match.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-100 font-mono group-hover:text-orange-500 transition-colors">
                  {match.title}
                </h4>
                <div className="flex flex-col gap-1.5 mt-3 text-[11px] text-gray-400 font-mono">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-600" />
                    <span>Time: {match.timeSlot}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-600" />
                    <span>Venue: {match.venue}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Admin match control overlay quick status toggler */}
            <div className="border-t border-gray-800/60 pt-3 mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleQuickStatusChange(match, "live")}
                  className={`px-2 py-1 text-[9px] font-mono font-bold rounded-md border transition-all ${match.status === "live" ? "bg-red-500 text-white" : "bg-transparent text-gray-500 hover:text-white border-gray-800 hover:border-gray-700"}`}
                >
                  Go Live
                </button>
                <button
                  onClick={() => handleQuickStatusChange(match, "completed")}
                  className={`px-2 py-1 text-[9px] font-mono font-bold rounded-md border transition-all ${match.status === "completed" ? "bg-emerald-500 text-white" : "bg-transparent text-gray-500 hover:text-white border-gray-800 hover:border-gray-700"}`}
                >
                  End Match
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEditClick(match)}
                  className="p-1.5 hover:bg-orange-500/10 text-gray-500 hover:text-orange-400 rounded-lg transition-all"
                  title="Edit schedule details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(match.id)}
                  className="p-1.5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-lg transition-all"
                  title="Remove scheduled fixture"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
