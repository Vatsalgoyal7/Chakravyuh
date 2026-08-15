import React, { useEffect, useState } from "react";
import { dbService } from "../lib/dbService";
import { AdminUser, CustomCategory, SportEvent } from "../types";
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Ban, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Plus, 
  Check, 
  X, 
  Trophy, 
  Users, 
  Lock,
  ShieldAlert,
  Terminal,
  BookOpen,
  Pencil,
  Save
} from "lucide-react";

interface AdminsManagementProps {
  actor: AdminUser;
}

const AVAILABLE_TABS = [
  { id: "events", label: "Events Manager" },
  { id: "coordinators", label: "Coordinators Manager" },
  { id: "registrations", label: "Registrations Control" },
  { id: "schedules", label: "Match Schedules" },
  { id: "notifications", label: "Announcements" },
  { id: "gallery", label: "Gallery Upload" },
  { id: "faq_management", label: "FAQ Editor" },
  { id: "rules_contacts", label: "Rules & Directory" },
  { id: "about", label: "About Section" },
  { id: "payment_settings", label: "Payment Settings" },
  { id: "custom_forms", label: "Custom Forms" },
  { id: "activity_logs", label: "Audit Logs" },
  { id: "backup_reset", label: "Backup & Reset" }
];

export default function AdminsManagement({ actor }: AdminsManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation tabs within Admins Manager
  const [activeSubTab, setActiveSubTab] = useState<"admins" | "permissions">("admins");
  
  // Admin form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  
  // Category form state
  const [newCatName, setNewCatName] = useState("");

  // Inline edit category state
  const [editingCategoryUid, setEditingCategoryUid] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("General");
  const [editSports, setEditSports] = useState<string[]>([]);
  const [editCategorySaving, setEditCategorySaving] = useState(false);

  // Temp password toggle in create form
  const [setTempPwd, setSetTempPwd] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  useEffect(() => {
    loadData();
    const unsubscribe = dbService.subscribeToUsers((allUsers) => {
      setUsers(allUsers.filter((u) => u.role === "admin"));
      setPendingUsers(allUsers.filter((u) => u.role === "pending"));
    });
    return () => unsubscribe();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [allUsers, allCats, allEvents] = await Promise.all([
        dbService.getUsers(),
        dbService.getCategories(),
        dbService.getEvents()
      ]);
      setUsers(allUsers.filter((u) => u.role === "admin"));
      setPendingUsers(allUsers.filter((u) => u.role === "pending"));
      setCategories(allCats);
      setEvents(allEvents);
      
      // Update local storage sync
      localStorage.setItem("chakravyuh_2k26_categories", JSON.stringify(allCats));
    } catch (err) {
      console.error("Failed to load admins configuration:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleApprovePending = async (pendingUser: AdminUser, role: 'super_admin' | 'admin' | 'coordinator') => {
    const updatedUser: AdminUser = {
      ...pendingUser,
      role: role,
      assignedSports: []
    };
    try {
      await dbService.saveUser(updatedUser);
      await dbService.logActivity({
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "access_approved",
        targetType: role,
        targetId: pendingUser.uid,
        summary: `Approved ${pendingUser.displayName} (${pendingUser.email}) as ${role}`,
      });
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to approve access request.");
    }
  };

  const handleRejectPending = async (pendingUser: AdminUser) => {
    if (confirm("Reject and delete this access request?")) {
      try {
        await dbService.deleteUser(pendingUser.uid);
        await dbService.logActivity({
          actorUid: actor.uid,
          actorName: actor.displayName,
          actorRole: actor.role,
          action: "access_rejected",
          targetType: "pending",
          targetId: pendingUser.uid,
          summary: `Rejected access request from ${pendingUser.displayName} (${pendingUser.email})`,
        });
        loadData();
      } catch (err) {
        console.error(err);
        alert("Failed to reject access request.");
      }
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailKey = email.trim().toLowerCase();
    if (!name.trim() || !emailKey) {
      alert("Name and email are required fields.");
      return;
    }
    const all = await dbService.getUsers();
    if (all.some((u) => u.email.toLowerCase() === emailKey)) {
      alert("A user with this email address already exists.");
      return;
    }

    const newAdmin: AdminUser = {
      uid: emailKey,
      email: emailKey,
      displayName: name.trim(),
      role: "admin",
      adminCategory: selectedCategory,
      assignedSports: selectedCategory.toLowerCase() === "sports" ? selectedSports : [],
      createdAt: new Date().toISOString(),
      suspended: false,
      ...(setTempPwd && tempPassword ? { tempPassword: tempPassword } : {}),
    };

    try {
      await dbService.saveUser(newAdmin);
      await dbService.logActivity({
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "user_created",
        targetType: "admin",
        targetId: newAdmin.uid,
        summary: `Created admin ${newAdmin.displayName} under category: ${selectedCategory}`,
      });
      setName("");
      setEmail("");
      setSelectedCategory("General");
      setSelectedSports([]);
      setSetTempPwd(false);
      setTempPassword("");
      setShowForm(false);
      loadData();
    } catch (err) {
      alert("Failed to pre-provision admin account.");
    }
  };

  const handleToggleSport = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId) ? prev.filter(id => id !== sportId) : [...prev, sportId]
    );
  };

  const handleToggleEditSport = (sportId: string) => {
    setEditSports(prev =>
      prev.includes(sportId) ? prev.filter(id => id !== sportId) : [...prev, sportId]
    );
  };

  const openEditCategory = (u: AdminUser) => {
    setEditingCategoryUid(u.uid);
    setEditCategory(u.adminCategory || "General");
    setEditSports(u.assignedSports || []);
  };

  const handleSaveEditCategory = async (u: AdminUser) => {
    setEditCategorySaving(true);
    try {
      const updated: AdminUser = {
        ...u,
        adminCategory: editCategory,
        assignedSports: editCategory.toLowerCase() === "sports" ? editSports : [],
      };
      await dbService.saveUser(updated);
      await dbService.logActivity({
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "user_updated",
        targetType: "admin",
        targetId: u.uid,
        summary: `Changed category of ${u.displayName} to ${editCategory}`,
      });
      setEditingCategoryUid(null);
      loadData();
    } catch (err) {
      alert("Failed to update category.");
    } finally {
      setEditCategorySaving(false);
    }
  };

  const toggleSuspend = async (user: AdminUser) => {
    const next = !user.suspended;
    const updated = { ...user, suspended: next };
    await dbService.saveUser(updated);
    await dbService.logActivity({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      action: "user_suspended",
      targetType: "admin",
      targetId: user.uid,
      summary: `${next ? "Suspended" : "Reactivated"} admin ${user.displayName}`,
    });
    loadData();
  };

  const handleDeleteAdmin = async (user: AdminUser) => {
    if (!confirm(`Remove administrative access for "${user.displayName}"? This will lock them out immediately.`)) return;
    await dbService.deleteUser(user.uid);
    await dbService.logActivity({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      action: "user_deleted",
      targetType: "admin",
      targetId: user.uid,
      summary: `Deleted admin account ${user.displayName}`,
    });
    loadData();
  };

  // ── CATEGORIES MATRIX ACTIONS ─────────────────────────────────────────────

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const catId = newCatName.trim().toLowerCase().replace(/\s+/g, "_");
    
    if (categories.some(c => c.id === catId || c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      alert("A category with this name already exists.");
      return;
    }

    const newCat: CustomCategory = {
      id: catId,
      name: newCatName.trim(),
      allowedTabs: ["dashboard"] // Start with dashboard access
    };

    try {
      await dbService.saveCategory(newCat);
      const updated = [...categories, newCat];
      localStorage.setItem("chakravyuh_2k26_categories", JSON.stringify(updated));
      setCategories(updated);
      setNewCatName("");
      alert(`Category "${newCat.name}" added successfully!`);
    } catch (err) {
      alert("Failed to create category.");
    }
  };

  const handleToggleTabPermission = async (catId: string, tabId: string) => {
    // Prevent modifying essential dashboard tab
    if (tabId === "dashboard") return;

    const updatedCats = categories.map(c => {
      if (c.id === catId) {
        const hasTab = c.allowedTabs.includes(tabId);
        const nextTabs = hasTab 
          ? c.allowedTabs.filter(t => t !== tabId) 
          : [...c.allowedTabs, tabId];
        return { ...c, allowedTabs: nextTabs };
      }
      return c;
    });

    const targetCat = updatedCats.find(c => c.id === catId);
    if (!targetCat) return;

    try {
      await dbService.saveCategory(targetCat);
      localStorage.setItem("chakravyuh_2k26_categories", JSON.stringify(updatedCats));
      setCategories(updatedCats);
    } catch (err) {
      alert("Failed to update permission matrix.");
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    const coreCats = ["general", "sports", "discipline", "technical", "food", "medical", "logistics", "media"];
    if (coreCats.includes(catId)) {
      alert("Core system categories cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${name}"? Admins currently under this category will lose access privileges until reassigned.`)) return;

    try {
      await dbService.deleteCategory(catId);
      const updated = categories.filter(c => c.id !== catId);
      localStorage.setItem("chakravyuh_2k26_categories", JSON.stringify(updated));
      setCategories(updated);
    } catch (err) {
      alert("Failed to delete category.");
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Loading operations matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Sub tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            System Roles & Permissions
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Super Admin exclusive: configure dynamic categories, toggle tab permissions, and provision admin scopes.
          </p>
        </div>

        <div className="flex items-center bg-[#0d0f12] border border-gray-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveSubTab("admins")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === "admins" ? "bg-orange-500 text-black shadow-md shadow-orange-500/10" : "text-gray-400 hover:text-white"
            }`}
          >
            Admins List
          </button>
          <button
            onClick={() => setActiveSubTab("permissions")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === "permissions" ? "bg-orange-500 text-black shadow-md shadow-orange-500/10" : "text-gray-400 hover:text-white"
            }`}
          >
            Permission Configurer
          </button>
        </div>
      </div>

      {activeSubTab === "admins" ? (
        <div className="space-y-6">

          {/* Pending Access Requests Banner for SuperAdmin */}
          {pendingUsers.length > 0 && (
            <div className="bg-[#1c1214] border border-red-500/30 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <h3 className="text-xs uppercase font-mono tracking-wider font-bold">
                    Pending Access Requests ({pendingUsers.length})
                  </h3>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Users registered on the portal awaiting administrative clearance.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {pendingUsers.map((pUser) => (
                  <div key={pUser.uid} className="bg-[#120f10] border border-red-500/10 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{pUser.displayName}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{pUser.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleApprovePending(pUser, "admin")}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-lg text-[10px] font-mono transition-all cursor-pointer"
                      >
                        Approve as Admin
                      </button>
                      <button
                        onClick={() => handleApprovePending(pUser, "coordinator")}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-lg text-[10px] font-mono transition-all cursor-pointer"
                      >
                        Approve as Coordinator
                      </button>
                      <button
                        onClick={() => handleApprovePending(pUser, "super_admin")}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-[10px] font-mono transition-all cursor-pointer"
                      >
                        Approve as Super Admin
                      </button>
                      <button
                        onClick={() => handleRejectPending(pUser)}
                        className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                        title="Reject Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-gray-400">
              Middle-Tier Staff Profiles
            </h3>
            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Create Admin
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleCreateAdmin} className="bg-[#12141a] border border-gray-800 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-orange-500 font-mono">Provision Admin Credentials</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-mono">Pre-provision an account. The user will complete sign-up on the portal to activate their password.</p>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white p-1">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Display Name *</label>
                  <input
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-700 focus:border-orange-500 rounded-lg text-xs text-white"
                    placeholder="e.g. Prof. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Email Address *</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-700 focus:border-orange-500 rounded-lg text-xs text-white"
                    placeholder="name@imsec.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Assign Category Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.name)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono border text-center transition-all ${
                        selectedCategory.toLowerCase() === c.name.toLowerCase()
                          ? "border-orange-500 bg-orange-500/10 text-orange-400 font-bold"
                          : "border-gray-800 bg-[#0d0f12] text-gray-400 hover:border-gray-700 hover:text-white"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategory.toLowerCase() === "sports" && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">
                    Restrict Sports Scope (Select one or more)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-[#0d0f12] p-4 rounded-xl border border-gray-800 max-h-40 overflow-y-auto">
                    {events.map((sport) => {
                      const isChecked = selectedSports.includes(sport.id);
                      return (
                        <button
                          type="button"
                          key={sport.id}
                          onClick={() => handleToggleSport(sport.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all border outline-none ${
                            isChecked 
                              ? "bg-orange-500/10 border-orange-500/30 text-orange-400 font-semibold" 
                              : "bg-[#0b0c0e] border-gray-800/80 hover:border-gray-700 text-gray-400"
                          }`}
                        >
                          <Trophy className={`w-3.5 h-3.5 ${isChecked ? "text-orange-500" : "text-gray-600"}`} />
                          <span className="truncate">{sport.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Temp Password Toggle */}
              <div className="space-y-3 border border-gray-800 rounded-xl p-4 bg-[#0d0f12]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Set Temporary Password <span className="text-gray-600">(Optional)</span></p>
                    <p className="text-[9px] text-gray-600 mt-0.5 font-mono">If set, the user can sign in with this password without completing the signup flow.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSetTempPwd(!setTempPwd); setTempPassword(""); }}
                    className={`relative w-10 h-5 rounded-full transition-all cursor-pointer border ${
                      setTempPwd ? "bg-orange-500 border-orange-400" : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      setTempPwd ? "left-5" : "left-0.5"
                    }`} />
                  </button>
                </div>
                {setTempPwd && (
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Temporary Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 bg-[#0a0b0e] border border-gray-700 focus:border-orange-500 rounded-lg text-xs text-white font-mono"
                        placeholder="e.g. Admin@2026"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>
                    <p className="text-[9px] text-amber-500/70 font-mono">⚠ Share this password securely with the user. It will be removed after first login.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-gray-800/60 pt-4">
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white cursor-pointer transition-all">
                  Save Admin Account
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs text-gray-300 cursor-pointer transition-all">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-[#12141a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {users.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-gray-600" />
                No administrative staff accounts found. Invite one to delegate category scopes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 font-mono uppercase text-[10px] font-bold bg-[#0d0f12]">
                      <th className="py-3 px-4">Admin Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Category Role</th>
                      <th className="py-3 px-4">Authorized Scope</th>
                      <th className="py-3 px-4">Suspension</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {users.map((u) => {
                      const isSports = (u.adminCategory || "General").toLowerCase() === "sports";
                      const isEditing = editingCategoryUid === u.uid;
                      return (
                        <React.Fragment key={u.uid}>
                          <tr className="hover:bg-white/[0.01] transition-all">
                            <td className="py-4 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-extrabold text-[11px]">
                                  {u.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span>{u.displayName}</span>
                                  {u.phone && <span className="block text-[9px] text-gray-600 font-mono mt-0.5">{u.phone}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-400 font-mono">{u.email}</td>
                            <td className="py-4 px-4 font-mono font-bold text-violet-400">
                              <span className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/25">
                                {u.adminCategory || "General"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {isSports ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {(!u.assignedSports || u.assignedSports.length === 0) ? (
                                    <span className="text-[10px] text-orange-400/70 italic">All Sports (General Fallback)</span>
                                  ) : (
                                    u.assignedSports.map(id => {
                                      const sport = events.find(e => e.id === id);
                                      return (
                                        <span key={id} className="px-2 py-0.5 bg-gray-800 border border-gray-700 text-gray-300 text-[9px] rounded font-mono font-semibold">
                                          {sport ? sport.title : id}
                                        </span>
                                      );
                                    })
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500 italic font-mono text-[10px]">Global Config Scoped</span>
                              )}
                            </td>
                            <td className="py-4 px-4 font-mono">
                              {u.suspended ? (
                                <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1 w-max">
                                  <Ban className="w-3 h-3" /> SUSPENDED
                                </span>
                              ) : (
                                <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1 w-max">
                                  <CheckCircle className="w-3 h-3" /> ACTIVE
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  title="Edit Category"
                                  onClick={() => isEditing ? setEditingCategoryUid(null) : openEditCategory(u)}
                                  className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
                                    isEditing
                                      ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                                      : "text-gray-400 hover:bg-violet-500/10 border-transparent hover:border-violet-500/20 hover:text-violet-400"
                                  }`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleSuspend(u)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    u.suspended 
                                      ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" 
                                      : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                                  }`}
                                >
                                  {u.suspended ? "Reactivate" : "Suspend"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(u)}
                                  className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                                  title="Revoke access"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* ── Inline Category Editor Row ── */}
                          {isEditing && (
                            <tr className="bg-[#0d0f12]">
                              <td colSpan={6} className="px-4 pb-4 pt-2">
                                <div className="border border-orange-500/20 bg-orange-500/[0.04] rounded-xl p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-orange-400 font-mono">Change Category Role — {u.displayName}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {categories.map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setEditCategory(c.name)}
                                        className={`px-3 py-2 rounded-xl text-xs font-mono border text-center transition-all cursor-pointer ${
                                          editCategory.toLowerCase() === c.name.toLowerCase()
                                            ? "border-orange-500 bg-orange-500/10 text-orange-400 font-bold"
                                            : "border-gray-800 bg-[#0b0c0e] text-gray-400 hover:border-gray-700 hover:text-white"
                                        }`}
                                      >
                                        {c.name}
                                      </button>
                                    ))}
                                  </div>

                                  {editCategory.toLowerCase() === "sports" && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-mono font-bold">Restrict Sports Scope</p>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 bg-[#0b0c0e] p-3 rounded-xl border border-gray-800 max-h-36 overflow-y-auto">
                                        {events.map((sport) => {
                                          const checked = editSports.includes(sport.id);
                                          return (
                                            <button
                                              key={sport.id}
                                              type="button"
                                              onClick={() => handleToggleEditSport(sport.id)}
                                              className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all border outline-none cursor-pointer ${
                                                checked
                                                  ? "bg-orange-500/10 border-orange-500/30 text-orange-400 font-semibold"
                                                  : "bg-transparent border-gray-800 hover:border-gray-700 text-gray-400"
                                              }`}
                                            >
                                              <Trophy className={`w-3.5 h-3.5 ${checked ? "text-orange-500" : "text-gray-600"}`} />
                                              <span className="truncate">{sport.title}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={editCategorySaving}
                                      onClick={() => handleSaveEditCategory(u)}
                                      className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-extrabold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      {editCategorySaving ? "Saving..." : "Save Category"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCategoryUid(null)}
                                      className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs cursor-pointer font-bold transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-gray-400">
                Permission Configuration Matrix
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Toggle navigation access to active sections for each admin category.</p>
            </div>
            
            <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
              <input
                className="px-3 py-1.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white w-44 sm:w-56 font-mono"
                placeholder="New Category (e.g. Food)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-orange-500 text-black hover:bg-orange-600 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>
          </div>

          <div className="bg-[#12141a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-mono uppercase text-[9px] font-bold bg-[#0d0f12]">
                    <th className="py-4 px-4 sticky left-0 bg-[#0d0f12] z-10 w-44">Admin Category</th>
                    {AVAILABLE_TABS.map((tab) => (
                      <th key={tab.id} className="py-4 px-3 text-center min-w-[100px] whitespace-nowrap font-mono">
                        {tab.label}
                      </th>
                    ))}
                    <th className="py-4 px-4 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="py-4 px-4 font-bold text-white font-mono sticky left-0 bg-[#12141a] border-r border-gray-800/30 z-10">
                        <div className="flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-gray-500" />
                          <span>{cat.name}</span>
                        </div>
                      </td>
                      
                      {AVAILABLE_TABS.map((tab) => {
                        const hasAccess = cat.allowedTabs.includes(tab.id);
                        return (
                          <td key={tab.id} className="py-4 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleTabPermission(cat.id, tab.id)}
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                hasAccess 
                                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                                  : "bg-[#0b0c0e] border-gray-800 text-gray-600 hover:border-gray-700"
                              }`}
                            >
                              {hasAccess && <Check className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                      
                      <td className="py-4 px-4 text-right bg-[#12141a]">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Delete category"
                          disabled={["general", "sports", "discipline", "technical", "food", "medical", "logistics", "media"].includes(cat.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-800 bg-[#0d0f12]/50 text-[10px] text-gray-500 font-mono leading-relaxed">
              <span className="text-orange-500 font-bold block mb-1">ℹ️ Core System Matrix Info:</span>
              - The **Dashboard** and **Staff Chat** tabs are universally unlocked for all categories.
              - Core categories (General, Sports, Discipline, Technical, etc.) are protected from deletion to safeguard basic portal routing.
              - Tab accessibility updates are synced in real-time across the client application.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
