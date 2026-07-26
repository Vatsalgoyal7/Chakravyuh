import React, { useEffect, useState } from "react";
import { dbService } from "../lib/dbService";
import { ActivityLogEntry } from "../types";
import { ScrollText, RefreshCw } from "lucide-react";

export default function ActivityLogsManagement() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setLogs(await dbService.getActivityLogs(250));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-orange-500" />
            Security Audit Trail
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Timestamped actions by admins and coordinators (approvals, edits, account changes).
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 border border-gray-700 rounded-lg text-xs text-gray-300 flex items-center gap-1 hover:bg-gray-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-[#12141a] border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-500">No activity logged yet. Actions will appear here as staff use the portal.</p>
        ) : (
          <ul className="divide-y divide-gray-800 max-h-[70vh] overflow-y-auto">
            {logs.map((log) => (
              <li key={log.id} className="p-4 hover:bg-white/[0.02]">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-[10px] font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="text-[10px] font-mono text-orange-400">{log.action}</span>
                </div>
                <p className="text-sm text-white mt-1">{log.summary}</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {log.actorName} · {log.actorRole}
                  {log.targetId ? ` · ${log.targetType}:${log.targetId}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
