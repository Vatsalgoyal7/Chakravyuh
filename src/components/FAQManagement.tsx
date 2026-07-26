import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { FAQItem } from "../types";
import { 
  HelpCircle, 
  Plus, 
  Trash2, 
  X, 
  Edit3, 
  ArrowUp, 
  ArrowDown
} from "lucide-react";

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await dbService.getFAQs();
      setFaqs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      await dbService.saveFAQ({
        q: question.trim(),
        a: answer.trim(),
        order,
        id: editId || undefined
      });
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setOrder(faqs.length + 1);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (faq: FAQItem) => {
    setEditId(faq.id);
    setQuestion(faq.q);
    setAnswer(faq.a);
    setOrder(faq.order);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await dbService.deleteFAQ(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const DEFAULT_FAQS_SEED = [
    { q: "How do I register for Chakravyuh 2K26?", a: "Visit the 'Register' section on this website, select your sport event, fill in your personal and team details, and submit. You will receive a Tracking Code immediately after successful submission. Use it to track your registration status anytime.", order: 1 },
    { q: "Can I register for multiple sports?", a: "Yes! You can register for multiple sports individually. Each sport registration is separate. Simply complete one registration and then return to the Register page to submit another for a different sport.", order: 2 },
    { q: "What is the registration fee and how do I pay?", a: "The registration fee is set by the organizing committee and is displayed on the registration form. Payment is made via UPI — scan the QR code or use the UPI ID shown, then enter the UTR/transaction number in the form for verification.", order: 3 },
    { q: "What is the last date to register?", a: "The registration deadline is October 03, 2026. Late entries will not be accepted under any circumstances. We strongly recommend registering at least 2-3 days before the deadline to avoid any technical delays.", order: 4 },
    { q: "Is an NOC required for outstation participants?", a: "Yes. Outstation teams (from colleges other than IMSEC) must carry a valid NOC (No Objection Certificate) from their respective institution. This document must be presented at the venue registration desk on the day of the event.", order: 5 },
    { q: "How can I track my registration status?", a: "Use the 'Track Status' link in the navigation bar. Enter your Tracking Code (received via email or displayed after registration) to instantly check your current approval status, payment verification, and event details.", order: 6 },
    { q: "What documents should I carry to the venue?", a: "Please carry: (1) Your College ID Card, (2) Printed or digital copy of your Registration Tracking Code, (3) NOC letter if from an outstation college, (4) Payment receipt or UTR screenshot as proof of fee payment.", order: 7 },
    { q: "Can I participate without a college ID?", a: "No. A valid college ID is mandatory for all participants. Students without a college ID will not be permitted to participate or enter the arena. IMS Engineering College students must show their IMSEC Identity Card.", order: 8 },
    { q: "How does team registration work?", a: "For team sports (e.g., Cricket, Football, Basketball), one player registers as the Team Leader and enters the names and details of all team members in the Members section. All members will be covered under the same Tracking Code.", order: 9 },
    { q: "What if I need to withdraw after registering?", a: "Contact the sports coordinator for your specific event (listed in the Rules & Contacts section) as soon as possible. Withdrawal requests must be made at least 48 hours before the event date. Registration fees are generally non-refundable.", order: 10 },
    { q: "Where will the events be held?", a: "All sports events will be held at the IMSEC Play Ground, Ghaziabad campus, October 10–11, 2026. Indoor sports (Badminton, Table Tennis, Chess, Carrom) will be held in the college sports hall. Exact venue maps will be shared closer to the event.", order: 11 },
    { q: "How will match schedules and results be communicated?", a: "Match schedules will be published on the 'Schedule' page of this website. Results and bracket updates will be announced via the Announcements section. You may also contact your sport's coordinator directly for the latest information.", order: 12 },
    { q: "What if I face technical issues during registration?", a: "If you encounter any technical difficulty while registering, take a screenshot of the error and contact our support team. You can reach the Main Coordinator (Vatsal Goyal) at the contact number listed under Rules & Contacts on this website.", order: 13 },
    { q: "Are accommodation or travel facilities available for outstation teams?", a: "Accommodation is not officially arranged by the organizing committee. Outstation teams are advised to make their own travel and lodging arrangements. However, local contact references for nearby guest houses can be provided on request — please reach out to the main coordinator.", order: 14 },
  ];

  const handleSeedDefaultFAQs = async () => {
    if (!confirm(`This will add ${DEFAULT_FAQS_SEED.length} default FAQs. Continue?`)) return;
    try {
      for (const faq of DEFAULT_FAQS_SEED) {
        await dbService.saveFAQ(faq);
      }
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to seed FAQs.");
    }
  };

  const handleMove = async (faq: FAQItem, direction: "up" | "down") => {
    const idx = faqs.findIndex(f => f.id === faq.id);
    if (idx === -1) return;
    
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;

    const targetFaq = faqs[targetIdx];
    
    // Swap orders
    const tempOrder = faq.order;
    faq.order = targetFaq.order;
    targetFaq.order = tempOrder;

    try {
      await Promise.all([
        dbService.saveFAQ(faq),
        dbService.saveFAQ(targetFaq)
      ]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-500" />
            Frequently Asked Questions Editor
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Manage public FAQs, tournament instructions, and tracking guidelines.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New FAQ
        </button>
      </div>

      {showForm && (
        <div className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6 relative">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-orange-500 font-mono">
              {editId ? "Edit FAQ Document" : "Draft New FAQ Document"}
            </h3>
            <button 
              onClick={resetForm}
              className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="block text-gray-400 font-bold uppercase text-[10px]">Question Text *</label>
              <input
                type="text"
                required
                placeholder="e.g., How do I register multiple sports?"
                className="w-full px-3.5 py-3 bg-[#0d0f12] border border-gray-800 rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all font-semibold"
                value={question}
                onChange={e => setQuestion(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-gray-400 font-bold uppercase text-[10px]">Detailed Answer *</label>
              <textarea
                required
                rows={4}
                placeholder="Provide a descriptive answer for students..."
                className="w-full px-3.5 py-3 bg-[#0d0f12] border border-gray-800 rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all font-semibold leading-relaxed"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 w-32">
              <label className="block text-gray-400 font-bold uppercase text-[10px]">Sort Order</label>
              <input
                type="number"
                required
                min={1}
                className="w-full px-3.5 py-3 bg-[#0d0f12] border border-gray-800 rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all font-bold text-center"
                value={order}
                onChange={e => setOrder(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
              >
                Save FAQ
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-mono">Loading FAQs list...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl font-mono text-xs text-gray-500 space-y-4">
          <p>No FAQs configured yet. Click "Add New FAQ" to create your first entry.</p>
          <button
            onClick={handleSeedDefaultFAQs}
            className="px-5 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            ✦ Load 14 Default FAQs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={faq.id}
              className="p-4 bg-[#12141a]/60 border border-white/[0.03] hover:border-orange-500/20 rounded-2xl transition-all font-mono text-xs flex gap-4"
            >
              <div className="flex flex-col items-center gap-1 justify-center shrink-0 border-r border-gray-800/80 pr-3">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMove(faq, "up")}
                  className="p-1 hover:bg-gray-800 text-gray-500 hover:text-orange-400 rounded disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-gray-600">{faq.order}</span>
                <button
                  disabled={idx === faqs.length - 1}
                  onClick={() => handleMove(faq, "down")}
                  className="p-1 hover:bg-gray-800 text-gray-500 hover:text-orange-400 rounded disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                <p className="font-bold text-white uppercase text-[10px] tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  {faq.q}
                </p>
                <p className="text-gray-400 text-[11px] leading-relaxed pl-3 border-l border-gray-800">
                  {faq.a}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2 self-start">
                <button
                  onClick={() => handleEdit(faq)}
                  className="p-2 hover:bg-gray-800 text-gray-400 hover:text-orange-400 rounded-lg cursor-pointer transition-all"
                  title="Edit FAQ"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="p-2 hover:bg-gray-800 text-gray-400 hover:text-red-400 rounded-lg cursor-pointer transition-all"
                  title="Delete FAQ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
