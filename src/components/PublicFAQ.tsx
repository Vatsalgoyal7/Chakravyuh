import React, { useState, useEffect } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { dbService } from "../lib/dbService";
import { FAQItem } from "../types";

export default function PublicFAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dbService.getFAQs()
      .then(res => {
        setFaqs(res);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 font-mono text-xs text-gray-500">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <p>Loading help documents...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16 glass-panel border border-white/[0.04] rounded-3xl font-mono text-xs text-gray-500">
            No FAQs published yet. Please check back later.
          </div>
        ) : (
          /* Collapsible Accordion Grid */
          <div className="space-y-4 font-mono text-xs">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div 
                  key={faq.id || idx}
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
        )}

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
