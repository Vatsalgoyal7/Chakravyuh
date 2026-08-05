import React, { useEffect, useState } from "react";
import { 
  Trophy, 
  User, 
  Mail, 
  Phone, 
  School, 
  Award, 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Users,
  Printer,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  MapPin,
  ArrowRight,
  QrCode
} from "lucide-react";
import { dbService } from "../lib/dbService";
import { SportEvent, Registration, TeamMember, PaymentConfig } from "../types";
import { useTheme } from "../lib/ThemeContext";

interface PublicRegistrationProps {
  preselectedEventId?: string | null;
  onClearPreselection?: () => void;
  onNavigateToSchedule?: () => void;
}

export default function PublicRegistration({ 
  preselectedEventId, 
  onClearPreselection,
  onNavigateToSchedule
}: PublicRegistrationProps) {
  const { isWhiteBg } = useTheme();
  
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Wizard steps: 1 = Sport, 2 = Captain, 3 = Squad (if team), 4 = Logistics, 5 = Review
  const [currentStep, setCurrentStep] = useState(1);
  const [isImsecStudent, setIsImsecStudent] = useState(true);
  
  // Form states
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCollege, setLeadCollege] = useState("IMS Engineering College");
  const [leadRollNo, setLeadRollNo] = useState("");
  const [leadBranch, setLeadBranch] = useState("");
  const [leadYear, setLeadYear] = useState("3rd Year");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [teamName, setTeamName] = useState("");
  
  useEffect(() => {
    if (isImsecStudent) {
      setLeadCollege("IMS Engineering College");
    } else {
      setLeadCollege("");
    }
  }, [isImsecStudent]);
  
  // Logistics states
  const [isOutstation, setIsOutstation] = useState(false);
  const [travelMode, setTravelMode] = useState(""); // travel mode for outstation teams
  const [agreeRules, setAgreeRules] = useState(false);
  
  // Team members state
  const [members, setMembers] = useState<TeamMember[]>([]);
  
  // Submit status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Payment verification state
  const [utrInput, setUtrInput] = useState("");
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrSubmitted, setUtrSubmitted] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerMobile, setPayerMobile] = useState("");
  const [successData, setSuccessData] = useState<Registration | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Payment add-on states
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [selectedQRIndex, setSelectedQRIndex] = useState(0);

  // Load all active events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const list = await dbService.getEvents();
        const activeOnly = list.filter(e => e.isActive);
        setEvents(activeOnly);

        // Handle preselected event
        if (preselectedEventId) {
          const pre = activeOnly.find(e => e.id === preselectedEventId);
          if (pre) {
            setSelectedEvent(pre);
            initializeMembersForEvent(pre);
          }
        } else if (activeOnly.length > 0) {
          setSelectedEvent(activeOnly[0]);
          initializeMembersForEvent(activeOnly[0]);
        }
      } catch (err) {
        console.error("Error loading events in registration:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [preselectedEventId]);

  // Load payment config (add-on)
  useEffect(() => {
    dbService.getPaymentConfig().then(cfg => setPaymentConfig(cfg));
  }, []);

  const initializeMembersForEvent = (event: SportEvent) => {
    if (event.type === "team") {
      const countToInitialize = Math.max(0, event.minTeamSize - 1);
      const initial: TeamMember[] = Array.from({ length: countToInitialize }, () => ({
        name: "",
        email: "",
        phone: "",
        rollNo: "",
        college: leadCollege || "IMS Engineering College"
      }));
      setMembers(initial);
    } else {
      setMembers([]);
    }
  };

  const handleEventChange = (eventId: string) => {
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      setSelectedEvent(ev);
      initializeMembersForEvent(ev);
      setErrorMsg("");
    }
  };

  const addMember = () => {
    if (!selectedEvent) return;
    const maxCapacity = selectedEvent.maxTeamSize - 1; // minus lead
    if (members.length >= maxCapacity) {
      setErrorMsg(`Cannot add more players. Maximum roster limit for ${selectedEvent.title} is ${selectedEvent.maxTeamSize}.`);
      return;
    }
    setMembers([
      ...members,
      { name: "", email: "", phone: "", rollNo: "", college: leadCollege || "IMS Engineering College" }
    ]);
    setErrorMsg("");
  };

  const removeMember = (index: number) => {
    if (!selectedEvent) return;
    const minRequired = selectedEvent.minTeamSize - 1; // minus lead
    if (members.length <= minRequired) {
      setErrorMsg(`Roster requires at least ${selectedEvent.minTeamSize} players (including Team Captain) for ${selectedEvent.title}.`);
      return;
    }
    const copy = [...members];
    copy.splice(index, 1);
    setMembers(copy);
    setErrorMsg("");
  };

  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const copy = [...members];
    copy[index] = { ...copy[index], [field]: value };
    setMembers(copy);
  };

  const validateStep = (step: number): boolean => {
    setErrorMsg("");
    if (step === 1) {
      if (!selectedEvent) {
        setErrorMsg("Please select a sport discipline.");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim() || !leadRollNo.trim() || !leadCollege.trim() || !leadBranch.trim()) {
        setErrorMsg("Please complete all captain / athlete details.");
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (selectedEvent?.type === "team") {
        const totalRoster = members.length + 1;
        if (totalRoster < selectedEvent.minTeamSize) {
          setErrorMsg(`Roster size must be at least ${selectedEvent.minTeamSize} athletes. Currently it is ${totalRoster}.`);
          return false;
        }
        for (let i = 0; i < members.length; i++) {
          const m = members[i];
          if (!m.name.trim() || !m.rollNo.trim() || !m.college.trim()) {
            setErrorMsg(`Please fill in Name, Roll No & College for Player #${i + 2}.`);
            return false;
          }
        }
      }
      return true;
    }
    if (step === 4) {
      return true;
    }
    if (step === 5) {
      if (!agreeRules) {
        setErrorMsg("You must agree to the tournament code of conduct rules to submit.");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && selectedEvent?.type === "individual") {
        // Skip step 3 (Squad Roster) for individual sports
        setCurrentStep(4);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handlePrevStep = () => {
    setErrorMsg("");
    if (currentStep === 4 && selectedEvent?.type === "individual") {
      setCurrentStep(2);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5) || !selectedEvent) return;

    const freshEvents = await dbService.getEvents();
    const freshEvent = freshEvents.find(e => e.id === selectedEvent.id) || selectedEvent;
    if ((freshEvent.registrationCount || 0) >= freshEvent.maxRegistrations) {
      setErrorMsg("Registration capacity has been reached for this event. Please contact the event coordinator.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    
    const duplicateCheckHash = `${selectedEvent.id}_${leadRollNo.trim()}`;

    const regData = {
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      sportType: selectedEvent.type,
      status: "pending" as const,
      leadName: leadName.trim(),
      leadEmail: leadEmail.trim(),
      leadPhone: leadPhone.trim(),
      leadCollege: leadCollege.trim(),
      leadRollNo: leadRollNo.trim(),
      leadBranch: leadBranch.trim(),
      leadYear,
      gender,
      teamName: teamName.trim(),
      members: selectedEvent.type === "team" ? members : [],
      duplicateCheckHash,
      isOutstation,
      travelMode: isOutstation ? travelMode : "",
      remarks: "",
      paymentStatus: isImsecStudent ? ("ims_student" as const) : ("pending_payment" as const)
    };

    try {
      const response = await dbService.saveRegistration(regData);
      
      // Save details to localStorage for retrieval if student loses the tracking ID
      try {
        const stored = localStorage.getItem("chakravyuh_my_registrations");
        const list = stored ? JSON.parse(stored) : [];
        if (!list.some((item: any) => item.trackingCode === response.trackingCode)) {
          list.push({
            trackingCode: response.trackingCode,
            eventTitle: response.eventTitle,
            leadName: response.leadName,
            registeredAt: response.registeredAt,
            status: response.status
          });
          localStorage.setItem("chakravyuh_my_registrations", JSON.stringify(list));
        }
      } catch (localErr) {
        console.error("LocalStorage save registration failed:", localErr);
      }

      setSuccessData(response);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err?.message || "Registration failed. A player with this Roll Number is likely already registered under this sport.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySlipId = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.trackingCode);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2000);
  };

  const startNewReg = () => {
    setSuccessData(null);
    setCurrentStep(1);
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadRollNo("");
    setLeadBranch("");
    setTeamName("");
    setIsOutstation(false);
    setTravelMode("");
    setAgreeRules(false);
    if (onClearPreselection) onClearPreselection();
    if (selectedEvent) {
      initializeMembersForEvent(selectedEvent);
    }
  };

  if (loading) {
    return (
      <div className={`${isWhiteBg ? 'bg-white text-gray-900' : 'bg-[#0d0f12] text-white'} min-h-screen flex items-center justify-center font-mono text-xs`}>
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
          <span>Syncing registration engine...</span>
        </div>
      </div>
    );
  }

  // Calculate step header info
  const stepTitles = [
    "Discipline",
    "Captain Info",
    selectedEvent?.type === "team" ? "Squad Roster" : "",
    "Logistics",
    "Submit"
  ].filter(Boolean);

  return (
    <div className={`bg-transparent min-h-screen py-12 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Success Slip View */}
        {successData ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
              <div className={`w-16 h-16 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ${isWhiteBg ? 'bg-emerald-50 text-emerald-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className={`text-2xl font-black uppercase tracking-widest font-mono ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                REGISTRATION RECEIVED!
              </h2>
              <p className={`text-xs mt-2 font-mono ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>
                Roster recorded successfully. Your official admission pass is generated.
              </p>
            </div>

            {/* Premium Ticket Roster Stub layout */}
            <div className={`relative rounded-3xl overflow-hidden shadow-2xl mb-8 border ${isWhiteBg ? 'bg-white border-gray-300' : 'bg-[#12151a] border-orange-500/15'}`}>
              {/* Ticket Cutouts */}
              <div className={`hidden md:block absolute top-1/2 -left-3.5 w-7 h-7 border-r rounded-full -translate-y-1/2 z-10 ${isWhiteBg ? 'bg-white border-gray-300' : 'bg-[#0d0f12] border-orange-500/15'}`} />
              <div className={`hidden md:block absolute top-1/2 -right-3.5 w-7 h-7 border-l rounded-full -translate-y-1/2 z-10 ${isWhiteBg ? 'bg-white border-gray-300' : 'bg-[#0d0f12] border-orange-500/15'}`} />

              <div className="grid grid-cols-1 md:grid-cols-12">
                
                {/* Main Pass Info: 8 cols */}
                <div className={`md:col-span-8 p-6 md:p-8 space-y-6 font-mono text-xs border-r ${isWhiteBg ? 'border-gray-200' : 'border-white/[0.05]'}`}>
                  <div className={`flex justify-between items-start border-b pb-4 ${isWhiteBg ? 'border-gray-200' : 'border-white/[0.05]'}`}>
                    <div>
                      <span className={`text-[9px] font-bold block uppercase tracking-wider ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>CHAKRAVYUH 2K26 EVENT PASS</span>
                      <h3 className={`text-lg font-black uppercase mt-1 leading-tight ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>{successData.eventTitle}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${isWhiteBg ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                      PENDING AUDIT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className={`text-[9px] block uppercase font-bold ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>ROSTER TYPE</span>
                      <span className={`font-bold text-xs uppercase ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>{successData.sportType}</span>
                    </div>
                    {successData.teamName && (
                      <div>
                        <span className={`text-[9px] block uppercase font-bold ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>TEAM NAME</span>
                        <span className="font-bold text-xs uppercase truncate block text-orange-400">{successData.teamName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className={`text-[9px] block uppercase font-bold ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>ATHLETE ROSTER</span>
                    <div className={`border p-3 rounded-2xl space-y-2 max-h-36 overflow-y-auto pr-1 ${isWhiteBg ? 'bg-gray-50 border-gray-300' : 'bg-[#08090c] border-white/[0.04]'}`}>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className={`font-bold ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>{successData.leadName} (Captain)</span>
                        <span className={isWhiteBg ? 'text-gray-600' : 'text-gray-500'}>{successData.leadRollNo} &bull; {successData.leadBranch}</span>
                      </div>
                      {successData.members && successData.members.map((m, idx) => (
                        <div key={idx} className={`flex justify-between items-center text-[10px] border-t pt-2 ${isWhiteBg ? 'border-gray-300 text-gray-700' : 'border-white/[0.03] text-gray-300'}`}>
                          <span className="font-semibold">{m.name}</span>
                          <span className={isWhiteBg ? 'text-gray-600' : 'text-gray-500'}>{m.rollNo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`border-t pt-4 grid grid-cols-2 gap-4 text-[10px] ${isWhiteBg ? 'border-gray-200 text-gray-600' : 'border-white/[0.05] text-gray-400'}`}>
                    <div>
                      <span className={`text-[9px] block uppercase font-bold ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>REPRESENTING</span>
                      <span className={`truncate block mt-0.5 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>{successData.leadCollege}</span>
                    </div>
                    <div>
                      <span className={`text-[9px] block uppercase font-bold ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>DATE GENERATED</span>
                      <span className={`block mt-0.5 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>{new Date(successData.registeredAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Stub details: 4 cols */}
                <div className={`md:col-span-4 p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-dashed font-mono text-xs text-center relative ${isWhiteBg ? 'bg-gray-50 border-gray-300' : 'bg-[#181d26] border-white/[0.08]'}`}>
                  <div className="space-y-4">
                    <div>
                      <span className={`text-[9px] block uppercase font-bold tracking-wider ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>TRACKING CODE</span>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className="text-orange-400 font-black text-sm">{successData.trackingCode}</span>
                        <button onClick={handleCopySlipId} className={`p-1 rounded-lg transition-all cursor-pointer ${isWhiteBg ? 'hover:bg-gray-200 text-gray-600 hover:text-gray-900' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}>
                          {copiedSlip ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Stylized Simulated Barcode */}
                    <div className={`py-2.5 px-4 rounded-xl border inline-block w-full ${isWhiteBg ? 'bg-gray-100 border-gray-300' : 'bg-white/5 border-white/[0.04]'}`}>
                      <div className="flex justify-between h-8 opacity-75">
                        <div className={`w-1.5 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-0.5 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-1 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-0.5 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-1.5 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-0.5 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-1 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-2 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-0.5 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                        <div className={`w-1 h-full ${isWhiteBg ? 'bg-gray-900' : 'bg-white'}`}></div>
                      </div>
                      <span className={`block text-[8px] tracking-[0.25em] font-mono mt-1 font-bold ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>CHAKRAVYUH2026</span>
                    </div>
                  </div>

                  <div className={`mt-6 border-t pt-4 space-y-2 text-[10px] text-left ${isWhiteBg ? 'border-gray-300 text-gray-600' : 'border-white/[0.05] text-gray-500'}`}>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      <span>Travel Mode: {successData.travelMode || (successData.isOutstation ? "Not specified" : "N/A")}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-orange-500" />
                      <span>Outstation: {successData.isOutstation ? "Yes" : "No"}</span>
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Host Student ID verification notice (instead of payment) */}
            {successData && successData.paymentStatus === "ims_student" && (
              <div className={`rounded-3xl border p-6 space-y-4 font-mono text-xs animate-in fade-in duration-300 ${
                isWhiteBg ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-500/[0.03] border-purple-500/10'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                    <School className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className={`font-black text-sm uppercase tracking-wider ${isWhiteBg ? 'text-gray-900' : 'text-purple-400'}`}>
                      IMSEC Student ID Verification Required
                    </p>
                    <p className={`text-[11px] leading-relaxed ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>
                      Since you are a student of IMS Engineering College, online payment is bypassed. Your registration will be verified offline. Please bring your physical **College ID Card** on match day to confirm your spot.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Section — add-on, shown only if payment is enabled and not an internal IMSEC student */}
            {paymentConfig?.enabled && successData && successData.paymentStatus !== "ims_student" && !utrSubmitted && (() => {
              const activeQRs = (paymentConfig.qrCodes || []).filter(q => 
                q.isActive && (q.appliedTo === 'both' || q.appliedTo === selectedEvent?.type)
              );
              const hasQRs = activeQRs.length > 0;
              const currentQR = hasQRs ? activeQRs[Math.min(selectedQRIndex, activeQRs.length - 1)] : null;
              
              const qrImage = currentQR?.imageUrl || paymentConfig.qrImageUrl;
              const upiIdVal = currentQR?.upiId || paymentConfig.upiId;
              const baseFee = currentQR?.amountOverride !== undefined ? currentQR.amountOverride : paymentConfig.registrationFee;
              const amount = selectedEvent?.type === 'team' ? (baseFee * (members.length + 1)) : baseFee;
              const noteText = currentQR?.note || null;

              return (
                <div className={`rounded-3xl border p-6 space-y-5 font-mono text-xs animate-in fade-in duration-300 ${
                  isWhiteBg ? 'bg-white border-orange-200' : 'bg-[#12151a] border-orange-500/15'
                }`}>
                  <div className="text-center space-y-1">
                    <p className={`font-black text-sm uppercase tracking-wider ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                      Complete Payment to Confirm Slot
                    </p>
                    <p className={`text-[10px] ${isWhiteBg ? 'text-gray-500' : 'text-gray-400'}`}>
                      {paymentConfig.instructions}
                    </p>
                  </div>

                  {/* Multiple QR Selector Tabs */}
                  {hasQRs && (
                    <div className="flex flex-wrap gap-1.5 justify-center py-2 border-y border-white/[0.04] dark:border-white/5">
                      {activeQRs.map((qr, index) => (
                        <button
                          key={qr.id}
                          type="button"
                          onClick={() => setSelectedQRIndex(index)}
                          className={`px-3.5 py-1.5 rounded-xl text-[9px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                            selectedQRIndex === index
                              ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                              : isWhiteBg 
                                ? "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                                : "bg-[#08090c] border-white/[0.04] text-gray-400 hover:bg-white/[0.02]"
                          }`}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-xl shadow-black/20">
                      {qrImage ? (
                        <img src={qrImage} alt="UPI QR Code" className="w-44 h-44 object-contain" />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center">
                          <QrCode className="w-20 h-20 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className={`font-bold text-base ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>{paymentConfig.payeeName}</p>
                      <p className="text-orange-400 font-mono text-sm">{upiIdVal}</p>
                      
                      {noteText && (
                        <p className={`text-[10px] italic font-sans max-w-[200px] mx-auto text-center mt-1 px-2.5 py-0.5 rounded border ${
                          isWhiteBg ? 'bg-orange-50/50 border-orange-100 text-orange-850' : 'bg-orange-500/5 border-orange-500/10 text-orange-400'
                        }`}>{noteText}</p>
                      )}

                      {amount > 0 && (
                        <p className={`text-2xl font-black mt-1.5 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                          ₹{amount}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>
                      Payer Name
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={e => setPayerName(e.target.value)}
                      placeholder="Enter name of person who paid"
                      className={`w-full px-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-mono ${
                        isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>
                      Payer Mobile Number
                    </label>
                    <input
                      type="text"
                      value={payerMobile}
                      onChange={e => setPayerMobile(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className={`w-full px-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-mono ${
                        isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>
                      UTR / Transaction ID (after payment)
                    </label>
                    <input
                      type="text"
                      value={utrInput}
                      onChange={e => setUtrInput(e.target.value)}
                      placeholder="Enter 12-digit UTR or Transaction ID"
                      className={`w-full px-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none transition-all font-mono ${
                        isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'
                      }`}
                    />
                  </div>

                  <button
                    disabled={utrInput.trim().length < 6 || utrSubmitting || payerName.trim().length < 2 || payerMobile.trim().length < 10}
                    onClick={async () => {
                      if (!successData || utrInput.trim().length < 6 || payerName.trim().length < 2 || payerMobile.trim().length < 10) return;
                      setUtrSubmitting(true);
                      try {
                        await dbService.submitPaymentVerification({
                          registrationId: successData.id,
                          payerName: payerName.trim(),
                          payerMobile: payerMobile.trim(),
                          transactionId: utrInput.trim(),
                          amount: amount,
                          status: 'pending'
                        });
                        await dbService.updateRegistrationPaymentStatus(successData.id, 'payment_submitted', utrInput.trim());
                        setUtrSubmitted(true);
                      } catch (err) {
                        console.error(err);
                        alert("Failed to submit payment verification. Please try again.");
                      } finally {
                        setUtrSubmitting(false);
                      }
                    }}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                  >
                    {utrSubmitting ? (
                      <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <>Submit Payment Proof</>
                    )}
                  </button>
                </div>
              );
            })()}

            {/* UTR submitted confirmation */}
            {utrSubmitted && (
              <div className={`rounded-2xl border p-4 flex items-center gap-3 font-mono text-xs ${
                isWhiteBg ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Payment Proof Submitted!</p>
                  <p className="text-[10px] opacity-80 mt-0.5">UTR: {utrInput} — Admin will verify within 24 hours and approve your slot.</p>
                </div>
              </div>
            )}

            {/* Print/Reset Actions */}
            <div className="flex flex-col sm:flex-row gap-3 font-mono text-xs">
              <button
                onClick={handlePrint}
                className={`flex-1 py-3.5 rounded-2xl border transition-all flex items-center justify-center gap-2 cursor-pointer outline-none font-bold ${isWhiteBg ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300' : 'bg-[#12151a] hover:bg-gray-800 text-gray-300 border-white/[0.06]'}`}
              >
                <Printer className="w-4 h-4" />
                <span>Print Entry Slip</span>
              </button>
              <button
                onClick={startNewReg}
                className={`flex-1 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer outline-none font-bold bg-orange-500 hover:bg-orange-600 text-white`}
              >
                <Plus className="w-4 h-4" />
                <span>Register Another Team</span>
              </button>
            </div>
          </div>
        ) : (
          
          /* Form Content (Wizard Form) */
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Header titles */}
            <div className="text-center">
              <h1 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-2">
                ONLINE REGISTRATION
              </h1>
              <h2 className={`text-3xl font-extrabold uppercase tracking-tight leading-none ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                ROSTER SUBMISSION
              </h2>
              <p className={`text-xs font-mono mt-2.5 max-w-md mx-auto leading-relaxed ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>
                Assemble your squad, complete the wizard steps, and secure registration inside Firestore archives instantly.
              </p>
            </div>

            {/* Steps Progress Indicator */}
            <div className={`flex items-center justify-center max-w-md mx-auto font-mono text-[9px] font-bold border-b pb-5 ${isWhiteBg ? 'text-gray-600 border-gray-300' : 'text-gray-500 border-white/[0.05]'}`}>
              {(() => {
                // Build visible steps list — for individual sports step 3 (Roster) is skipped
                const visibleSteps = [1, 2, selectedEvent?.type === "team" ? 3 : null, 4, 5].filter(Boolean) as number[];
                return visibleSteps.map((stepVal, displayIdx) => {
                  const displayNum = displayIdx + 1; // Always 1,2,3,4 regardless of actual step numbers
                  const isCompleted = currentStep > stepVal;
                  const isActive = currentStep === stepVal;
                  const stepLabels: Record<number, string> = { 1: "Discipline", 2: "Captain", 3: "Roster", 4: "Logistics", 5: "Review" };
                  return (
                    <React.Fragment key={stepVal}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-mono text-xs transition-all ${
                          isCompleted
                            ? "bg-orange-500 border-orange-500 text-[#0d0f12]"
                            : isActive
                              ? isWhiteBg
                                ? "border-orange-500 text-orange-600 shadow-lg shadow-orange-500/10 font-black"
                                : "border-orange-500 text-orange-400 shadow-lg shadow-orange-500/10 font-black"
                              : isWhiteBg
                                ? "border-gray-300 text-gray-600 bg-gray-100"
                                : "border-white/[0.08] text-gray-500 bg-[#0d0f12]"
                        }`}>
                          {displayNum}
                        </div>
                        <span className={`uppercase tracking-wider hidden sm:inline ${isActive ? "text-orange-400 font-bold" : isWhiteBg ? "text-gray-600" : "text-gray-500"}`}>
                          {stepLabels[stepVal]}
                        </span>
                      </div>
                      {displayIdx < visibleSteps.length - 1 && (
                        <div className={`h-[1px] w-8 sm:w-12 mx-2 transition-all ${isCompleted ? "bg-orange-500" : isWhiteBg ? "bg-gray-300" : "bg-white/[0.08]"}`} />
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 font-mono text-xs">
              
              {/* Error Message */}
              {errorMsg && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in ${isWhiteBg ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs leading-relaxed">{errorMsg}</span>
                </div>
              )}
              
              {/* STEP 1: Discipline Select */}
              {currentStep === 1 && (
                <div className={`glass-panel border rounded-3xl p-6 space-y-5 animate-in fade-in duration-300 ${isWhiteBg ? 'border-gray-300 bg-white' : 'border-white/[0.05]'}`}>
                  <h3 className={`font-extrabold uppercase text-xs tracking-wider border-l-2 border-orange-500 pl-2.5 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                    1. Select Sport Category
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>Target Event Discipline</label>
                    <select
                      value={selectedEvent?.id || ""}
                      onChange={(e) => handleEventChange(e.target.value)}
                      className={`w-full p-3.5 border rounded-2xl focus:border-orange-500 focus:outline-none transition-all cursor-pointer font-bold text-xs ${isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'}`}
                    >
                      {events.map((e) => (
                        <option key={e.id} value={e.id} className={isWhiteBg ? 'bg-white text-gray-900' : 'bg-[#0c0d10] text-white'}>
                          {e.title} ({e.category} &bull; {e.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEvent && (
                    <div className={`p-4 rounded-2xl space-y-2 shadow-inner border ${isWhiteBg ? 'bg-gray-50 border-gray-300 text-gray-700' : 'bg-[#08090c]/60 border-white/[0.04] text-gray-400'}`}>
                      <div className={`flex justify-between border-b pb-2 ${isWhiteBg ? 'border-gray-300' : 'border-white/[0.03]'}`}>
                        <span>Venue Allocation:</span>
                        <strong className={isWhiteBg ? 'text-gray-900' : 'text-white'}>{selectedEvent.venue}</strong>
                      </div>
                      <div className={`flex justify-between border-b pb-2 ${isWhiteBg ? 'border-gray-300' : 'border-white/[0.03]'}`}>
                        <span>Format:</span>
                        <strong className="text-orange-400 uppercase font-black">{selectedEvent.type} ENTRY</strong>
                      </div>
                      {selectedEvent.type === "team" && (
                        <div className="flex justify-between">
                          <span>Team Roster Requirements:</span>
                          <strong className={isWhiteBg ? 'text-gray-900' : 'text-white'}>Min {selectedEvent.minTeamSize} - Max {selectedEvent.maxTeamSize} athletes</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Lead Captain Information */}
              {currentStep === 2 && (
               <div className={`border rounded-3xl p-6 space-y-5 animate-in fade-in duration-300 ${isWhiteBg ? 'bg-white border-gray-300' : 'glass-panel border-white/[0.05]'}`}>
                 <h3 className={`font-extrabold uppercase text-xs tracking-wider border-l-2 border-orange-500 pl-2.5 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                    {selectedEvent?.type === "team" ? "2. Team Captain (Lead Registrant)" : "2. Athlete Information"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajesh Kumar"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none placeholder-gray-600 transition-all font-semibold ${isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'}`}
                        />
                      </div>
                    </div>

                    {/* Enrollment / Roll No */}
                    <div className="space-y-1.5">
                      <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>Roll / Registration Number</label>
                      <div className="relative">
                        <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2301430100055"
                          value={leadRollNo}
                          onChange={(e) => setLeadRollNo(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none placeholder-gray-600 transition-all font-semibold ${isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'}`}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. rajesh@gmail.com"
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none placeholder-gray-600 transition-all font-mono ${isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'}`}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile number"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none placeholder-gray-600 transition-all font-mono ${isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'}`}
                        />
                      </div>
                    </div>

                    {/* Student Category Selector */}
                    <div className="space-y-1.5">
                      <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>Student Category</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setIsImsecStudent(true)}
                          className={`py-3 rounded-2xl border text-center transition-all cursor-pointer font-bold ${
                            isImsecStudent
                              ? "text-orange-500 border-orange-500/50 bg-orange-500/5"
                              : isWhiteBg
                                ? "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                                : "bg-[#08090c] border-white/[0.06] text-gray-400 hover:text-white"
                          }`}
                        >
                          IMSEC Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsImsecStudent(false)}
                          className={`py-3 rounded-2xl border text-center transition-all cursor-pointer font-bold ${
                            !isImsecStudent
                              ? "text-orange-500 border-orange-500/50 bg-orange-500/5"
                              : isWhiteBg
                                ? "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                                : "bg-[#08090c] border-white/[0.06] text-gray-400 hover:text-white"
                          }`}
                        >
                          Outsider / Other
                        </button>
                      </div>
                    </div>

                    {/* College */}
                    <div className="space-y-1.5">
                      <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>College Name</label>
                      <div className="relative">
                        <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          required
                          disabled={isImsecStudent}
                          placeholder="e.g. IMS Engineering College"
                          value={leadCollege}
                          onChange={(e) => setLeadCollege(e.target.value)}
                          className={`w-full pl-10 pr-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none placeholder-gray-600 transition-all font-semibold ${
                            isImsecStudent
                              ? isWhiteBg ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-[#0e1117] border-white/[0.03] text-gray-500'
                              : isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Branch & Year */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 font-bold uppercase text-[10px]">Branch</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CSE / IT"
                          value={leadBranch}
                          onChange={(e) => setLeadBranch(e.target.value)}
                          className="w-full px-3.5 py-3 bg-[#08090c] border border-white/[0.06] rounded-2xl focus:border-orange-500 focus:outline-none text-white placeholder-gray-600 transition-all font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 font-bold uppercase text-[10px]">Year</label>
                        <select
                          value={leadYear}
                          onChange={(e) => setLeadYear(e.target.value)}
                          className="w-full px-3.5 py-3.5 bg-[#08090c] border border-white/[0.06] rounded-2xl focus:border-orange-500 focus:outline-none text-white transition-all cursor-pointer font-semibold"
                        >
                          {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((yr) => (
                            <option key={yr} value={yr} className="bg-[#0c0d10]">{yr}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 font-bold uppercase text-[10px]">Gender *</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as "male" | "female")}
                          className="w-full px-3.5 py-3.5 bg-[#08090c] border border-white/[0.06] rounded-2xl focus:border-orange-500 focus:outline-none text-white transition-all cursor-pointer font-semibold"
                          required
                        >
                          <option value="male" className="bg-[#0c0d10]">Male</option>
                          <option value="female" className="bg-[#0c0d10]">Female</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Team Name (Optional) */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`block font-bold uppercase text-[10px] ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>Team / Roster Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. SQUAD ALPHA or club name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className={`w-full px-3.5 py-3 border rounded-2xl focus:border-orange-500 focus:outline-none placeholder-gray-600 transition-all font-semibold ${isWhiteBg ? 'bg-white border-gray-300 text-gray-900' : 'bg-[#08090c] border-white/[0.06] text-white'}`}
                      />
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 3: Team Roster (Only for team sports) */}
              {currentStep === 3 && selectedEvent && selectedEvent.type === "team" && (
               <div className={`border rounded-3xl p-6 space-y-5 animate-in fade-in duration-300 ${isWhiteBg ? 'bg-white border-gray-300' : 'glass-panel border-white/[0.05]'}`}>
                 <div className={`flex items-center justify-between border-b pb-3 ${isWhiteBg ? 'border-gray-200' : 'border-white/[0.04]'}`}>
                   <h3 className={`font-extrabold uppercase text-xs tracking-wider border-l-2 border-orange-500 pl-2.5 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                      3. Team Roster (Squad Details)
                    </h3>
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-xl border border-orange-500/20 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {members.length + 1} athletes total
                    </span>
                  </div>


                  {/* Dynamically added players */}
                  <div className="space-y-4 pt-2 max-h-96 overflow-y-auto pr-1">
                    {members.map((member, index) => (
                      <div key={index} className="border border-white/[0.04] bg-[#0c0d10]/40 p-4 rounded-2xl space-y-3.5 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-orange-400 tracking-wider">ATHLETE #{index + 2}</span>
                          <button
                            type="button"
                            onClick={() => removeMember(index)}
                            className="p-1.5 hover:bg-rose-500/15 hover:text-rose-400 text-gray-500 rounded-xl transition-all cursor-pointer outline-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            required
                            placeholder="Player Name"
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#08090c] border border-white/[0.05] rounded-xl focus:border-orange-500 focus:outline-none text-white placeholder-gray-600 transition-all text-[11px]"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Roll / Registration No"
                            value={member.rollNo}
                            onChange={(e) => handleMemberChange(index, "rollNo", e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#08090c] border border-white/[0.05] rounded-xl focus:border-orange-500 focus:outline-none text-white placeholder-gray-600 transition-all text-[11px]"
                          />
                          <input
                            type="text"
                            required
                            placeholder="College"
                            value={member.college}
                            onChange={(e) => handleMemberChange(index, "college", e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#08090c] border border-white/[0.05] rounded-xl focus:border-orange-500 focus:outline-none text-white placeholder-gray-600 transition-all text-[11px]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="email"
                            placeholder="Email Address (Optional)"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#08090c] border border-white/[0.05] rounded-xl focus:border-orange-500 focus:outline-none text-white placeholder-gray-600 transition-all text-[11px]"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number (Optional)"
                            value={member.phone}
                            onChange={(e) => handleMemberChange(index, "phone", e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#08090c] border border-white/[0.05] rounded-xl focus:border-orange-500 focus:outline-none text-white placeholder-gray-600 transition-all text-[11px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addMember}
                    className="w-full py-3 bg-[#08090c] hover:bg-gray-950 text-gray-400 hover:text-white border border-dashed border-white/[0.08] rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none font-bold"
                  >
                    <Plus className="w-4 h-4 text-orange-500" />
                    <span>Add Squad Athlete</span>
                  </button>
                </div>
              )}

              {/* STEP 4: Logistics & Outstation Status */}
              {currentStep === 4 && (
               <div className={`border rounded-3xl p-6 space-y-6 animate-in fade-in duration-300 font-mono text-xs ${isWhiteBg ? 'bg-white border-gray-300' : 'glass-panel border-white/[0.05]'}`}>
                 <h3 className={`font-extrabold uppercase text-xs tracking-wider border-l-2 border-orange-500 pl-2.5 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                    4. Campus Logistics & Outstation Status
                  </h3>

                  <div className="space-y-4">
                    {/* Outstation Yes/No */}
                    <div className={`p-4 rounded-2xl border ${isWhiteBg ? 'bg-gray-50 border-gray-200' : 'bg-[#0c0d10]/40 border-white/[0.04]'}`}>
                      <div className="space-y-1 mb-3">
                        <span className={`font-bold block ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>Outstation College Competing?</span>
                        <span className={`text-[10px] block leading-normal ${isWhiteBg ? 'text-gray-500' : 'text-gray-500'}`}>Is your college located outside Delhi NCR / Ghaziabad regional boundaries?</span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => { setIsOutstation(true); }}
                          className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                            isOutstation
                              ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
                              : isWhiteBg
                                ? 'bg-white border-gray-300 text-gray-600 hover:border-orange-400'
                                : 'bg-[#0d0f12] border-white/[0.06] text-gray-400 hover:border-orange-500/40'
                          }`}
                        >
                          ✓ YES — Outstation
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsOutstation(false); setTravelMode(""); }}
                          className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                            !isOutstation
                              ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
                              : isWhiteBg
                                ? 'bg-white border-gray-300 text-gray-600 hover:border-orange-400'
                                : 'bg-[#0d0f12] border-white/[0.06] text-gray-400 hover:border-orange-500/40'
                          }`}
                        >
                          ✗ NO — Local College
                        </button>
                      </div>
                    </div>

                    {/* Travel Mode — shown only if outstation */}
                    {isOutstation && (
                      <div className={`p-4 rounded-2xl border animate-in slide-in-from-top-3 duration-250 ${isWhiteBg ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/[0.03] border-orange-500/10'}`}>
                        <div className="space-y-1 mb-3">
                          <span className={`font-bold block ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>How will your team travel to the venue?</span>
                          <span className={`text-[10px] block leading-normal ${isWhiteBg ? 'text-gray-500' : 'text-gray-500'}`}>Select the primary mode of travel your outstation team will use.</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {["By Train", "By Bus", "By Car / Bike", "By Flight", "By Metro", "Other"].map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setTravelMode(mode)}
                              className={`py-2 px-3 rounded-xl border font-bold text-[10px] transition-all cursor-pointer ${
                                travelMode === mode
                                  ? 'bg-orange-500 border-orange-500 text-white'
                                  : isWhiteBg
                                    ? 'bg-white border-gray-300 text-gray-600 hover:border-orange-400'
                                    : 'bg-[#0d0f12] border-white/[0.06] text-gray-400 hover:border-orange-500/40'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: Final Review & Submission */}
              {currentStep === 5 && (
                <div className="glass-panel border border-white/[0.05] rounded-3xl p-6 space-y-6 animate-in fade-in duration-300">
                  <h3 className="text-white font-extrabold uppercase text-xs tracking-wider border-l-2 border-orange-500 pl-2.5">
                    5. Review Roster & Submit
                  </h3>

                  {/* Fields verification snapshot summary */}
                  <div className="bg-[#08090c]/60 border border-white/[0.04] p-4 rounded-2xl text-[11px] text-gray-400 space-y-3 shadow-inner">
                    <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                      <span>Sport Discipline:</span>
                      <strong className="text-white">{selectedEvent?.title} ({selectedEvent?.category})</strong>
                    </div>
                    {selectedEvent?.type === "team" && (
                      <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                        <span>Team Name:</span>
                        <strong className="text-orange-400 uppercase font-black">{teamName}</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                      <span>Team Lead/Athlete:</span>
                      <strong className="text-white">{leadName} ({leadRollNo})</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                      <span>College Represented:</span>
                      <strong className="text-white truncate max-w-[200px] inline-block">{leadCollege}</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.03] pb-1.5">
                      <span>Outstation Status:</span>
                      <strong className={isOutstation ? "text-orange-400" : "text-gray-500"}>{isOutstation ? "YES — Outstation" : "NO — Local"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Travel Mode:</span>
                      <strong className={travelMode ? "text-emerald-400" : "text-gray-500"}>{isOutstation && travelMode ? travelMode : "N/A"}</strong>
                    </div>
                  </div>

                  {/* Rules Consent agreement checklist */}
                  <div className="flex items-start gap-3 bg-gray-950/40 p-4 rounded-2xl border border-white/[0.04]">
                    <input
                      id="rules-check"
                      type="checkbox"
                      required
                      checked={agreeRules}
                      onChange={(e) => setAgreeRules(e.target.checked)}
                      className="w-4 h-4 rounded border-white/[0.08] text-orange-500 focus:ring-orange-500 accent-orange-500 shrink-0 cursor-pointer mt-0.5"
                    />
                    <label htmlFor="rules-check" className="text-[10px] text-gray-400 leading-relaxed select-none cursor-pointer">
                      I declare that all roster details are correct. I agree to comply with the official Chakravyuh central charter, including bringing physical college ID cards to verification desks.
                    </label>
                  </div>
                </div>
              )}

              {/* Error Alert Display */}
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-3 text-rose-400 items-start animate-in shake duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wider text-[10px]">Roster Submission Error</span>
                    <span className="text-[11px] leading-relaxed block mt-0.5">{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className={`flex justify-between items-center gap-4 pt-2 border-t ${isWhiteBg ? 'border-gray-300' : 'border-white/[0.05]'}`}>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className={`px-5 py-3 font-bold rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer outline-none ${isWhiteBg ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300' : 'bg-[#12151a] hover:bg-gray-800 text-gray-300 border-white/[0.06]'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer outline-none ml-auto"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold uppercase rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer outline-none ml-auto hover:shadow-orange-500/30"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>Submit Registration</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
