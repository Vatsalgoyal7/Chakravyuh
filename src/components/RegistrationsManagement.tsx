import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { Registration, SportEvent, TeamMember } from "../types";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  X, 
  Check, 
  AlertOctagon, 
  Mail, 
  Phone, 
  Building, 
  CornerDownRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
  Trash2,
  Lock,
  Calendar,
  QrCode,
  IndianRupee,
  BadgeCheck,
  BadgeX
} from "lucide-react";

interface RegistrationsManagementProps {
  user: any;
}

export default function RegistrationsManagement({ user }: RegistrationsManagementProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSportFilter, setSelectedSportFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Selected registration for modal/detail view
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [remarks, setRemarks] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'approved' | 'rejected' | null>(null);

  // Manual Add Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCollege, setLeadCollege] = useState("IMSEC Engineering College");
  const [leadRollNo, setLeadRollNo] = useState("");
  const [leadBranch, setLeadBranch] = useState("CSE");
  const [leadYear, setLeadYear] = useState("3rd Year");

  // Dynamic team members
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Simulated email delivery log state
  const [emailLogs, setEmailLogs] = useState<{ id: string; to: string; subject: string; sentAt: string }[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setIsLoading(true);
    try {
      const evs = await dbService.getEvents();
      const authorizedEventIds = user.role === "coordinator" ? user.assignedSports : undefined;
      const regs = await dbService.getRegistrations(authorizedEventIds);

      // Filter based on Coordinator access permissions
      if (user.role === "coordinator") {
        const authorizedEvents = evs.filter(e => user.assignedSports.includes(e.id));
        const authEventIds = authorizedEvents.map(e => e.id);
        setEvents(authorizedEvents);
        setRegistrations(regs.filter(r => authEventIds.includes(r.eventId)));
      } else {
        setEvents(evs);
        setRegistrations(regs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Event selection in form to dynamically resize members array
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e.id === eventId);
    if (event) {
      if (event.type === "individual") {
        setMembers([]);
        setTeamName("");
      } else {
        // Create matching empty team members slots up to (maxTeamSize - 1) since lead is captain
        const slotsNeeded = event.maxTeamSize - 1;
        const slots: TeamMember[] = Array.from({ length: Math.max(0, slotsNeeded) }, () => ({
          name: "",
          email: "",
          phone: "",
          rollNo: "",
          college: "IMSEC Engineering College"
        }));
        setMembers(slots);
      }
    }
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !leadName || !leadRollNo || !leadEmail) {
      alert("Please fill in all mandatory lead credentials.");
      return;
    }

    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    // Filter team members where name is filled (for flexible optional roster sizes within bounds)
    const activeMembers = members.filter(m => m.name.trim() !== "");

    // Validate size
    const totalTeamSize = activeMembers.length + 1; // plus leader
    if (event.type === "team" && (totalTeamSize < event.minTeamSize || totalTeamSize > event.maxTeamSize)) {
      alert(`Invalid team size! For ${event.title}, total size must be between ${event.minTeamSize} and ${event.maxTeamSize} members.`);
      return;
    }

    const registrationPayload: Omit<Registration, "id" | "registeredAt" | "updatedAt" | "trackingCode"> = {
      eventId: selectedEventId,
      eventTitle: event.title,
      sportType: event.type,
      status: "pending",
      leadName,
      leadEmail,
      leadPhone,
      leadCollege,
      leadRollNo,
      leadBranch,
      leadYear,
      teamName: event.type === "team" ? teamName || "Unnamed Team" : undefined,
      members: event.type === "team" ? activeMembers : undefined,
      duplicateCheckHash: `${selectedEventId}_${leadRollNo}`
    };

    try {
      await dbService.saveRegistration(registrationPayload);
      
      // Simulate Email Send Dispatch
      const newLog = {
        id: `email_${Date.now()}`,
        to: leadEmail,
        subject: `[CHAKRAVYUH 2K26] Registration Received - ${event.title}`,
        sentAt: new Date().toLocaleTimeString()
      };
      setEmailLogs(prev => [newLog, ...prev]);

      alert("Registration saved and simulated verification email dispatched successfully!");
      setShowAddForm(false);
      
      // Reset form
      setTeamName("");
      setLeadName("");
      setLeadEmail("");
      setLeadPhone("");
      setLeadRollNo("");
      setMembers([]);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save registration due to database constraints.");
    }
  };

  const handleStatusChangeClick = (reg: Registration, status: 'approved' | 'rejected') => {
    setTargetStatus(status);
    setSelectedReg(reg);
    setRemarks("");
    setShowStatusModal(true);
  };

  const handleConfirmStatus = async () => {
    if (!selectedReg || !targetStatus) return;

    try {
      const updated = await dbService.updateRegistrationStatus(
        selectedReg.id,
        targetStatus,
        remarks,
        user.displayName
      );

      // Trigger Simulated confirmation email dispatch
      const templateSubject = targetStatus === "approved" 
        ? `[CHAKRAVYUH 2K26] CONGRATULATIONS! Registration Approved - ${selectedReg.eventTitle}`
        : `[CHAKRAVYUH 2K26] ACTION REQUIRED: Registration Rejected - ${selectedReg.eventTitle}`;

      const templateBody = targetStatus === "approved"
        ? `Dear ${selectedReg.leadName}, Your entry has been APPROVED. Your fixtures details will be shared soon.`
        : `Dear ${selectedReg.leadName}, Your entry has been REJECTED. Reason: ${remarks}.`;

      const newLog = {
        id: `email_${Date.now()}`,
        to: selectedReg.leadEmail,
        subject: templateSubject,
        sentAt: new Date().toLocaleTimeString()
      };
      setEmailLogs(prev => [newLog, ...prev]);

      // Update UI local list
      setRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReg(null);
      setShowStatusModal(false);
    } catch (err) {
      console.error(err);
      alert("Error processing transaction.");
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this registration record? This cannot be undone.")) {
      try {
        await dbService.deleteRegistration(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCheckIn = async (registration: Registration) => {
    try {
      const updated = await dbService.checkInRegistration(registration.id);
      setRegistrations(previous => previous.map(item => item.id === updated.id ? updated : item));
      setSelectedReg(updated);
    } catch (err) {
      console.error(err);
      alert("Check-in could not be recorded.");
    }
  };

  // CSV/Excel Exporter logic (Client-side fast streaming download)
  const handleExport = (format: "csv" | "excel") => {
    if (registrations.length === 0) {
      alert("No registration records available to export.");
      return;
    }

    let fileContent = "";
    const filename = `Chakravyuh_Registrations_${Date.now()}.${format === "csv" ? "csv" : "xls"}`;

    // Header columns
    const headers = [
      "ID", "Sport Title", "Sport Type", "Status", "Registered At", 
      "Team Name", "Captain Name", "Captain Email", "Captain Phone", 
      "Captain RollNo", "Captain College", "Captain Branch", "Captain Year", "Total Team Members"
    ];

    if (format === "csv") {
      fileContent += headers.join(",") + "\n";
      filteredRegistrations.forEach(r => {
        const row = [
          r.id,
          `"${r.eventTitle.replace(/"/g, '""')}"`,
          r.sportType,
          r.status,
          r.registeredAt,
          r.teamName ? `"${r.teamName.replace(/"/g, '""')}"` : "",
          `"${r.leadName.replace(/"/g, '""')}"`,
          r.leadEmail,
          r.leadPhone,
          r.leadRollNo,
          `"${r.leadCollege.replace(/"/g, '""')}"`,
          r.leadBranch,
          r.leadYear,
          r.members ? r.members.length : 0
        ];
        fileContent += row.join(",") + "\n";
      });
    } else {
      // Basic Tab-separated XML values for XLS
      fileContent += "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>";
      fileContent += "<head><meta charset='utf-8'></head><body><table><thead><tr>";
      headers.forEach(h => { fileContent += `<th>${h}</th>`; });
      fileContent += "</tr></thead><tbody>";
      filteredRegistrations.forEach(r => {
        fileContent += "<tr>";
        fileContent += `<td>${r.id}</td>`;
        fileContent += `<td>${r.eventTitle}</td>`;
        fileContent += `<td>${r.sportType}</td>`;
        fileContent += `<td>${r.status}</td>`;
        fileContent += `<td>${r.registeredAt}</td>`;
        fileContent += `<td>${r.teamName || ""}</td>`;
        fileContent += `<td>${r.leadName}</td>`;
        fileContent += `<td>${r.leadEmail}</td>`;
        fileContent += `<td>${r.leadPhone}</td>`;
        fileContent += `<td>${r.leadRollNo}</td>`;
        fileContent += `<td>${r.leadCollege}</td>`;
        fileContent += `<td>${r.leadBranch}</td>`;
        fileContent += `<td>${r.leadYear}</td>`;
        fileContent += `<td>${r.members ? r.members.length : 0}</td>`;
        fileContent += "</tr>";
      });
      fileContent += "</tbody></table></body></html>";
    }

    const blob = new Blob([fileContent], { type: format === "csv" ? "text/csv;charset=utf-8;" : "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live filter query processing
  const filteredRegistrations = registrations.filter(reg => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      reg.leadName.toLowerCase().includes(query) ||
      reg.leadRollNo.includes(query) ||
      reg.leadEmail.toLowerCase().includes(query) ||
      (reg.teamName && reg.teamName.toLowerCase().includes(query)) ||
      reg.id.toLowerCase().includes(query);

    const matchesSport = selectedSportFilter === "all" || reg.eventId === selectedSportFilter;
    const matchesStatus = selectedStatusFilter === "all" || reg.status === selectedStatusFilter;

    return matchesSearch && matchesSport && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Structuring student logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Add buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">Dynamic Registration Desk</h2>
          <p className="text-xs text-gray-500 mt-1">Audit, approve, or manually enroll individual and team applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Registration</span>
          </button>
        </div>
      </div>

      {/* Manual Registration Entry Form Box */}
      {showAddForm && (
        <div className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6 relative">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono">
              Enlist Student Registration Form
            </h3>
            <button 
              onClick={() => setShowAddForm(false)}
              className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Sport */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Select Sport / Event Category *</label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white outline-none"
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                >
                  <option value="">-- Choose Sport --</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} ({ev.type})</option>
                  ))}
                </select>
              </div>

              {/* Team Name if applicable */}
              {selectedEventId && events.find(e => e.id === selectedEventId)?.type === "team" && (
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Roster / Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., IMSEC Strykers"
                    className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Captain / Lead Details */}
            <div className="border-t border-gray-800 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-gray-300 font-mono">Captain / Registrant Core Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Registrant Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Registrant Full Name"
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 rounded-lg text-xs text-white"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">College Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2301430100055"
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 rounded-lg text-xs text-white font-mono"
                    value={leadRollNo}
                    onChange={(e) => setLeadRollNo(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 rounded-lg text-xs text-white font-mono"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9898989898"
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 rounded-lg text-xs text-white font-mono"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Home Institution *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 rounded-lg text-xs text-white"
                    value={leadCollege}
                    onChange={(e) => setLeadCollege(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Branch</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 rounded-lg text-xs text-white"
                    value={leadBranch}
                    onChange={(e) => setLeadBranch(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Year of Study</label>
                  <select
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 rounded-lg text-xs text-white"
                    value={leadYear}
                    onChange={(e) => setLeadYear(e.target.value)}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Team Members Fields based on selected Sport sizes */}
            {selectedEventId && members.length > 0 && (
              <div className="border-t border-gray-800 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-300 font-mono">Roster Team Members Credentials (Optional slots within max size)</h4>
                  <span className="text-[10px] text-gray-500 font-mono">Fill in player slots to complete roster registration.</span>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {members.map((member, idx) => (
                    <div key={idx} className="p-3 bg-[#0d0f12] border border-gray-800/60 rounded-xl space-y-3">
                      <p className="text-[10px] font-bold text-orange-400 font-mono">Athlete Player #{idx + 2}</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="Member Name"
                          className="px-3 py-2 bg-[#12141a] border border-gray-800 rounded-lg text-xs text-white"
                          value={member.name}
                          onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Roll Number"
                          className="px-3 py-2 bg-[#12141a] border border-gray-800 rounded-lg text-xs text-white font-mono"
                          value={member.rollNo}
                          onChange={(e) => handleMemberChange(idx, "rollNo", e.target.value)}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          className="px-3 py-2 bg-[#12141a] border border-gray-800 rounded-lg text-xs text-white font-mono"
                          value={member.email}
                          onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          className="px-3 py-2 bg-[#12141a] border border-gray-800 rounded-lg text-xs text-white font-mono"
                          value={member.phone}
                          onChange={(e) => handleMemberChange(idx, "phone", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t border-gray-800 pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Enroll & Complete Roster
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Control, Filters, Export Ribbon */}
      <div className="bg-[#12141a] border border-gray-800/80 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by lead name, team, roll number or application ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-500 outline-none transition-all font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Action Controls Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Sport Filter */}
          <div className="flex items-center gap-1.5 bg-[#0d0f12] border border-gray-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              className="bg-transparent text-xs text-gray-300 outline-none border-none cursor-pointer pr-1"
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
            >
              <option value="all">All Sports</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#0d0f12] border border-gray-800 rounded-xl px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <select
              className="bg-transparent text-xs text-gray-300 outline-none border-none cursor-pointer pr-1"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1 bg-[#0d0f12] border border-gray-800 rounded-xl overflow-hidden p-0.5">
            <button
              onClick={() => handleExport("csv")}
              title="Download CSV report"
              className="px-3 py-1.5 hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 transition-all text-xs font-semibold font-mono flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <div className="w-[1px] h-4 bg-gray-800"></div>
            <button
              onClick={() => handleExport("excel")}
              title="Download Excel report"
              className="px-3 py-1.5 hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 transition-all text-xs font-semibold font-mono flex items-center gap-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>

        </div>

      </div>

      {/* Registrations List Grid/Table layout */}
      <div className="bg-[#12141a] border border-gray-800/80 rounded-2xl overflow-hidden">
        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-xs text-gray-500 italic font-mono">No matching student registrations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800/80 bg-gray-800/10 text-[10px] font-mono tracking-wider text-gray-500 uppercase">
                  <th className="p-4">Application Details</th>
                  <th className="p-4">Registrant / Lead</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Submission</th>
                  <th className="p-4">Verification State</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-xs">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-800/10 transition-colors group">
                    
                    {/* Event & Team Name */}
                    <td className="p-4">
                      <div>
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700">
                          {reg.id}
                        </span>
                        <h4 className="font-bold text-gray-200 mt-1.5 group-hover:text-orange-500 transition-colors">
                          {reg.eventTitle}
                        </h4>
                        {reg.teamName && (
                          <p className="text-[11px] text-gray-400 mt-0.5 font-mono flex items-center gap-1">
                            <CornerDownRight className="w-3.5 h-3.5 text-gray-600" />
                            <span>Team: <strong>{reg.teamName}</strong> ({reg.members ? reg.members.length + 1 : 1} Players)</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Lead student details */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-200">{reg.leadName}</p>
                        <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
                          <Building className="w-3 h-3 text-gray-600" />
                          <span>{reg.leadRollNo} | {reg.leadCollege}</span>
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-gray-600" />
                          <span>{reg.leadEmail}</span>
                        </p>
                      </div>
                    </td>

                    {/* Sport style */}
                    <td className="p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                        {reg.sportType}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-gray-400 font-mono text-[10px]">
                      {new Date(reg.registeredAt).toLocaleString()}
                    </td>

                    {/* Badge status */}
                    <td className="p-4">
                      <div className="inline-flex flex-col">
                        <span className={`
                          px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase border inline-block text-center
                          ${reg.status === "approved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""}
                          ${reg.status === "pending" ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse" : ""}
                          ${reg.status === "rejected" ? "bg-red-500/10 border-red-500/30 text-red-400" : ""}
                        `}>
                          {reg.status}
                        </span>
                        {reg.remarks && (
                          <span className="text-[9px] text-red-400 font-mono mt-1 max-w-xs truncate" title={reg.remarks}>
                            Reason: {reg.remarks}
                          </span>
                        )}
                        {/* Payment status add-on badge */}
                        {reg.paymentStatus && (
                          <span className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase border inline-flex items-center gap-1 ${
                            reg.paymentStatus === "payment_verified" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                            reg.paymentStatus === "payment_submitted" ? "bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse" :
                            reg.paymentStatus === "payment_rejected" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                            "bg-gray-500/10 border-gray-500/30 text-gray-400"
                          }`}>
                            <QrCode className="w-2.5 h-2.5" />
                            {reg.paymentStatus === "payment_verified" ? "Paid ✓" :
                             reg.paymentStatus === "payment_submitted" ? "UTR Pending" :
                             reg.paymentStatus === "payment_rejected" ? "Pay Rejected" : "Unpaid"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action buttons list */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-semibold transition-all"
                          title="View entire roster details"
                        >
                          View Roster
                        </button>
                        
                        {reg.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleStatusChangeClick(reg, "approved")}
                              className="p-1.5 bg-emerald-950/40 hover:bg-emerald-500/20 border border-emerald-900/40 hover:border-emerald-500/50 text-emerald-400 rounded-lg transition-all"
                              title="Approve registration"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStatusChangeClick(reg, "rejected")}
                              className="p-1.5 bg-red-950/40 hover:bg-red-500/20 border border-red-900/40 hover:border-red-500/50 text-red-400 rounded-lg transition-all"
                              title="Reject registration"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleStatusChangeClick(reg, reg.status === "approved" ? "rejected" : "approved")}
                            className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg transition-all"
                            title="Re-evaluate status"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* UTR Verify buttons — add-on, only shows when student submitted payment */}
                        {reg.paymentStatus === "payment_submitted" && user.role === "super_admin" && (
                          <>
                            <button
                              onClick={async () => {
                                await dbService.updatePaymentStatus(reg.id, "payment_verified", "", user.displayName);
                                setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, paymentStatus: "payment_verified" } : r));
                              }}
                              className="p-1.5 bg-blue-950/40 hover:bg-blue-500/20 border border-blue-900/40 hover:border-blue-500/50 text-blue-400 rounded-lg transition-all"
                              title={`Verify payment — UTR: ${reg.utrNumber}`}
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                await dbService.updatePaymentStatus(reg.id, "payment_rejected", "Payment could not be verified", user.displayName);
                                setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, paymentStatus: "payment_rejected" } : r));
                              }}
                              className="p-1.5 bg-orange-950/40 hover:bg-orange-500/20 border border-orange-900/40 hover:border-orange-500/50 text-orange-400 rounded-lg transition-all"
                              title="Reject payment"
                            >
                              <BadgeX className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteRegistration(reg.id)}
                          className="p-1.5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-lg transition-all"
                          title="Delete Record"
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

      {/* Roster detail view modal drawer */}
      {selectedReg && !showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-[#11131a] border-l border-gray-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                    ID: {selectedReg.id}
                  </span>
                  <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono mt-1.5">
                    Registration Roster Info
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedReg(null)}
                  className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Event name & Status */}
              <div className="space-y-6">
                <div className="p-4 bg-gray-800/10 border border-gray-800 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 font-mono">Sport Category</span>
                  <h4 className="text-base font-bold text-white font-mono">{selectedReg.eventTitle}</h4>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
                    <span className="text-xs text-gray-400 font-mono">Current Status:</span>
                    <span className={`
                      px-3 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border
                      ${selectedReg.status === "approved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""}
                      ${selectedReg.status === "pending" ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse" : ""}
                      ${selectedReg.status === "rejected" ? "bg-red-500/10 border-red-500/30 text-red-400" : ""}
                    `}>
                      {selectedReg.status}
                    </span>
                  </div>
                </div>

                {/* Lead Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-800 pb-1.5">Captain / Lead athlete</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="block text-[9px] text-gray-600 font-bold">NAME</span>
                      <span className="text-white font-semibold">{selectedReg.leadName}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-600 font-bold">ROLL NUMBER</span>
                      <span className="text-white">{selectedReg.leadRollNo}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-600 font-bold">EMAIL</span>
                      <span className="text-white select-all">{selectedReg.leadEmail}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-600 font-bold">PHONE</span>
                      <span className="text-white select-all">{selectedReg.leadPhone}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-600 font-bold">COLLEGE / INSTITUTION</span>
                      <span className="text-white">{selectedReg.leadCollege}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-600 font-bold">BRANCH & YEAR</span>
                      <span className="text-white">{selectedReg.leadBranch} ({selectedReg.leadYear})</span>
                    </div>
                  </div>
                </div>

                {/* Team Roster List details if applicable */}
                {selectedReg.members && selectedReg.members.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-800 pb-1.5">Active Team Members Roster</h4>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
                      {selectedReg.members.map((member, i) => (
                        <div key={i} className="p-3 bg-gray-800/10 border border-gray-800/60 rounded-xl space-y-1.5 text-xs font-mono">
                          <p className="font-bold text-orange-400">Athlete Player #{i + 2}: {member.name}</p>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
                            <p>ID: {member.rollNo}</p>
                            <p>Mob: {member.phone}</p>
                            <p className="col-span-2 truncate">Mail: {member.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment info panel — add-on, shown only if payment data exists */}
                {selectedReg.paymentStatus && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-800 pb-1.5 flex items-center gap-1.5">
                      <IndianRupee className="w-3 h-3 text-orange-400" />
                      Payment Status
                    </h4>
                    <div className="p-3 bg-gray-800/10 border border-gray-800/60 rounded-xl space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Payment Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          selectedReg.paymentStatus === "payment_verified" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                          selectedReg.paymentStatus === "payment_submitted" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                          selectedReg.paymentStatus === "payment_rejected" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                          "bg-gray-500/10 border-gray-500/30 text-gray-400"
                        }`}>
                          {selectedReg.paymentStatus.replace(/_/g, " ")}
                        </span>
                      </div>
                      {selectedReg.utrNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">UTR / Txn ID:</span>
                          <span className="text-white select-all font-bold">{selectedReg.utrNumber}</span>
                        </div>
                      )}
                      {selectedReg.paymentSubmittedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Submitted At:</span>
                          <span className="text-gray-300">{new Date(selectedReg.paymentSubmittedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedReg.paymentStatus === "payment_submitted" && user.role === "super_admin" && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={async () => {
                              await dbService.updatePaymentStatus(selectedReg.id, "payment_verified", "", user.displayName);
                              const updated = { ...selectedReg, paymentStatus: "payment_verified" as const };
                              setSelectedReg(updated);
                              setRegistrations(prev => prev.map(r => r.id === selectedReg.id ? updated : r));
                            }}
                            className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-600/30 text-emerald-400 font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1"
                          >
                            <BadgeCheck className="w-3 h-3" /> Verify Payment
                          </button>
                          <button
                            onClick={async () => {
                              await dbService.updatePaymentStatus(selectedReg.id, "payment_rejected", "Payment could not be verified", user.displayName);
                              const updated = { ...selectedReg, paymentStatus: "payment_rejected" as const };
                              setSelectedReg(updated);
                              setRegistrations(prev => prev.map(r => r.id === selectedReg.id ? updated : r));
                            }}
                            className="flex-1 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1"
                          >
                            <BadgeX className="w-3 h-3" /> Reject Payment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions at footer */}
            <div className="border-t border-gray-800 pt-4 flex gap-3 mt-6">
              {selectedReg.status === "pending" && (
                <>
                  <button
                    onClick={() => handleStatusChangeClick(selectedReg, "approved")}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    Approve Entry
                  </button>
                  <button
                    onClick={() => handleStatusChangeClick(selectedReg, "rejected")}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    Reject Entry
                  </button>
                </>
              )}
              {selectedReg.status === "approved" && !selectedReg.checkedIn && (
                <button
                  onClick={() => handleCheckIn(selectedReg)}
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Mark Checked In
                </button>
              )}
              {selectedReg.checkedIn && (
                <span className="flex-1 py-2 text-center text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold">Checked In</span>
              )}
              <button
                onClick={() => setSelectedReg(null)}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Confirmation & Remarks Input Modal overlay */}
      {showStatusModal && selectedReg && targetStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#12141a] border border-gray-800 p-6 rounded-2xl space-y-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-orange-500">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="text-sm uppercase tracking-wider font-bold font-mono text-white">
                Confirm {targetStatus === "approved" ? "Approval" : "Rejection"}
              </h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Are you sure you want to change the status of <strong>{selectedReg.leadName}</strong>'s registration for <strong>{selectedReg.eventTitle}</strong> to <strong className="uppercase text-orange-400">{targetStatus}</strong>?
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold">
                Verification Remarks / Comments
              </label>
              <textarea
                rows={3}
                placeholder={targetStatus === "rejected" ? "State reason for rejection, e.g. Mismatched student ID cards..." : "Add approvals notes or verification codes..."}
                className="w-full p-3 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmStatus}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition-all ${
                  targetStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm {targetStatus === "approved" ? "Approve" : "Reject"}
              </button>
              <button
                onClick={() => { setShowStatusModal(false); setTargetStatus(null); }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Automated Email dispatcher ticker log */}
      {emailLogs.length > 0 && (
        <div className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-gray-300 font-mono">Automated Email Dispatch logs</h3>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
            {emailLogs.map(log => (
              <div key={log.id} className="p-2.5 bg-[#0d0f12] border border-gray-800/40 rounded-xl text-[10px] font-mono text-gray-400 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400">⚡ DISPATCHED: </span>
                  <span className="text-gray-300">{log.to}</span>
                  <span className="text-gray-500 font-sans block mt-0.5">{log.subject}</span>
                </div>
                <span className="text-gray-600">{log.sentAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
