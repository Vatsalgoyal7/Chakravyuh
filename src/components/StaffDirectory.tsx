import React, { useEffect, useState } from "react";
import { dbService } from "../lib/dbService";
import { AdminUser, SportEvent } from "../types";
import { roleDisplayLabel } from "../lib/permissions";
import { 
  Users, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Building2, 
  Home, 
  Shield, 
  Briefcase, 
  GraduationCap 
} from "lucide-react";

interface StaffDirectoryProps {
  actor: AdminUser;
}

export default function StaffDirectory({ actor }: StaffDirectoryProps) {
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedResidency, setSelectedResidency] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");

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
      // Filter out pending requests to show only active staff
      const activeStaff = allUsers.filter(u => u.role === "admin" || u.role === "coordinator");
      setStaff(activeStaff);
      setEvents(allEvents);
    } catch (err) {
      console.error("Failed to load staff roster:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to extract unique branches from profiles
  const uniqueBranches = Array.from(
    new Set(staff.map(s => s.branch).filter(Boolean))
  ) as string[];

  // Helper to extract unique categories from admin profiles
  const uniqueCategories = Array.from(
    new Set(staff.map(s => s.adminCategory).filter(Boolean))
  ) as string[];

  // Filtering Logic
  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm));
      
    const matchesRole = 
      selectedRole === "all" || 
      member.role === selectedRole;
      
    const matchesCategory = 
      selectedCategory === "all" || 
      (member.role === "admin" && member.adminCategory === selectedCategory) ||
      (member.role === "coordinator" && selectedCategory === "Coordinator");
      
    const matchesResidency = 
      selectedResidency === "all" || 
      member.residency === selectedResidency;
      
    const matchesBranch = 
      selectedBranch === "all" || 
      member.branch === selectedBranch;

    return matchesSearch && matchesRole && matchesCategory && matchesResidency && matchesBranch;
  });

  // Calculate Statistics
  const totalAdmins = staff.filter(s => s.role === "admin").length;
  const totalCoordinators = staff.filter(s => s.role === "coordinator").length;
  const totalHostelers = staff.filter(s => s.residency === "hosteler").length;
  const totalDayScholars = staff.filter(s => s.residency === "day_scholar").length;

  // ── CSV / EXCEL EXPORT GENERATION ──────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredStaff.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Role",
      "Category/Sports Scope",
      "Mobile",
      "Roll Number",
      "Branch",
      "Residency Status",
      "Room Number",
      "Created At"
    ];

    const rows = filteredStaff.map(member => {
      const sportsList = member.role === "coordinator" || (member.adminCategory || "").toLowerCase() === "sports"
        ? member.assignedSports?.map(sId => events.find(e => e.id === sId)?.title || sId).join(" | ") || "All Sports"
        : "N/A";
        
      const roleLabel = member.role === "admin" 
        ? `Admin (${member.adminCategory || "General"})`
        : "Coordinator";

      return [
        member.displayName,
        member.email,
        roleLabel,
        sportsList,
        member.phone || "—",
        member.rollNo || "—",
        member.branch || "—",
        member.residency === "hosteler" ? "Hosteler" : member.residency === "day_scholar" ? "Day Scholar" : "—",
        member.roomNo || "—",
        new Date(member.createdAt).toLocaleDateString()
      ];
    });

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chakravyuh_staff_roster_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── PDF / PRINT VIEW TRIGGER ───────────────────────────────────────────────
  const handlePrintPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Compiling directory database...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Print stylesheet to format only the table cleanly in A4 size */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: transparent !important;
            color: #000 !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Staff & Coordinator Directory
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Super Admin Portal: Query directory stats, filter credentials and download consolidated CSV/Excel rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/10 transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV / Excel
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-gray-700 transition-all"
          >
            <Printer className="w-4 h-4" /> Print PDF / Report
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-[#12141a] border border-gray-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Total Admins</p>
            <h4 className="text-lg font-bold text-white font-mono mt-0.5">{totalAdmins}</h4>
          </div>
        </div>

        <div className="bg-[#12141a] border border-gray-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Coordinators</p>
            <h4 className="text-lg font-bold text-white font-mono mt-0.5">{totalCoordinators}</h4>
          </div>
        </div>

        <div className="bg-[#12141a] border border-gray-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Hostelers</p>
            <h4 className="text-lg font-bold text-white font-mono mt-0.5">{totalHostelers}</h4>
          </div>
        </div>

        <div className="bg-[#12141a] border border-gray-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Day Scholars</p>
            <h4 className="text-lg font-bold text-white font-mono mt-0.5">{totalDayScholars}</h4>
          </div>
        </div>
      </div>

      {/* Advanced Filtering Block */}
      <div className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl space-y-4 no-print">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-2">
          <Filter className="w-4 h-4 text-orange-500" />
          <span>Roster Query Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Text Search */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Search Members</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                className="w-full pl-8 pr-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/40 rounded-xl text-xs text-white"
                placeholder="Name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Role Tier</label>
            <select
              className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/40 rounded-xl text-xs text-white font-mono"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setSelectedCategory("all"); // reset category filter
              }}
            >
              <option value="all">All Tiers</option>
              <option value="admin">Admins Only</option>
              <option value="coordinator">Coordinators Only</option>
            </select>
          </div>

          {/* Department / Category Filter */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Category / Scope</label>
            <select
              className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/40 rounded-xl text-xs text-white font-mono"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {selectedRole !== "coordinator" && uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {selectedRole !== "admin" && (
                <option value="Coordinator">All Coordinators</option>
              )}
            </select>
          </div>

          {/* Residency Filter */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Residency Status</label>
            <select
              className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/40 rounded-xl text-xs text-white font-mono"
              value={selectedResidency}
              onChange={(e) => setSelectedResidency(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="hosteler">Hostelers</option>
              <option value="day_scholar">Day Scholars</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Academic Branch</label>
            <select
              className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500/40 rounded-xl text-xs text-white font-mono"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">All Branches</option>
              {uniqueBranches.map(br => (
                <option key={br} value={br}>{br}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Roster Data Table */}
      <div id="print-area" className="bg-[#12141a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-[#0d0f12] hidden print:block">
          <h1 className="text-base font-bold text-black font-mono">CHAKRAVYUH 2k26 - Active Staff Directory</h1>
          <p className="text-[10px] text-gray-600 font-mono mt-0.5">Report Generated On: {new Date().toLocaleString()}</p>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs font-mono">
            No matching staff profiles found for the active query parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 font-mono uppercase text-[9px] font-bold bg-[#0d0f12]">
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role Tier</th>
                  <th className="py-3.5 px-4">Sports Scope</th>
                  <th className="py-3.5 px-4 font-mono">Contact No</th>
                  <th className="py-3.5 px-4 font-mono">Roll No & Branch</th>
                  <th className="py-3.5 px-4">Residency</th>
                  <th className="py-3.5 px-4">Room No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {filteredStaff.map((m) => {
                  const isSportsStr = m.role === "coordinator" || (m.adminCategory || "").toLowerCase() === "sports";
                  return (
                    <tr key={m.uid} className="hover:bg-white/[0.01] transition-all print:border-b print:border-gray-200">
                      <td className="py-3.5 px-4 font-bold text-white print:text-black">
                        {m.displayName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 print:text-black font-mono">
                        {m.email}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.role === "admin" 
                            ? "bg-violet-500/10 border border-violet-500/20 text-violet-400 print:bg-transparent print:text-black" 
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-400 print:bg-transparent print:text-black"
                        }`}>
                          {m.role === "admin" ? `Admin · ${m.adminCategory || "General"}` : "Coordinator"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isSportsStr ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(!m.assignedSports || m.assignedSports.length === 0) ? (
                              <span className="text-[10px] text-gray-500 italic">All Sports</span>
                            ) : (
                              m.assignedSports.map(id => {
                                const s = events.find(e => e.id === id);
                                return (
                                  <span key={id} className="px-1.5 py-0.2 bg-gray-800 border border-gray-700 text-gray-300 text-[9px] rounded font-mono print:text-black print:bg-transparent print:border-transparent">
                                    {s ? s.title : id}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic font-mono text-[9px]">Global Config Scoped</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 print:text-black font-mono">
                        {m.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 print:text-black font-mono">
                        {m.rollNo || "—"} {m.branch ? `(${m.branch})` : ""}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 print:text-black font-mono">
                        {m.residency === "hosteler" ? "Hosteler" : m.residency === "day_scholar" ? "Day Scholar" : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 print:text-black font-mono">
                        {m.residency === "hosteler" ? (m.roomNo || "—") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
