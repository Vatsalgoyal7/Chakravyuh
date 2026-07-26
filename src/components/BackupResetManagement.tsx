import React, { useState } from "react";
import { dbService } from "../lib/dbService";
import { AdminUser } from "../types";
import { Download, Archive, AlertTriangle } from "lucide-react";

interface BackupResetManagementProps {
  actor: AdminUser;
}

export default function BackupResetManagement({ actor }: BackupResetManagementProps) {
  const [busy, setBusy] = useState(false);
  const [lastArchiveKey, setLastArchiveKey] = useState<string | null>(null);

  const handleExport = async () => {
    setBusy(true);
    try {
      const backup = await dbService.exportFullBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chakravyuh_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await dbService.logActivity({
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "backup_exported",
        targetType: "system",
        summary: "Full JSON backup downloaded",
      });
    } catch (err) {
      console.error(err);
      alert("Backup export failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSeasonReset = async () => {
    const confirm1 = confirm(
      "This archives current registrations, schedules, announcements, gallery, and activity logs, then clears them for a new season.\n\nEvents, users, and payment settings are kept.\n\nContinue?"
    );
    if (!confirm1) return;
    const typed = prompt('Type RESET to confirm season archive and clear:');
    if (typed !== "RESET") {
      alert("Reset cancelled.");
      return;
    }
    setBusy(true);
    try {
      const { archiveKey } = await dbService.archiveSeasonAndReset(actor.displayName);
      setLastArchiveKey(archiveKey);
      alert(`Season archived. Local archive key: ${archiveKey}`);
    } catch (err) {
      console.error(err);
      alert("Season reset failed — check console. Local data may be partially updated.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-mono">Backup &amp; Season Reset</h2>
        <p className="text-xs text-gray-500 mt-1">Super Admin tools — does not run automatically; existing data stays until you act here.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#12141a] border border-gray-800 rounded-2xl p-6 space-y-4">
          <Download className="w-8 h-8 text-blue-400" />
          <h3 className="font-bold text-white">Download JSON backup</h3>
          <p className="text-xs text-gray-500">
            Exports events, registrations, users, settings, FAQs, gallery, schedules, and audit logs into one file.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-bold text-white"
          >
            Export backup
          </button>
        </div>

        <div className="bg-[#12141a] border border-red-900/50 rounded-2xl p-6 space-y-4">
          <Archive className="w-8 h-8 text-red-400" />
          <h3 className="font-bold text-white flex items-center gap-2">
            Reset season
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </h3>
          <p className="text-xs text-gray-500">
            Archives everything operational, then clears registrations, match schedules, announcements, gallery uploads, and audit logs. Users and event configuration remain.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleSeasonReset}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg text-xs font-bold text-white"
          >
            Archive &amp; clear season data
          </button>
          {lastArchiveKey && (
            <p className="text-[10px] font-mono text-gray-400">Last archive: {lastArchiveKey}</p>
          )}
        </div>
      </div>
    </div>
  );
}
