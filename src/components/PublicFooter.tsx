import React from "react";
import { Trophy, ShieldAlert, Mail, MapPin } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

interface PublicFooterProps {
  setActiveTab: (tab: string) => void;
}

export default function PublicFooter({ setActiveTab }: PublicFooterProps) {
  const { isWhiteBg } = useTheme();

  return (
    <footer className={`border-t py-12 md:py-16 font-sans transition-colors ${
      isWhiteBg
        ? "bg-gray-50 border-gray-200 text-gray-600"
        : "bg-[#040507] border-white/5 text-gray-500"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

        {/* Col 1: Brand & College details */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom right, var(--theme-accent-gradient-from), var(--theme-accent-gradient-to))",
              }}
            >
              <Trophy className="w-5 h-5 text-[#07080a] stroke-[2.5]" />
            </div>

            <span className={`font-mono text-base font-extrabold tracking-tight leading-none ${isWhiteBg ? "text-gray-900" : "text-white"}`}>
              CHAKRAVYUH{" "}
              <span
                className="font-black"
                style={{ color: "var(--theme-accent)" }}
              >
                2K26
              </span>
            </span>
          </div>

          <p className={`text-xs leading-relaxed max-w-sm ${isWhiteBg ? "text-gray-600" : "text-gray-400"}`}>
            Chakravyuh is the premier annual sports festival of IMSEC
            Engineering College, Ghaziabad. We bring together stellar athletic
            talent across campuses to lock horns in high-stakes, competitive
            arenas.
          </p>

          <div className="space-y-1.5 pt-2 text-[11px] font-mono">
            <p className="flex items-start gap-1.5">
              <MapPin
                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                style={{ color: "var(--theme-accent)" }}
              />

              <span>
                NH-24, Adhyatmik Nagar, Near Dasna, Ghaziabad, UP, Pin-201015
              </span>
            </p>

            <p className="flex items-center gap-1.5">
              <Mail
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: "var(--theme-accent)" }}
              />

              <span>sports@imsec.ac.in</span>
            </p>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="md:col-span-3 space-y-3">
          <h4 className={`font-mono text-xs uppercase tracking-widest font-bold ${isWhiteBg ? "text-gray-900" : "text-white"}`}>
            Navigate Portal
          </h4>

          <ul className="space-y-2 text-xs font-mono">
            {[
              { id: "home", label: "Overview & News" },
              { id: "events", label: "Sports Categories" },
              { id: "registration", label: "Roster Enrollment" },
              { id: "track", label: "Registration Tracker" },
              { id: "schedule", label: "Live Fixtures" },
              { id: "gallery", label: "Highlights Archive" },
              { id: "rules", label: "Rules & Contact" },
            ].map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => {
                    setActiveTab(link.id);
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="hover:text-[var(--theme-accent)] hover:underline transition-all cursor-pointer"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Guidelines Cert */}
        <div className="md:col-span-4 space-y-3">
          <h4 className={`font-mono text-xs uppercase tracking-widest font-bold ${isWhiteBg ? "text-gray-900" : "text-white"}`}>
            Compliance & Conduct
          </h4>

          <p className={`text-xs leading-relaxed ${isWhiteBg ? "text-gray-600" : "text-gray-400"}`}>
            All sporting events are governed by the IMSEC central sports
            committee in alignment with national collegiate athletic
            frameworks. Anti-ragging regulations are strictly enforced across
            the campus grounds.
          </p>

          <div className="flex items-center gap-2 pt-2 text-[10px] font-mono text-amber-500 bg-amber-500/5 p-3 border border-amber-500/15 rounded-lg">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />

            <span>
              ID Verification, NOC certificates, and official college
              endorsements are mandatory at registration desks.
            </span>
          </div>
        </div>
      </div>

      {/* Credits border bar */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-center text-[10px] font-mono ${
        isWhiteBg ? "border-gray-200" : "border-white/5"
      }`}>

        {/* Copyright */}
        <p>
          © 2026 IMS Engineering College, Ghaziabad. All rights reserved.
        </p>

        {/* Personal Branding */}
        <p className={isWhiteBg ? "text-gray-600" : "text-gray-400"}>
          Designed & Developed by{" "}
          <strong style={{ color: "var(--theme-accent)" }}>
            Vatsal Goyal
          </strong>
        </p>
      </div>
    </footer>
  );
}