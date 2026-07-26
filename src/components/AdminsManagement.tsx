import React, { useEffect, useState } from "react";
import { dbService } from "../lib/dbService";
import { AdminScope, AdminUser } from "../types";
import { Shield, UserPlus, Trash2, Ban, CheckCircle, AlertCircle } from "lucide-react";

interface AdminsManagementProps {
  actor: AdminUser;
}

export default function AdminsManagement({ actor }: AdminsManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scope, setScope] = useState<AdminScope>("all");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const all = await dbService.getUsers();
      setUsers(all.filter((u) => u.role === "admin"));
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailKey = email.trim().toLowerCase();
    if (!name.trim() || !emailKey) {
      alert("Name and email are required.");
      return;
    }
    const all = await dbService.getUsers();
    if (all.some((u) => u.email.toLowerCase() === emailKey)) {
      alert("A user with this email already exists.");
      return;
    }

    const newAdmin: AdminUser = {
      uid: emailKey,
      email: emailKey,
      displayName: name.trim(),
      role: "admin",
      scope,
      assignedSports: [],
      createdAt: new Date().toISOString(),
      suspended: false,
    };

    await dbService.saveUser(newAdmin);
    await dbService.logActivity({
      actorUid: actor.uid,
      actorName: actor.displayName,
      actorRole: actor.role,
      action: "user_created",
      targetType: "admin",
      targetId: newAdmin.uid,
      summary: `Created middle-tier admin ${newAdmin.displayName} (${scope} scope)`,
    });
    setName("");
    setEmail("");
    setScope("all");
    setShowForm(false);
    loadUsers();
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
    loadUsers();
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Remove admin access for "${user.displayName}"? They must be re-invited to regain access.`)) return;
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
    loadUsers();
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            Admins Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Super Admin exclusive: invite middle-tier admins and set Individual / Team / General scope.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Admin
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#12141a] border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              className="px-3 py-2 bg-[#0d0f12] border border-gray-700 rounded-lg text-sm text-white"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="px-3 py-2 bg-[#0d0f12] border border-gray-700 rounded-lg text-sm text-white"
              placeholder="Email (pre-provision)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono uppercase mb-2">Scope assignment</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "individual", "team"] as AdminScope[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
                    scope === s
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-gray-700 text-gray-400"
                  }`}
                >
                  {s === "all" ? "General (all sports)" : s === "individual" ? "Individual sports" : "Team sports"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold text-white">
              Save Admin
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 rounded-lg text-xs text-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#12141a] border border-gray-800 rounded-2xl overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-gray-600" />
            No middle-tier admins yet. Create one to delegate registrations and coordinators.
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {users.map((u) => (
              <li key={u.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{u.displayName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  <p className="text-[10px] font-mono text-orange-400 mt-1">scope: {u.scope ?? "all"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.suspended ? (
                    <span className="text-[10px] text-red-400 font-mono flex items-center gap-1">
                      <Ban className="w-3 h-3" /> SUSPENDED
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSuspend(u)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  >
                    {u.suspended ? "Reactivate" : "Suspend"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                    title="Delete admin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
