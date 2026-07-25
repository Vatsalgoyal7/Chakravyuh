import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { AdminUser, SportEvent } from "../types";
import { 
  UserCheck, 
  UserPlus, 
  Trash2, 
  Edit2, 
  X, 
  ShieldCheck, 
  Mail, 
  Plus, 
  Trophy, 
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle,
  Key
} from "lucide-react";

export default function CoordinatorsManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Invite Form state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'coordinator'>("coordinator");
  const [inviteSports, setInviteSports] = useState<string[]>([]);

  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<'super_admin' | 'coordinator' | 'pending'>("coordinator");
  const [editSports, setEditSports] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [allUsers, allEvents] = await Promise.all([
        dbService.getUsers(),
        dbService.getEvents()
      ]);
      setUsers(allUsers);
      setEvents(allEvents);
    } catch (err) {
      console.error("Failed to load user management data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      alert("Name and email are required fields.");
      return;
    }

    const emailKey = inviteEmail.trim().toLowerCase();
    
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === emailKey)) {
      alert("A user with this email address already exists.");
      return;
    }

    // In Firebase mode, pre-provision using the email as document ID
    // When the user registers later, App.tsx will automatically migrate this document key to their UID
    const newUser: AdminUser = {
      uid: emailKey, // key is email for lookup
      email: emailKey,
      displayName: inviteName.trim(),
      role: inviteRole,
      assignedSports: inviteRole === "coordinator" ? inviteSports : [],
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveUser(newUser);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("coordinator");
      setInviteSports([]);
      setShowInviteForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to pre-provision user.");
    }
  };

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.displayName);
    setEditRole(user.role);
    setEditSports(user.assignedSports || []);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName.trim()) {
      alert("Display name cannot be empty.");
      return;
    }

    const updatedUser: AdminUser = {
      ...editingUser,
      displayName: editName.trim(),
      role: editRole as any,
      assignedSports: editRole === "coordinator" ? editSports : []
    };

    try {
      await dbService.saveUser(updatedUser);
      setEditingUser(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update user.");
    }
  };

  const handleDeleteClick = async (uid: string, name: string) => {
    if (confirm(`Are you sure you want to permanently revoke admin access for "${name}"?`)) {
      try {
        await dbService.deleteUser(uid);
        loadData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete user.");
      }
    }
  };

  const handleApprovePending = async (user: AdminUser, role: 'super_admin' | 'coordinator') => {
    const updatedUser: AdminUser = {
      ...user,
      role: role,
      assignedSports: [] // Empty by default, can edit to add sports later
    };

    try {
      await dbService.saveUser(updatedUser);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to approve access request.");
    }
  };

  const toggleInviteSport = (sportId: string) => {
    setInviteSports(prev => 
      prev.includes(sportId) ? prev.filter(id => id !== sportId) : [...prev, sportId]
    );
  };

  const toggleEditSport = (sportId: string) => {
    setEditSports(prev => 
      prev.includes(sportId) ? prev.filter(id => id !== sportId) : [...prev, sportId]
    );
  };

  const pendingUsers = users.filter(u => u.role === 'pending');
  const activeUsers = users.filter(u => u.role !== 'pending');

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Verifying authority listings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">Coordinators & Staff Manager</h2>
          <p className="text-xs text-gray-500 mt-1">Provision administrative accounts, assign sports coordinates, and approve pending signup requests.</p>
        </div>
        {!showInviteForm && (
          <button 
            onClick={() => setShowInviteForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Coordinator</span>
          </button>
        )}
      </div>

      {/* Invite/Pre-provision form */}
      {showInviteForm && (
        <div className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-orange-500" />
              <span>Pre-Provision Admin Account</span>
            </h3>
            <button onClick={() => setShowInviteForm(false)} className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Coordinator Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Amit Sharma"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="email"
                    required
                    placeholder="name@imsec.ac.in"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">System Role</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="coordinator">Coordinator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            {inviteRole === "coordinator" && (
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">
                  Authorized Sport Categories (Select multiple)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-[#0d0f12] p-4 rounded-xl border border-gray-800 max-h-40 overflow-y-auto">
                  {events.map((sport) => {
                    const isChecked = inviteSports.includes(sport.id);
                    return (
                      <button
                        type="button"
                        key={sport.id}
                        onClick={() => toggleInviteSport(sport.id)}
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

            <div className="flex gap-2 pt-4 border-t border-gray-800">
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Pre-Provision Account
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Editing Drawer / Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-orange-500/20 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <span>Edit User: {editingUser.email}</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">Display Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">System Role</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                >
                  <option value="pending">Pending Registration</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {editRole === "coordinator" && (
                <div className="space-y-3 pt-2">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold font-mono">
                    Authorized Sport Categories (Select multiple)
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-[#0d0f12] p-4 rounded-xl border border-gray-800 max-h-40 overflow-y-auto">
                    {events.map((sport) => {
                      const isChecked = editSports.includes(sport.id);
                      return (
                        <button
                          type="button"
                          key={sport.id}
                          onClick={() => toggleEditSport(sport.id)}
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

              <div className="flex gap-2 pt-4 border-t border-gray-800">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Access Requests */}
      {pendingUsers.length > 0 && (
        <div className="bg-[#1c1214] border border-red-500/20 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-red-400">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <h3 className="text-xs uppercase font-mono tracking-wider font-bold">Pending Access Requests</h3>
              <p className="text-[10px] text-gray-400 leading-normal">Coordinators have registered accounts and are awaiting dashboard clearance.</p>
            </div>
          </div>

          <div className="space-y-2">
            {pendingUsers.map((user) => (
              <div key={user.uid} className="bg-[#120f10] border border-red-500/10 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">{user.displayName}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{user.email}</p>
                  <p className="text-[9px] text-gray-600 font-mono mt-1">UID: {user.uid}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprovePending(user, 'coordinator')}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-lg text-[10px] font-mono transition-all cursor-pointer"
                  >
                    Approve as Coordinator
                  </button>
                  <button
                    onClick={() => handleApprovePending(user, 'super_admin')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-[10px] font-mono transition-all cursor-pointer"
                  >
                    Approve as Super Admin
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user.uid, user.displayName)}
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

      {/* Active User Listings */}
      <div className="bg-[#12141a] border border-gray-800/80 rounded-2xl p-5">
        <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 font-mono mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span>Active Staff & Coordinators ({activeUsers.length})</span>
        </h3>

        {activeUsers.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-6 text-center font-mono">No active admin profiles exist.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 font-mono uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Assigned Sports</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {activeUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/[0.01] transition-all">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-500/5 border border-orange-500/15 flex items-center justify-center text-orange-400 font-extrabold text-[11px]">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{user.displayName}</span>
                          <span className="block text-[9px] text-gray-600 font-mono mt-0.5">{user.uid.startsWith("mock_") ? "⚡ Local Sandbox" : "🔒 Live Firebase"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 font-mono">{user.email}</td>
                    <td className="py-4 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        user.role === 'super_admin' 
                          ? "bg-red-500/10 border-red-500/20 text-red-400" 
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      }`}>
                        {user.role === 'super_admin' ? 'SUPER ADMIN' : 'COORDINATOR'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {user.role === 'super_admin' ? (
                        <span className="text-[10px] text-gray-500 italic font-mono">All Access (Super Admin)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(!user.assignedSports || user.assignedSports.length === 0) ? (
                            <span className="text-[10px] text-red-500/60 font-mono italic">No sports assigned</span>
                          ) : (
                            user.assignedSports.map(sportId => {
                              const s = events.find(e => e.id === sportId);
                              return (
                                <span key={sportId} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700 text-[9px] font-semibold">
                                  {s ? s.title : sportId}
                                </span>
                              );
                            })
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 hover:bg-orange-500/10 text-gray-500 hover:text-orange-400 rounded-lg transition-all border border-transparent hover:border-orange-500/20 cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.uid, user.displayName)}
                          className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
