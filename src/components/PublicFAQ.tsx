import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

export default function PublicFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      q: "Who is eligible to participate in Chakravyuh 2K26?",
      a: "All undergraduate and postgraduate students enrolled in recognized universities and AICTE/UGC approved engineering or management colleges are eligible. Bringing a physical college identity card with a current fee slip is absolutely mandatory during verification."
    },
    {
      q: "Is there an entry or registration fee for the sports?",
      a: "Yes, standard institutional registration fees apply for individual and team sports to cover logistics, referee charges, and event kit arrangements. Specific fee structures will be shared by the respective sports coordinators upon roster validation."
    },
    {
      q: "Can a player register for multiple sports disciplines?",
      a: "Yes, players may participate in multiple events as long as matches do not overlap. However, the organizing committee will not delay or reschedule any fixtures if an athlete has scheduling conflicts due to participating in multiple sports."
    },
    {
      q: "How will match schedules and court brackets be published?",
      a: "Fixture brackets, match day schedules, and ground layouts are published directly under the 'Schedule' page on this website. This list updates dynamically in real-time, displaying live indicators ('LIVE NOW' badges) for ongoing games."
    },
    {
      q: "Is accommodation available for outstation teams?",
      a: "Outstation teams can request campus hostel accommodation during registration. Please get in touch with the Physical Education Director or student coordinators directly via the 'Rules & Contacts' directory to pre-arrange lodging."
    },
    {
      q: "What is the procedure if we need to modify our team squad roster?",
      a: "Rosters cannot be edited online once submitted to prevent database fraud. If you need to make urgent player substitutions due to injuries, the Team Captain must contact the specific student coordinator with official approval from your college's sports department."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-transparent text-white min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header Title */}
        <div className="mb-12 text-center">
          <h1 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-2">
            HELP CENTER
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-xs font-mono text-gray-500 max-w-lg mx-auto mt-2">
            Have questions regarding tournament registration, college ID requirements, or scheduling? Find instant resolutions below.
          </p>
        </div>

        {/* Collapsible Accordion Grid */}
        <div className="space-y-4 font-mono text-xs">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className={`glass-panel rounded-3xl overflow-hidden transition-all duration-300 ${
                  isOpen ? "border-orange-500/30 shadow-lg shadow-orange-500/[0.03]" : "border-white/[0.04]"
                }`}
              >
                {/* Accordion Trigger */}
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:text-orange-400 transition-all font-bold text-white uppercase text-[11px] leading-relaxed cursor-pointer outline-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 shrink-0 transition-transform duration-300 rotate-180" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-300" />
                  )}
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-1.5 border-t border-white/[0.04] text-gray-400 leading-relaxed text-xs">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Extra Support Ticker */}
        <div className="mt-12 p-6 glass-panel border border-white/[0.05] rounded-3xl text-center font-mono shadow-xl">
          <Sparkles className="w-6 h-6 text-orange-500 mx-auto mb-3 animate-pulse" />
          <p className="text-xs font-bold text-white uppercase mb-1">Still need tournament support?</p>
          <p className="text-[11px] text-gray-500 max-w-md mx-auto leading-relaxed">
            Please navigate to the Rules & Contacts directory and connect with our student sports desk coordinators directly via phone call.
          </p>
        </div>

      </div>
    </div>
  );
}
