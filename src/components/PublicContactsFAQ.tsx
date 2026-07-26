import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { Contact, GeneralRule } from "../types";
import { Phone, Mail, ChevronDown, ChevronUp, ShieldAlert, Award, HelpCircle, PhoneCall, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function PublicContactsFAQ() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [rules, setRules] = useState<GeneralRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, rList] = await Promise.all([
          dbService.getContacts(),
          dbService.getGeneralRules(),
        ]);
        setContacts(cList);
        setRules(rList);
      } catch (err) {
        console.error("Failed to load contacts & rules:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const faqs = [
    {
      q: "Who is eligible to participate in Chakravyuh 2K26?",
      a: "All active students currently enrolled in undergraduate or postgraduate degree programs at recognized universities or engineering colleges are eligible. You must carry your official physical College ID card at all times in the arena.",
    },
    {
      q: "Are there any registration fees or entry charges?",
      a: "No, registration for all sporting disciplines under Chakravyuh 2K26 is completely free of charge. IMS Engineering College fully sponsors the event to foster sportsmanship across campuses.",
    },
    {
      q: "Can a student register for multiple sports events?",
      a: "Yes, you can register for multiple events. However, the committee cannot guarantee that schedules or fixture slots will not conflict. No special fixture adjustments will be made for overlapping team matches.",
    },
    {
      q: "Is accommodation or transport provided for outstation teams?",
      a: "Outstation teams seeking overnight stays or transport arrangements are required to contact our Physical Education Director or student hospitality coordinators at least 7 days prior to Nov 01.",
    },
    {
      q: "Are spot registrations or roster changes allowed at the venue?",
      a: "Absolutely not. All rosters must be locked before the October 15th deadline. No spot registrations, substitutions, or field additions will be permitted once brackets are generated.",
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="bg-[#07080a] py-12 md:py-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* TOP SECTION: Code of Conduct & Rules */}
        <div className="space-y-6">
          <div>
            <span className="font-mono text-xs text-orange-500 uppercase tracking-widest font-bold block">
              Tournament Code
            </span>
            <h2 className="text-2xl md:text-3xl font-mono font-extrabold text-white tracking-tight uppercase">
              GENERAL <span className="text-orange-500">RULES</span>
            </h2>
            <p className="text-gray-500 text-xs font-sans mt-1">
              Strict rules of engagement. Ensure your college squad complies with all general codes of conduct.
            </p>
          </div>

          {loading ? (
            <div className="h-28 bg-[#0f1115] rounded-xl animate-pulse" />
          ) : rules.length === 0 ? (
            <div className="bg-[#0f1115] p-5 rounded-xl border border-white/5 text-center text-gray-500 text-xs">
              General code rules are operating under standard athletic federation frameworks.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-[#0f1115] border border-white/5 p-6 rounded-2xl space-y-3">
                  <h4 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    {rule.title}
                  </h4>
                  <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-line font-sans">
                    {rule.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MIDDLE SECTION: FAQ Accordion */}
        <div className="space-y-6">
          <div>
            <span className="font-mono text-xs text-orange-500 uppercase tracking-widest font-bold block">
              Inquiry Desk
            </span>
            <h2 className="text-2xl md:text-3xl font-mono font-extrabold text-white tracking-tight uppercase">
              FREQUENTLY ASKED <span className="text-orange-500">QUESTIONS</span>
            </h2>
          </div>

          <div className="space-y-3 max-w-4xl">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-[#0f1115] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="font-mono text-xs md:text-sm font-bold text-white tracking-wide">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-gray-400 font-sans leading-relaxed border-t border-white/2">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SECTION: Organizing Authority Contact Directory */}
        <div className="space-y-6">
          <div>
            <span className="font-mono text-xs text-orange-500 uppercase tracking-widest font-bold block">
              Authority Directory
            </span>
            <h2 className="text-2xl md:text-3xl font-mono font-extrabold text-white tracking-tight uppercase">
              ORGANIZING <span className="text-orange-500">COMMITTEE</span>
            </h2>
            <p className="text-gray-500 text-xs font-sans mt-1">
              Direct hotlines for institutional support, outstation entries, and administrative logistics.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-[#0f1115] rounded-xl h-24 animate-pulse" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center text-gray-500 text-xs py-4 bg-[#0f1115] rounded-xl border border-white/5">
              Coordinators contact lists are managed in central logs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((c) => (
                <div 
                  key={c.id} 
                  className="bg-[#0f1115] border border-white/5 rounded-2xl p-6 space-y-4 hover:border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/[0.01] transition-all"
                >
                  <div className="space-y-1.5">
                    <h4 className="font-mono text-sm font-bold text-white leading-tight">
                      {c.name}
                    </h4>
                    <span className="text-[10px] text-orange-500 font-mono uppercase tracking-wider block">
                      {c.designation}
                    </span>
                  </div>

                  <div className="text-xs font-mono space-y-2 pt-2 border-t border-white/2">
                    <a 
                      href={`tel:${c.phone}`} 
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span>{c.phone}</span>
                    </a>
                    <a 
                      href={`mailto:${c.email}`} 
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
