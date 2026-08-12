import React, { useState } from "react";
import { 
  Trophy, 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Image as ImageIcon, 
  Megaphone, 
  BookOpen, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  UserCheck,
  WifiOff, 
  Database,
  Eye,
  Info,
  HelpCircle,
  IndianRupee,
  ScrollText,
  Archive,
  ToggleRight,
  Layers,
  MessageSquare,
  Contact,
  Phone,
  Mail,
  Building2,
  Home,
  Save,
  Edit3,
  Bell,
  BellOff
} from "lucide-react";
import { AdminUser } from "../types";
import { isFirebaseConfigured } from "../lib/firebase";
import { canAccessTab, roleDisplayLabel } from "../lib/permissions";
import { dbService } from "../lib/dbService";

interface AdminLayoutProps {
  user: AdminUser;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  onGoToPublic?: () => void;
  onUpdateUser?: (u: AdminUser) => void;
}

export default function AdminLayout({ 
  user, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  children,
  onGoToPublic,
  onUpdateUser
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── My Profile Modal State ───────────────────────────────────────────────
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Notification preference toggle in profile modal
  const notifKey = `chakravyuh_notif_${user.uid}`;
  const [notifOn, setNotifOn] = useState<boolean>(
    () => localStorage.getItem(notifKey) !== "off"
  );

  // Profile form fields (mirrors Staff Identity Card)
  const [profileName, setProfileName] = useState(user.displayName);
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileRollNo, setProfileRollNo] = useState(user.rollNo || "");
  const [profileBranch, setProfileBranch] = useState(user.branch || "");
  const [profileResidency, setProfileResidency] = useState<'hosteler' | 'day_scholar'>(user.residency || "day_scholar");
  const [profileRoomNo, setProfileRoomNo] = useState(user.roomNo || "");

  const openProfileModal = () => {
    // Reset fields to latest user values every time modal opens
    setProfileName(user.displayName);
    setProfilePhone(user.phone || "");
    setProfileRollNo(user.rollNo || "");
    setProfileBranch(user.branch || "");
    setProfileResidency(user.residency || "day_scholar");
    setProfileRoomNo(user.roomNo || "");
    setIsEditingProfile(false);
    setProfileMsg(null);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated: AdminUser = {
        ...user,
        displayName: profileName.trim() || user.displayName,
        phone: profilePhone.trim() || undefined,
        rollNo: profileRollNo.trim() || undefined,
        branch: profileBranch.trim() || undefined,
        residency: profileResidency,
        roomNo: profileResidency === "hosteler" ? profileRoomNo.trim() || undefined : undefined,
      };
      const saved = await dbService.saveUser(updated);
      if (onUpdateUser) onUpdateUser(saved);
      setProfileMsg("Profile saved and synced to Staff Directory!");
      setIsEditingProfile(false);
    } catch (err) {
      setProfileMsg("Failed to save. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const menuItems = [
    { id: "dashboard",        label: "Dashboard",              icon: LayoutDashboard },
    { id: "chat",             label: "Staff Chat Room",        icon: MessageSquare },
    { id: "revenue",          label: "Revenue Monitor",        icon: IndianRupee },
    { id: "events",           label: "Events Manager",         icon: Trophy },
    { id: "admins",           label: "Admins Manager",         icon: UserCheck },
    { id: "coordinators",     label: "Coordinators Manager",   icon: ShieldCheck },
    { id: "staff_directory",  label: "Staff Directory",        icon: Contact },
    { id: "registrations",    label: "Registrations Control",  icon: Users },
    { id: "schedules",        label: "Match Schedules",        icon: CalendarDays },
    { id: "notifications",    label: "Announcements",          icon: Megaphone },
    { id: "gallery",          label: "Gallery Upload",         icon: ImageIcon },
    { id: "faq_management",   label: "FAQ Editor",             icon: HelpCircle },
    { id: "rules_contacts",   label: "Rules & Directory",      icon: BookOpen },
    { id: "about",            label: "About Section",          icon: Info },
    { id: "payment_settings", label: "Payment Settings",       icon: ToggleRight },
    { id: "custom_forms",     label: "Custom Forms",           icon: Layers },
    { id: "activity_logs",    label: "Audit Logs",             icon: ScrollText },
    { id: "backup_reset",     label: "Backup & Reset",         icon: Archive },
  ];

  const filteredMenuItems = menuItems.filter(item => canAccessTab(user, item.id));

  const getRoleBadgeColor = () => {
    if (user.role === "super_admin") return "bg-red-500/10 border-red-500/30 text-red-400";
    if (user.role === "admin")       return "bg-violet-500/10 border-violet-500/30 text-violet-400";
    return "bg-amber-500/10 border-amber-500/30 text-amber-400";
  };

  const getRoleLabel = () => {
    return roleDisplayLabel(user);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-gray-100 font-sans flex flex-col">
      
      {!isFirebaseConfigured && (
        <div className="bg-gradient-to-r from-amber-600/90 to-orange-700/90 text-white text-[11px] px-4 py-2 font-mono flex items-center justify-between shadow-md relative z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 animate-bounce" />
            <span>
              <strong>Chakravyuh Offline Sandbox:</strong> Running on simulated lightning-fast LocalStorage container. All registration forms, status changes, and events will persist locally.
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 opacity-90">
            <Database className="w-3.5 h-3.5" />
            <span>Schema: chakravyuh_2k26_v1.0</span>
          </div>
        </div>
      )}

      <header className="bg-[#12141a] border-b border-gray-800/80 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 hover:bg-gray-800 rounded-lg lg:hidden transition-all text-gray-400 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black font-mono tracking-wider text-white">
                CHAKRAVYUH <span className="text-orange-500">2K26</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-mono hidden sm:block">
                IMS Engineering College Sports Admin
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{user.displayName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getRoleBadgeColor()}`}>
                {getRoleLabel()}
              </span>
              {((user.role === "coordinator") || (user.role === "admin" && (user.adminCategory || "General").toLowerCase() === "sports")) && user.assignedSports?.length > 0 && (
                <span className="text-[9px] text-gray-500 font-mono">
                  ({user.assignedSports.join(", ")})
                </span>
              )}
            </div>
          </div>

          <button
            onClick={openProfileModal}
            title="My Profile"
            className="w-9 h-9 bg-orange-600/10 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/40 rounded-full flex items-center justify-center text-orange-400 font-bold text-sm transition-all cursor-pointer"
          >
            {user.displayName.charAt(0).toUpperCase()}
          </button>

          {onGoToPublic && (
            <button
              onClick={onGoToPublic}
              title="Return to Public Website"
              className="px-3 py-1.5 bg-gray-800/40 hover:bg-orange-500/10 border border-gray-800 hover:border-orange-500/20 text-gray-400 hover:text-orange-400 rounded-xl transition-all font-mono text-[10px] sm:text-xs flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline font-bold">Public Portal</span>
            </button>
          )}

          <button 
            onClick={onLogout}
            title="Exit Portal"
            className="p-2 bg-gray-800/40 hover:bg-red-500/10 border border-gray-800 hover:border-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── MY PROFILE MODAL ─────────────────────────────────────────────── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
          <div
            className="w-full max-w-md bg-[#111317] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: "fadeUp 0.22s cubic-bezier(.22,1,.36,1) both" }}
          >
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">Staff Identity Card</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Your profile syncs directly to Staff Directory</p>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg cursor-pointer transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar + Role */}
            <div className="flex flex-col items-center pt-6 pb-4 px-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-2xl font-black mb-3">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-bold text-white">{user.displayName}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{user.email}</p>
              <span className="mt-2 px-3 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border bg-orange-500/10 border-orange-500/20 text-orange-400 uppercase">
                {roleDisplayLabel(user)}
              </span>
            </div>

            {/* Body — View or Edit */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="px-6 pb-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">Display Name</label>
                  <input className="w-full px-3 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/60 rounded-xl text-xs text-white outline-none font-mono transition-colors" value={profileName} onChange={e => setProfileName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">Mobile Number</label>
                  <input className="w-full px-3 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/60 rounded-xl text-xs text-white outline-none font-mono transition-colors" placeholder="e.g. 9876543210" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">Roll Number</label>
                    <input className="w-full px-3 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/60 rounded-xl text-xs text-white outline-none font-mono transition-colors" placeholder="e.g. E26CS001" value={profileRollNo} onChange={e => setProfileRollNo(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">Branch</label>
                    <input className="w-full px-3 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/60 rounded-xl text-xs text-white outline-none font-mono transition-colors" placeholder="e.g. CSE" value={profileBranch} onChange={e => setProfileBranch(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">Campus Residency</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setProfileResidency("day_scholar")} className={`flex-1 py-2 text-xs rounded-xl border font-mono transition-all cursor-pointer ${profileResidency === "day_scholar" ? "bg-orange-500/10 border-orange-500/40 text-orange-400" : "bg-transparent border-gray-800 text-gray-500 hover:text-gray-300"}`}>Day Scholar</button>
                    <button type="button" onClick={() => setProfileResidency("hosteler")} className={`flex-1 py-2 text-xs rounded-xl border font-mono transition-all cursor-pointer ${profileResidency === "hosteler" ? "bg-orange-500/10 border-orange-500/40 text-orange-400" : "bg-transparent border-gray-800 text-gray-500 hover:text-gray-300"}`}>Hosteler</button>
                  </div>
                </div>
                {profileResidency === "hosteler" && (
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">Hostel Room No.</label>
                    <input className="w-full px-3 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/60 rounded-xl text-xs text-white outline-none font-mono transition-colors" placeholder="e.g. B-302" value={profileRoomNo} onChange={e => setProfileRoomNo(e.target.value)} />
                  </div>
                )}
                {profileMsg && (
                  <p className={`text-xs font-mono px-3 py-2 rounded-xl border ${ profileMsg.includes("Failed") ? "bg-red-950/30 border-red-500/20 text-red-400" : "bg-emerald-950/30 border-emerald-500/20 text-emerald-400" }`}>{profileMsg}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={profileSaving} className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all">
                    <Save className="w-3.5 h-3.5" />
                    {profileSaving ? "Saving..." : "Save & Sync to Directory"}
                  </button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs cursor-pointer font-bold transition-all">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="px-6 pb-6 space-y-3">
                {[
                  { icon: Phone, label: "Mobile Contact", value: user.phone || "—" },
                  { icon: Mail, label: "Official Email", value: user.email },
                  { icon: Building2, label: "Roll No & Branch", value: user.rollNo ? `${user.rollNo}${user.branch ? ` (${user.branch})` : ""}` : "—" },
                  { icon: Home, label: "Campus Residency", value: user.residency === "hosteler" ? `Hosteler${user.roomNo ? ` · Room ${user.roomNo}` : ""}` : user.residency === "day_scholar" ? "Day Scholar" : "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-lg bg-gray-800/60 shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">{label}</p>
                      <p className="text-gray-200 font-medium mt-0.5 font-mono">{value}</p>
                    </div>
                  </div>
                ))}
                {profileMsg && (
                  <p className="text-xs font-mono px-3 py-2 rounded-xl border bg-emerald-950/30 border-emerald-500/20 text-emerald-400">{profileMsg}</p>
                )}

                {/* Notification toggle */}
                <div className="flex items-center justify-between px-1 py-2 border-t border-gray-800 mt-1">
                  <div className="flex items-center gap-2">
                    {notifOn ? <Bell className="w-3.5 h-3.5 text-orange-400" /> : <BellOff className="w-3.5 h-3.5 text-gray-500" />}
                    <div>
                      <p className="text-[10px] font-bold text-gray-300 font-mono">Chat Notifications</p>
                      <p className="text-[9px] text-gray-500 font-mono">{notifOn ? "Enabled — you'll get alerts" : "Muted — no alerts"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !notifOn;
                      setNotifOn(next);
                      localStorage.setItem(notifKey, next ? "on" : "off");
                      if (next && "Notification" in window && Notification.permission === "default") {
                        Notification.requestPermission();
                      }
                    }}
                    className={`relative w-10 h-5 rounded-full transition-all cursor-pointer border ${
                      notifOn ? "bg-orange-500 border-orange-400" : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      notifOn ? "left-5" : "left-0.5"
                    }`} />
                  </button>
                </div>

                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full mt-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit My Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 relative">
        <aside 
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-[#12141a] border-r border-gray-800/80 pt-16 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:pt-0 lg:z-0
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="p-4 flex flex-col h-full justify-between overflow-y-auto">
            <div className="space-y-1">
              <div className="px-3 mb-4">
                <span className="text-[10px] font-mono tracking-wider font-bold text-gray-600 uppercase">
                  Management Controls
                </span>
              </div>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all outline-none
                      ${isActive 
                        ? "bg-gradient-to-r from-orange-500/15 to-amber-500/5 border-l-4 border-orange-500 text-orange-500" 
                        : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200 border-l-4 border-transparent"
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-orange-500" : "text-gray-500"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-[#161a23] border border-gray-800/60 rounded-xl p-3 mt-4 shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold text-gray-300 font-mono">CHAKRAVYUH SECURITY</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-normal">
                Logged session encrypted with standard token filters. Please sign out after administrative tasks.
              </p>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
