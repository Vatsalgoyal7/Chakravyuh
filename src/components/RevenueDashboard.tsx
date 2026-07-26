import React, { useEffect, useState } from "react";
import { dbService } from "../lib/dbService";
import { RevenueAnalytics } from "../types";
import { IndianRupee, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function RevenueDashboard() {
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setData(await dbService.getRevenueAnalytics());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-400" />
          Revenue &amp; Billing Monitor
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Super Admin only — live fee collection estimates from verified payments (fee: ₹{data.registrationFee}
          {data.paymentEnabled ? ", gateway ON" : ", gateway OFF"}).
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Estimated collected"
          value={`₹${data.totalCollectedEstimate.toLocaleString("en-IN")}`}
          icon={TrendingUp}
          accent="text-emerald-400"
        />
        <MetricCard label="Verified payments" value={String(data.verifiedPaymentsCount)} icon={CheckCircle2} accent="text-blue-400" />
        <MetricCard label="Pending UTR review" value={String(data.submittedPendingCount)} icon={Clock} accent="text-amber-400" />
        <MetricCard label="Rejected payments" value={String(data.rejectedPaymentsCount)} icon={XCircle} accent="text-red-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-[#12141a] border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-mono text-gray-400 uppercase mb-3">By sport type</h3>
          <div className="space-y-2 text-sm">
            <Row label="Individual events" value={`₹${data.bySportType.individual.toLocaleString("en-IN")}`} />
            <Row label="Team events" value={`₹${data.bySportType.team.toLocaleString("en-IN")}`} />
          </div>
        </div>
        <div className="bg-[#12141a] border border-gray-800 rounded-2xl p-5 max-h-80 overflow-y-auto">
          <h3 className="text-xs font-mono text-gray-400 uppercase mb-3">Top events by revenue</h3>
          <ul className="space-y-2">
            {data.byEvent
              .filter((e) => e.estimatedRevenue > 0)
              .slice(0, 8)
              .map((e) => (
                <li key={e.eventId} className="flex justify-between text-xs">
                  <span className="text-gray-300">{e.eventTitle}</span>
                  <span className="font-mono text-emerald-400">₹{e.estimatedRevenue}</span>
                </li>
              ))}
            {data.byEvent.every((e) => e.estimatedRevenue === 0) && (
              <li className="text-gray-500 text-xs">No verified payments recorded yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono text-gray-500 uppercase">{label}</span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <p className="text-2xl font-extrabold text-white font-mono mt-3">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}
