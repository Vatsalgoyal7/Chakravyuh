import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { GeneralRule, Contact } from "../types";
import { uploadMedia } from "../lib/uploadService";
import { 
  BookOpen, 
  PhoneCall, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Edit3, 
  User, 
  Mail, 
  ArrowUp, 
  ArrowDown,
  Phone,
  Camera
} from "lucide-react";

export default function RulesContactsManagement() {
  const [rules, setRules] = useState<GeneralRule[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<"rules" | "contacts">("rules");
  const [isLoading, setIsLoading] = useState(true);

  // Form States for Rules
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleEditId, setRuleEditId] = useState<string | null>(null);
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleContent, setRuleContent] = useState("");

  // Form States for Contacts
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactEditId, setContactEditId] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactDesignation, setContactDesignation] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactGender, setContactGender] = useState<"male" | "female">("male");
  const [contactOrder, setContactOrder] = useState(1);
  const [contactCategory, setContactCategory] = useState("General Coordinator");
  const [contactIsMainCoordinator, setContactIsMainCoordinator] = useState(false);
  const [contactEnabled, setContactEnabled] = useState(true);

  // Image states for Contacts
  const [contactImageFile, setContactImageFile] = useState<File | null>(null);
  const [contactImagePreview, setContactImagePreview] = useState<string>("");
  const [contactExistingImageUrl, setContactExistingImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [rulesData, contactsData] = await Promise.all([
        dbService.getGeneralRules(),
        dbService.getContacts()
      ]);
      setRules(rulesData);
      setContacts(contactsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // RULES CRUD
  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle || !ruleContent) return;

    try {
      await dbService.saveGeneralRule({
        title: ruleTitle,
        content: ruleContent,
        id: ruleEditId || undefined
      });
      resetRuleForm();
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetRuleForm = () => {
    setRuleTitle("");
    setRuleContent("");
    setRuleEditId(null);
    setShowRuleForm(false);
  };

  const handleRuleEdit = (rule: GeneralRule) => {
    setRuleEditId(rule.id);
    setRuleTitle(rule.title);
    setRuleContent(rule.content);
    setShowRuleForm(true);
  };

  const handleRuleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this rule document?")) {
      try {
        await dbService.deleteGeneralRule(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

 async function uploadContactImage(file: File): Promise<string> {
   return await uploadMedia(file, { maxImageSizeMB: 1, maxImageWidthOrHeight: 800, category: "team" });
 }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactDesignation || !contactPhone || !contactEmail) return;

    try {
      setUploadingImage(true);
      let imageUrl = contactExistingImageUrl;

      if (contactImageFile) {
        imageUrl = await uploadContactImage(contactImageFile);
      }

      const contactData = {
        name: contactName,
        designation: contactDesignation,
        phone: contactPhone,
        email: contactEmail,
        order: Number(contactOrder),
        gender: contactGender,
        imageUrl,
        category: contactCategory,
        isMainCoordinator: contactIsMainCoordinator,
        enabled: contactEnabled,
        id: contactEditId || undefined
      };
      console.log("Saving contact data:", contactData);
      await dbService.saveContact(contactData);
      resetContactForm();
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const resetContactForm = () => {
    setContactName("");
    setContactDesignation("");
    setContactPhone("");
    setContactEmail("");
    setContactGender("male");
    setContactOrder(1);
    setContactCategory("General Coordinator");
    setContactIsMainCoordinator(false);
    setContactEnabled(true);
    setContactEditId(null);
    setContactImageFile(null);
    setContactImagePreview("");
    setContactExistingImageUrl("");
    setShowContactForm(false);
  };

  const handleContactEdit = (c: Contact) => {
    setContactEditId(c.id);
    setContactName(c.name);
    setContactDesignation(c.designation);
    setContactPhone(c.phone);
    setContactEmail(c.email);
    setContactGender(c.gender);
    setContactOrder(c.order);
    setContactCategory(c.category || "General Coordinator");
    setContactIsMainCoordinator(c.isMainCoordinator || false);
    setContactEnabled(c.enabled !== undefined ? c.enabled : true);
    setContactExistingImageUrl(c.imageUrl || "");
    setContactImagePreview(c.imageUrl || "");
    setShowContactForm(true);
  };

  const handleContactDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this coordinator contact card?")) {
      try {
        await dbService.deleteContact(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleContactMove = async (contact: Contact, direction: "up" | "down") => {
    const sorted = [...contacts].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(c => c.id === contact.id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap positions in array
    const newSorted = [...sorted];
    [newSorted[idx], newSorted[targetIdx]] = [newSorted[targetIdx], newSorted[idx]];

    // Re-index all sequentially so order is always unique (1,2,3...)
    const reIndexed = newSorted.map((c, i) => ({ ...c, order: i + 1 }));

    try {
      await Promise.all(reIndexed.map(c => dbService.saveContact({ ...c })));
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Assembling code guidelines...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Tab controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-3">
        <div className="flex gap-1.5 bg-[#12141a] p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-2 ${activeTab === "rules" ? "bg-orange-500/10 text-orange-400 border border-orange-500/15" : "text-gray-400 hover:text-white"}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>General Code & Rules</span>
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-2 ${activeTab === "contacts" ? "bg-orange-500/10 text-orange-400 border border-orange-500/15" : "text-gray-400 hover:text-white"}`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Sports Directory Contacts</span>
          </button>
        </div>

        <div>
          {activeTab === "rules" && !showRuleForm && (
            <button
              onClick={() => setShowRuleForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Conduct Rule</span>
            </button>
          )}

          {activeTab === "contacts" && !showContactForm && (
            <button
              onClick={() => setShowContactForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Authority Contact</span>
            </button>
          )}
        </div>
      </div>

      {/* RULES SUBTAB SCREEN */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          
          {showRuleForm && (
            <div className="bg-[#12141a] border border-orange-500/10 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-orange-500 font-mono">
                {ruleEditId ? "Modify Code Rule" : "Write New Conduct Code Guideline"}
              </h3>

              <form onSubmit={handleRuleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Rule Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Eligibility & Inter-College Approvals"
                    className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                    value={ruleTitle}
                    onChange={(e) => setRuleTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Rule Detail Content *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="List complete guidelines (support new lines)..."
                    className="w-full px-4 py-3 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                    value={ruleContent}
                    onChange={(e) => setRuleContent(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2 bg-orange-500 text-white font-bold rounded-xl text-xs">
                    Save Document
                  </button>
                  <button type="button" onClick={resetRuleForm} className="px-5 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl flex justify-between items-start group hover:border-gray-700 transition-all">
                <div className="space-y-2 max-w-2xl">
                  <h4 className="text-sm font-extrabold text-white font-mono">{rule.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line font-sans">{rule.content}</p>
                  <span className="block text-[9px] text-gray-600 font-mono">Last Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-1.5">
                  <button onClick={() => handleRuleEdit(rule)} className="p-1.5 hover:bg-orange-500/10 text-gray-500 hover:text-orange-400 rounded-lg transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleRuleDelete(rule.id)} className="p-1.5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* CONTACTS SUBTAB SCREEN */}
      {activeTab === "contacts" && (
        <div className="space-y-6">
          
          {showContactForm && (
            <div className="bg-[#12141a] border border-orange-500/10 p-5 rounded-2xl space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-orange-500 font-mono">
                {contactEditId ? "Modify Authority Card" : "Register Authority Organizer Contacts"}
              </h3>

              <form onSubmit={handleContactSubmit} className="space-y-4">

                {/* Photo upload */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#0d0f12] border border-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                    {contactImagePreview ? (
                      <img src={contactImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Coordinator Photo</label>
                    <label className="flex items-center gap-2 px-4 py-2 bg-[#0d0f12] border border-gray-800 hover:border-orange-500 rounded-xl text-xs text-gray-300 cursor-pointer w-fit">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setContactImageFile(file);
                            setContactImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Dr. Manoj Kumar Singh"
                      className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Designation / Role *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Chief Sports Coordinator, IMSEC"
                      className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                      value={contactDesignation}
                      onChange={(e) => setContactDesignation(e.target.value)}
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g., 9415123456"
                      className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., sports@imsec.ac.in"
                      className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Gender *</label>
                    <select
                      required
                      className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                      value={contactGender}
                      onChange={(e) => setContactGender(e.target.value as "male" | "female")}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Category</label>
                    <select
                      className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                      value={contactCategory}
                      onChange={(e) => setContactCategory(e.target.value)}
                    >
                      <option value="General Coordinator">General Coordinator</option>
                      <option value="Sports Coordinator">Sports Coordinator</option>
                      <option value="Discipline Coordinator">Discipline Coordinator</option>
                      <option value="Food Coordinator">Food Coordinator</option>
                      <option value="Medical Coordinator">Medical Coordinator</option>
                      <option value="Logistics Coordinator">Logistics Coordinator</option>
                      <option value="Media Coordinator">Media Coordinator</option>
                      <option value="Technical Coordinator">Technical Coordinator</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase text-gray-500 font-mono font-bold">Display Priority Order</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                      value={contactOrder}
                      onChange={(e) => setContactOrder(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactIsMainCoordinator}
                        onChange={(e) => setContactIsMainCoordinator(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-700 bg-[#0d0f12] text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-300 font-semibold">Main Coordinator (Pinned at Top)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactEnabled}
                        onChange={(e) => setContactEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-700 bg-[#0d0f12] text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-300 font-semibold">Enabled (Visible in Public View)</span>
                    </label>
                  </div>

                </div>

                <div className="flex gap-2">
                  <button type="submit" disabled={uploadingImage} className="px-5 py-2 bg-orange-500 text-white font-bold rounded-xl text-xs disabled:opacity-50">
                    {uploadingImage ? "Uploading..." : "Save Contact Card"}
                  </button>
                  <button type="button" onClick={resetContactForm} className="px-5 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...contacts].sort((a, b) => a.order - b.order).map((contact, idx) => {
              const sorted = [...contacts].sort((a, b) => a.order - b.order);
              return (
              <div key={contact.id} className="bg-[#12141a] border border-gray-800/80 p-5 rounded-2xl flex justify-between items-start group hover:border-gray-700 transition-all">
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 bg-orange-600/10 text-orange-400 border border-orange-500/10 rounded-full flex items-center justify-center font-bold overflow-hidden">
                      {contact.imageUrl ? (
                        <img src={contact.imageUrl} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-gray-500 font-mono">PRIORITY ORDER: {contact.order}</h4>
                      <h3 className="text-sm font-extrabold text-white font-mono mt-0.5">{contact.name}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 font-semibold pl-1">{contact.designation}</p>

                  <div className="pl-1 space-y-1 text-[10px] font-mono text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-600" />
                      <span className="select-all text-gray-400">{contact.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-600" />
                      <span className="select-all text-gray-400">{contact.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-orange-400">Category:</span>
                      <span className="text-gray-400">{contact.category || "Not set"}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-orange-400">Main:</span>
                      <span className="text-gray-400">{contact.isMainCoordinator ? "Yes" : "No"}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-orange-400">Enabled:</span>
                      <span className="text-gray-400">{contact.enabled !== false ? "Yes" : "No"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {/* Reorder buttons */}
                  <div className="flex flex-col items-center gap-0.5 border border-gray-800 rounded-lg p-0.5 mb-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleContactMove(contact, "up")}
                      className="p-1 hover:bg-gray-800 text-gray-500 hover:text-orange-400 rounded disabled:opacity-30 cursor-pointer transition-all"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={idx === sorted.length - 1}
                      onClick={() => handleContactMove(contact, "down")}
                      className="p-1 hover:bg-gray-800 text-gray-500 hover:text-orange-400 rounded disabled:opacity-30 cursor-pointer transition-all"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Edit / Delete */}
                  <div className="flex gap-1">
                    <button onClick={() => handleContactEdit(contact)} className="p-1.5 hover:bg-orange-500/10 text-gray-500 hover:text-orange-400 rounded-lg transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleContactDelete(contact.id)} className="p-1.5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
            })}
          </div>

        </div>
      )}

    </div>
  );
}