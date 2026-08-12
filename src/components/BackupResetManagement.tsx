import React, { useState } from "react";
import { dbService } from "../lib/dbService";
import { AdminUser, Registration } from "../types";
import { Download, Archive, AlertTriangle, FileSpreadsheet, FileText, Database, MessageSquare, Trash2 } from "lucide-react";

interface BackupResetManagementProps {
  actor: AdminUser;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function escapeCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safe(v: unknown): string {
  return v == null ? "—" : String(v);
}

function sectionTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0)
    return `<p style="color:#888;font-style:italic;font-size:10px;margin:6px 0 12px">No records found.</p>`;
  return `<table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  </table><br/>`;
}

function registrationsToCsv(regs: Registration[]): string {
  const headers = [
    "Tracking Code", "Event", "Sport Type", "Status", "Payment Status",
    "Lead Name", "Lead Email", "Lead Phone", "Lead College", "Lead Roll No",
    "Lead Branch", "Lead Year", "Team Name", "Members Count",
    "Outstation", "Travel Mode", "UTR Number", "Registered At", "Remarks"
  ];
  const rows = regs.map(r => [
    r.trackingCode, r.eventTitle, r.sportType, r.status,
    r.paymentStatus ?? "N/A",
    r.leadName, r.leadEmail, r.leadPhone, r.leadCollege, r.leadRollNo,
    r.leadBranch, r.leadYear,
    r.teamName ?? "", r.members?.length ?? 0,
    r.isOutstation ? "Yes" : "No", r.travelMode ?? "",
    r.utrNumber ?? "",
    new Date(r.registeredAt).toLocaleString(),
    r.remarks ?? ""
  ].map(escapeCsv).join(","));
  return [headers.map(escapeCsv).join(","), ...rows].join("\n");
}

