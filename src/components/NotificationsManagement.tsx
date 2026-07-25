import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { Announcement } from "../types";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  X, 
  AlertTriangle, 
  Info, 
  Flame, 
  Calendar,
  CheckCircle,
  Eye,
  BellRing
} from "lucide-react";

export default function NotificationsManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<'urgent' | 'alert' | 'info'>("info");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setIsLoading(true);
    try {
      const data = await dbService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("info");
    setExpiresAt("");
    setIsActive(true);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !expiresAt) {
      alert("Please enter title, message, and expiry date.");
      return;
    }

    const payload = {
      title,
      message,
      type,
      expiresAt: new Date(expiresAt).toISOString(),
      isActive
    };

    try {
      await dbService.saveAnnouncement(payload);
      resetForm();
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      alert("Failed to save announcement.");
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this announcement broadcast?")) {
      try {
        await dbService.deleteAnnouncement(id);
        loadAnnouncements();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleActive = async (item: Announcement) => {
    try {
      await dbService.saveAnnouncement({
        ...item,
        isActive: !item.isActive
      });
      loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const getUrgencyStyles = (uType: 'urgent' | 'alert' | 'info') => {
    switch (uType) {
      case "urgent":
        return {
          border: "border-red-500/20",
          bg: "bg-red-500/5",
          badge: "bg-red-500/10 border-red-500/30 text-red-400",
          icon: <Flame className="w-4 h-4 text-red-400" />
        };
      case "alert":
        return {
          border: "border-amber-500/20",
          bg: "bg-amber-500/5",
          badge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />
        };
      case "info":
      default:
        return {
          border: "border-blue-500/20",
          bg: "bg-blue-500/5",
          badge: "bg-blue-500/10 border-blue-500/30 text-blue-400",
          icon: <Info className="w-4 h-4 text-blue-400" />
        };
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Synchronizing broadcasts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Call to Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">Announcements & Notifications</h2>
          <p className="text-xs text-gray-500 mt-1">Broadcast urgent notices, registration updates, or live event delays.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create Announcement</span>
          </button>
        )}
      </div>

      {/* Editor Block */}
      {showForm && (
        <div className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono flex items-center gap-2">
              <Megaphone className="w-4 h-4 animate-bounce" />
              <span>Broadcast New Notice</span>
            </h3>
            <button onClick={resetForm} className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Title */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Badminton Venue Shifted or Registrations Deadline Extended!"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Urgency Type */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Urgency / Severity</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="info">Information (Blue)</option>
                  <option value="alert">Alert Notice (Amber)</option>
                  <option value="urgent">Urgent / Critical (Red)</option>
                </select>
              </div>

            </div>

            {/* Notice Message */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Notice Message Content *</label>
              <textarea
                required
                rows={3}
                placeholder="Write message details for public home page tickers..."
                className="w-full px-4 py-3 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Expiry Date */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Expiration Date *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              {/* Toggle isActive */}
              <div className="flex items-center gap-3 md:pt-8">
                <input
                  type="checkbox"
                  id="notifIsActive"
                  className="w-4 h-4 bg-[#0d0f12] border-gray-800 focus:ring-0 checked:bg-orange-500 rounded cursor-pointer accent-orange-500"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="notifIsActive" className="text-xs font-bold text-gray-300 font-mono cursor-pointer">
                  Publish Broadcast Immediately (Active)
                </label>
              </div>

            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Launch Notice
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

      {/* Announcements list layout */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-12 text-center bg-[#12141a] border border-gray-800 rounded-2xl">
            <BellRing className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-xs text-gray-500 italic font-mono">No active announcement bulletins published.</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const styles = getUrgencyStyles(ann.type);
            return (
              <div key={ann.id} className={`p-5 bg-[#12141a] border ${styles.border} ${styles.bg} rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-700`}>
                
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl border ${styles.badge} hidden sm:block`}>
                    {styles.icon}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full border ${styles.badge}`}>
                        {ann.type}
                      </span>
                      <span className={`text-[9px] font-bold font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                        ann.isActive 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-gray-800 border-gray-700 text-gray-500"
                      }`}>
                        {ann.isActive ? "broadcast active" : "paused"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-100 font-mono">{ann.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-sans">{ann.message}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-500 font-mono pt-1.5">
                      <p>📅 Created: {new Date(ann.createdAt).toLocaleString()}</p>
                      <p className="hidden sm:block">•</p>
                      <p>⏳ Expires: {new Date(ann.expiresAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 justify-end md:self-center">
                  <button
                    onClick={() => handleToggleActive(ann)}
                    className="px-3 py-1.5 bg-[#0d0f12] hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-[10px] font-semibold font-mono transition-all"
                  >
                    {ann.isActive ? "Pause Broadcast" : "Resume Broadcast"}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(ann.id)}
                    className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl border border-transparent hover:border-red-500/20 transition-all"
                    title="Delete notice permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