function openPdfWindow(backup: Record<string, unknown>, date: string) {
  const regs: Registration[] = (backup.registrations as Registration[]) ?? [];
  const events: any[] = (backup.events as any[]) ?? [];
  const users: any[] = (backup.users as any[]) ?? [];
  const schedules: any[] = (backup.schedules as any[]) ?? [];
  const faqs: any[] = (backup.faqs as any[]) ?? [];
  const gallery: any[] = (backup.gallery as any[]) ?? [];
  const logs: any[] = (backup.activityLogs as any[]) ?? [];
  const payment: any = backup.paymentConfig ?? {};
  const about: any = backup.about ?? {};

  const approved = regs.filter(r => r.status === "approved").length;
  const pending  = regs.filter(r => r.status === "pending").length;
  const rejected = regs.filter(r => r.status === "rejected").length;
  const paid     = regs.filter(r => r.paymentStatus === "payment_verified").length;

  const regRows = regs.map(r => [
    safe(r.trackingCode), safe(r.eventTitle), safe(r.sportType),
    safe(r.leadName), safe(r.leadEmail), safe(r.leadPhone),
    safe(r.leadCollege), safe(r.leadRollNo),
    safe(r.teamName), String(r.members?.length ?? 0),
    safe(r.status), (r.paymentStatus ?? "N/A").replace(/_/g, " "),
    safe(r.utrNumber), safe(r.remarks),
    new Date(r.registeredAt).toLocaleDateString("en-IN")
  ]);

  const evtRows = events.map(e => [
    safe(e.title), safe(e.category), safe(e.type),
    safe(e.venue), safe(e.maxRegistrations),
    safe(e.registrationDeadline), e.isActive ? "Active" : "Inactive"
  ]);

  const userRows = users.map(u => [
    safe(u.displayName), safe(u.email), safe(u.role),
    safe(u.scope ?? "—"), (u.assignedSports ?? []).join(", ") || "—",
    u.suspended ? "Suspended" : "Active",
    new Date(u.createdAt).toLocaleDateString("en-IN")
  ]);

  const schedRows = schedules.map(s => [
    `Day ${safe(s.day)}`, safe(s.date), safe(s.title),
    safe(s.timeSlot), safe(s.venue), safe(s.status)
  ]);

  const faqRows = faqs.map(f => [safe(f.q), safe(f.a)]);

  const galleryRows = gallery.map(g => [
    safe(g.caption), safe(g.category), safe(g.uploadedBy),
    new Date(g.createdAt).toLocaleDateString("en-IN")
  ]);

  const logRows = logs.slice(0, 200).map(l => [
    new Date(l.timestamp).toLocaleString("en-IN"),
    safe(l.actorName), safe(l.actorRole),
    safe(l.action).replace(/_/g, " "), safe(l.summary)
  ]);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Chakravyuh 2K26 — Full Backup Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 24px; }
  h1 { font-size: 18px; margin-bottom: 4px; color: #d97706; }
  h2 { font-size: 13px; color: #1c1917; background: #fef3c7; padding: 6px 10px; border-left: 4px solid #d97706; margin: 20px 0 8px; border-radius: 0 4px 4px 0; }
  .sub { font-size: 10px; color: #555; margin-bottom: 16px; }
  .stats { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .stat { background: #f9f9f9; border: 1px solid #ddd; border-radius: 6px; padding: 8px 14px; text-align: center; }
  .stat b { display: block; font-size: 18px; color: #111; }
  .stat span { font-size: 9px; color: #666; }
  .pay-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 16px; }
  .pay-box div { font-size: 10px; }
  .pay-box b { display: block; color: #15803d; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th { background: #1c1917; color: #fff; padding: 5px 7px; text-align: left; font-size: 9px; }
  td { padding: 4px 7px; border-bottom: 1px solid #eee; vertical-align: top; font-size: 9px; word-break: break-word; max-width: 200px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 20px; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }
  @media print {
    body { padding: 8px; font-size: 9px; }
    button { display: none !important; }
    h2 { page-break-before: auto; }
  }
</style>
</head>
<body>
  <h1>🏆 Chakravyuh 2K26 — Complete Backup Report</h1>
  <p class="sub">Generated: ${date} &nbsp;|&nbsp; Super Admin Full Data Export &nbsp;|&nbsp; College: ${safe(about.collegeName)}</p>
  <button onclick="window.print()" style="margin-bottom:16px;padding:8px 18px;background:#d97706;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:bold;">🖨️ Print / Save as PDF</button>

  <h2>📋 Registration Summary</h2>
  <div class="stats">
    <div class="stat"><b>${regs.length}</b><span>Total Registrations</span></div>
    <div class="stat"><b style="color:#16a34a">${approved}</b><span>Approved</span></div>
    <div class="stat"><b style="color:#d97706">${pending}</b><span>Pending</span></div>
    <div class="stat"><b style="color:#dc2626">${rejected}</b><span>Rejected</span></div>
    <div class="stat"><b style="color:#2563eb">${paid}</b><span>Payment Verified</span></div>
  </div>

  <h2>💳 Payment Configuration</h2>
  <div class="pay-box">
    <div><b>${payment.enabled ? "ENABLED" : "DISABLED"}</b>Gateway Status</div>
    <div><b>₹${safe(payment.registrationFee)}</b>Registration Fee</div>
    <div><b>${safe(payment.upiId)}</b>UPI ID</div>
    <div><b>${safe(payment.payeeName)}</b>Payee Name</div>
  </div>

  <h2>📝 All Registrations (${regs.length})</h2>
  ${sectionTable(
    ["Tracking","Event","Type","Name","Email","Phone","College","Roll No","Team","Members","Status","Payment","UTR","Remarks","Registered On"],
    regRows
  )}

  <h2>🏆 Events (${events.length})</h2>
  ${sectionTable(
    ["Title","Category","Type","Venue","Max Regs","Deadline","Status"],
    evtRows
  )}

  <h2>👥 Admin Users (${users.length})</h2>
  ${sectionTable(
    ["Name","Email","Role","Scope","Assigned Sports","Account Status","Created On"],
    userRows
  )}

  <h2>📅 Match Schedules (${schedules.length})</h2>
  ${sectionTable(["Day","Date","Event","Time Slot","Venue","Status"], schedRows)}

  <h2>❓ FAQs (${faqs.length})</h2>
  ${sectionTable(["Question","Answer"], faqRows)}

  <h2>🖼️ Gallery (${gallery.length} items)</h2>
  ${sectionTable(["Caption","Category","Uploaded By","Date"], galleryRows)}

  <h2>📜 Audit Logs (last ${Math.min(logs.length, 200)} of ${logs.length})</h2>
  ${sectionTable(["Timestamp","Actor","Role","Action","Summary"], logRows)}

  <p class="footer">Chakravyuh 2K26 — IMS Engineering College Sports Administration &nbsp;|&nbsp; Auto-generated full backup report.</p>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    alert("Pop-up blocked — please allow pop-ups for this site to open the PDF report.");
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function BackupResetManagement({ actor }: BackupResetManagementProps) {
  const [busy, setBusy] = useState(false);
  const [lastArchiveKey, setLastArchiveKey] = useState("");

  // Chat history reset state
  const [chatResetScope, setChatResetScope] = useState<"admins_group" | "coordinators_group" | "dms" | "all">("admins_group");
  const [chatResetBusy, setChatResetBusy] = useState(false);
  const [chatResetMsg, setChatResetMsg] = useState<string | null>(null);

  // ── JSON full backup ──────────────────────────────────────────────────────
  const handleExportJson = async () => {
    setBusy(true);
    try {
      const backup = await dbService.exportFullBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `chakravyuh_backup_${date}.json`);
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
      alert("JSON backup export failed.");
    } finally {
      setBusy(false);
    }
  };

  // ── CSV registrations ─────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    setBusy(true);
    try {
      const backup = await dbService.exportFullBackup();
      const regs: Registration[] = (backup as any).registrations ?? [];
      if (regs.length === 0) { alert("No registrations found to export."); return; }
      const csv = registrationsToCsv(regs);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `chakravyuh_registrations_${date}.csv`);
      await dbService.logActivity({
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "backup_exported",
        targetType: "system",
        summary: "Registrations CSV exported",
      });
    } catch (err) {
      console.error(err);
      alert("CSV export failed.");
    } finally {
      setBusy(false);
    }
  };

  // ── PDF report (full backup, browser print) ───────────────────────────────
  const handleExportPdf = async () => {
    setBusy(true);
    try {
      const backup = await dbService.exportFullBackup();
      const date = new Date().toLocaleString("en-IN");
      openPdfWindow(backup as Record<string, unknown>, date);
      await dbService.logActivity({
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "backup_exported",
        targetType: "system",
        summary: "Full Backup PDF report opened",
      });
    } catch (err) {
      console.error(err);
      alert("PDF export failed.");
    } finally {
      setBusy(false);
    }
  };

  // ── Season reset ──────────────────────────────────────────────────────────
  const handleSeasonReset = async () => {
    const confirm1 = confirm(
      "This archives current registrations, schedules, announcements, gallery, and activity logs, then clears them for a new season.\n\nEvents, users, and payment settings are kept.\n\nContinue?"
    );
    if (!confirm1) return;
    const typed = prompt("Type RESET to confirm season archive and clear:");
    if (typed !== "RESET") { alert("Reset cancelled."); return; }
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

  const handleClearChat = async () => {
    const scopeLabels: Record<string, string> = {
      admins_group: "All Admins Group Chat",
      coordinators_group: "All Coordinators Group Chat",
      dms: "All Private DMs",
      all: "ALL Chat History (Groups + DMs)",
    };
    const label = scopeLabels[chatResetScope];
    const typed = prompt(`Type CLEAR to permanently delete ${label}:`);
    if (typed !== "CLEAR") { setChatResetMsg("Reset cancelled."); return; }
    setChatResetBusy(true);
    setChatResetMsg(null);
    try {
      const count = await dbService.clearChatHistory(chatResetScope);
      await dbService.logActivity({
        actorUid: actor.uid,
        actorName: actor.displayName,
        actorRole: actor.role,
        action: "backup_exported",
        targetType: "system",
        summary: `Cleared chat history — scope: ${chatResetScope}, deleted ${count} messages`,
      });
      setChatResetMsg(`✓ Done — ${count} message${count !== 1 ? "s" : ""} deleted from ${label}.`);
    } catch (err) {
      setChatResetMsg("Failed to clear chat history. Check console.");
    } finally {
      setChatResetBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <Archive className="w-5 h-5 text-orange-500" />
          Backup &amp; Season Reset
        </h2>
        <p className="text-xs text-gray-500 mt-1">Super Admin tools — export data in multiple formats or archive the season.</p>
      </div>

      {/* Export cards */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* JSON */}
        <div className="bg-[#12141a] border border-blue-500/20 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-bold text-white text-sm">Full JSON Backup</h3>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Complete raw backup — events, registrations, users, gallery, schedules, FAQs, payment config, audit logs.
          </p>
          <div className="pt-1">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              .json — restore-ready
            </span>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleExportJson}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download JSON
          </button>
        </div>

        {/* CSV */}
        <div className="bg-[#12141a] border border-emerald-500/20 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="font-bold text-white text-sm">Registrations CSV</h3>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Registrations table exported as CSV — opens directly in Microsoft Excel, Google Sheets, or LibreOffice Calc.
          </p>
          <div className="pt-1">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              .csv — Excel / Sheets ready
            </span>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleExportCsv}
            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>

        {/* PDF */}
        <div className="bg-[#12141a] border border-orange-500/20 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="font-bold text-white text-sm">Full Backup PDF</h3>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Complete backup — events, registrations, users, schedules, FAQs, gallery, audit logs — all in a printable report. Use browser Print → Save as PDF.
          </p>
          <div className="pt-1">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              .pdf — full data, via browser print
            </span>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleExportPdf}
            className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Open PDF Report
          </button>
        </div>
      </div>

      {/* Chat History Reset */}
      <div className="bg-[#12141a] border border-amber-900/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              Clear Chat History
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Permanently delete messages from selected channel. This action cannot be undone. All staff will see an empty chat immediately.
            </p>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { id: "admins_group",        label: "Admins Group" },
            { id: "coordinators_group",  label: "Coordinators Group" },
            { id: "dms",                 label: "All Private DMs" },
            { id: "all",                 label: "Everything" },
          ] as const).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setChatResetScope(opt.id); setChatResetMsg(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-mono border text-center transition-all cursor-pointer ${
                chatResetScope === opt.id
                  ? opt.id === "all"
                    ? "border-red-500 bg-red-500/10 text-red-400 font-bold"
                    : "border-amber-500 bg-amber-500/10 text-amber-400 font-bold"
                  : "border-gray-800 bg-[#0d0f12] text-gray-400 hover:border-gray-700 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {chatResetMsg && (
          <p className={`text-xs font-mono px-3 py-2 rounded-xl border ${
            chatResetMsg.startsWith("✓")
              ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400"
              : "bg-red-950/30 border-red-500/20 text-red-400"
          }`}>{chatResetMsg}</p>
        )}

        <button
          type="button"
          disabled={chatResetBusy}
          onClick={handleClearChat}
          className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {chatResetBusy ? "Clearing..." : "Clear Chat History"}
        </button>
      </div>

      {/* Season reset */}
      <div className="bg-[#12141a] border border-red-900/50 rounded-2xl p-6 space-y-3">
        <div className="flex items-start gap-3">
          <Archive className="w-8 h-8 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              Reset Season
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Archives everything operational, then clears registrations, match schedules, announcements, gallery uploads, and audit logs.
              Users and event configuration remain intact.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={handleSeasonReset}
          className="px-6 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Archive &amp; Clear Season Data
        </button>
        {lastArchiveKey && (
          <p className="text-[10px] font-mono text-gray-400">Last archive key: {lastArchiveKey}</p>
        )}
      </div>
    </div>
  );
}
