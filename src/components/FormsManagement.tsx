import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { CustomForm } from "../types";
import { 
  Plus, 
  Trash2, 
  X, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  ExternalLink, 
  Check, 
  Sparkles,
  Link
} from "lucide-react";

export default function FormsManagement() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"embed" | "redirect">("embed");
  const [targetAudience, setTargetAudience] = useState<"inter" | "intra" | "all">("all");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(1);
  const [iconName, setIconName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await dbService.getCustomForms();
      setForms(data);
    } catch (err) {
      console.error("Failed to load custom forms:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const DEFAULT_CUSTOM_FORMS_SEED = [
    {
      title: "NOC Submission",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfD7M0bH1W38YfOgrN6eC_iV5l5r2Y981jS2K7c0-M1sA8y_A/viewform",
      type: "embed" as const,
      targetAudience: "all" as const,
      isActive: true,
      order: 1
    },
    {
      title: "Feedback Desk",
      url: "https://docs.google.com/forms/d/e/1FAIpQLSfD7M0bH1W38YfOgrN6eC_iV5l5r2Y981jS2K7c0-M1sA8y_A/viewform",
      type: "redirect" as const,
      targetAudience: "all" as const,
      isActive: true,
      order: 2
    }
  ];

  const handleSeedDefaults = async () => {
    if (!confirm(`This will add ${DEFAULT_CUSTOM_FORMS_SEED.length} default custom forms. Continue?`)) return;
    try {
      for (const form of DEFAULT_CUSTOM_FORMS_SEED) {
        await dbService.saveCustomForm(form);
      }
      loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to seed custom forms: " + (err.message || err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    try {
      await dbService.saveCustomForm({
        title: title.trim(),
        url: url.trim(),
        type,
        targetAudience,
        isActive,
        order,
        iconName: iconName.trim() || undefined,
        id: editId || undefined
      });
      resetForm();
      loadData();
    } catch (err: any) {
      console.error("Failed to save custom form:", err);
      alert("Failed to save custom form: " + (err.message || err));
    }
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setType("embed");
    setTargetAudience("all");
    setIsActive(true);
    setOrder(forms.length + 1);
    setIconName("");
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (form: CustomForm) => {
    setEditId(form.id);
    setTitle(form.title);
    setUrl(form.url);
    setType(form.type);
    setTargetAudience(form.targetAudience);
    setIsActive(form.isActive);
    setOrder(form.order);
    setIconName(form.iconName || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom form/link?")) return;
    try {
      await dbService.deleteCustomForm(id);
      loadData();
    } catch (err: any) {
      console.error("Failed to delete custom form:", err);
      alert("Failed to delete custom form: " + (err.message || err));
    }
  };

  const handleToggleActive = async (form: CustomForm) => {
    try {
      await dbService.saveCustomForm({
        ...form,
        isActive: !form.isActive
      });
      loadData();
    } catch (err: any) {
      console.error("Failed to toggle form state:", err);
      alert("Failed to toggle state: " + (err.message || err));
    }
  };

  const handleMove = async (form: CustomForm, direction: "up" | "down") => {
    const idx = forms.findIndex(f => f.id === form.id);
    if (idx === -1) return;
    
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= forms.length) return;

    const targetForm = forms[targetIdx];
    
    // Swap orders
    const tempOrder = form.order;
    form.order = targetForm.order;
    targetForm.order = tempOrder;

    try {
      await Promise.all([
        dbService.saveCustomForm(form),
        dbService.saveCustomForm(targetForm)
      ]);
      loadData();
    } catch (err: any) {
      console.error("Failed to reorder forms:", err);
      alert("Failed to reorder: " + (err.message || err));
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-gray-300">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Superadmin System Controls</span>
          </div>
          <h2 className="text-xl font-extrabold uppercase tracking-tight text-white mt-1">
            Dynamic Forms & Links
          </h2>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Embed external Google Forms, NOC uploads, or redirect to feedback pages directly on the navbar.
          </p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Form/Link</span>
        </button>
      </div>

      {/* Form modal/drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12141a] border border-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <span className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                {editId ? "Edit Custom Link/Form" : "Create Custom Link/Form"}
              </span>
              <button 
                onClick={resetForm}
                className="p-1 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  Title / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Google NOC Submission"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#161821] border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 transition-all text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">
                  URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/forms/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#161821] border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 transition-all text-xs"
                />
                <span className="block text-[9px] text-gray-650 mt-1">
                  Tip: For Google Forms, use the "Send Form" link. We will auto-convert to optimized embed URL.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Navigation Mode
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "embed" | "redirect")}
                    className="w-full bg-[#161821] border border-gray-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500/50 transition-all text-xs"
                  >
                    <option value="embed">Embed (Iframe Inside Site)</option>
                    <option value="redirect">Redirect (Open New Tab)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as "inter" | "intra" | "all")}
                    className="w-full bg-[#161821] border border-gray-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-orange-500/50 transition-all text-xs"
                  >
                    <option value="all">All Registrants</option>
                    <option value="inter">Inter-College Only</option>
                    <option value="intra">Intra-College Only</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Order Index
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#161821] border border-gray-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-orange-500/50 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Active on Website
                  </label>
                  <div className="flex items-center h-10">
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer ${
                        isActive
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : "bg-gray-800 border border-gray-700 text-gray-400"
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isActive ? "opacity-100" : "opacity-0"}`} />
                      <span>{isActive ? "ACTIVE" : "DISABLED"}</span>
                    </button>
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  {editId ? "Save Changes" : "Publish Link"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Main Listing Viewport */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-gray-800/80 bg-[#12141a]/40 rounded-3xl">
          <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-500">Loading custom gateways...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 border border-gray-800/80 bg-[#12141a]/40 rounded-3xl space-y-4">
          <div className="flex flex-col items-center justify-center">
            <Link className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="font-bold text-white uppercase mb-1">No Custom Gateways Formed</p>
            <p className="text-gray-500 max-w-sm mx-auto leading-relaxed mt-0.5">
              Add NOC submission forms, external survey links, or documents links to inject them seamlessly into the student navigation dashboard.
            </p>
          </div>
          <button
            onClick={handleSeedDefaults}
            className="px-4 py-2 border border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Seed Default Templates</span>
          </button>
        </div>
      ) : (
        <div className="border border-gray-800/80 bg-[#12141a]/40 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#12141a]/70 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                <th className="p-4 w-12 text-center">Order</th>
                <th className="p-4">Title / Label</th>
                <th className="p-4">Integration Mode</th>
                <th className="p-4">Target Audience</th>
                <th className="p-4 w-28 text-center">Status</th>
                <th className="p-4 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((item, idx) => (
                <tr 
                  key={item.id}
                  className="border-b border-gray-800/60 hover:bg-white/[0.01] transition-all"
                >
                  <td className="p-4 font-bold text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-white text-xs">{item.order}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMove(item, "up")}
                          className="p-0.5 hover:bg-gray-800 rounded text-gray-500 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === forms.length - 1}
                          onClick={() => handleMove(item, "down")}
                          className="p-0.5 hover:bg-gray-800 rounded text-gray-500 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div>
                      <p className="font-extrabold text-white text-xs uppercase tracking-wide">
                        {item.title}
                      </p>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] text-gray-500 hover:text-orange-400 hover:underline flex items-center gap-1.5 mt-1"
                      >
                        <span className="truncate max-w-xs sm:max-w-md">{item.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </td>

                  <td className="p-4">
                    {item.type === "embed" ? (
                      <span className="px-2.5 py-1 rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-400 font-bold uppercase tracking-wider text-[9px]">
                        Embed (Iframe)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 font-bold uppercase tracking-wider text-[9px]">
                        Redirect (Tab)
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className="text-[10px] text-gray-400 uppercase">
                      {item.targetAudience === "all" && "All Candidates"}
                      {item.targetAudience === "inter" && "Inter-College Only"}
                      {item.targetAudience === "intra" && "Intra-College Only"}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-3 py-1.5 rounded-xl border text-[9px] font-black tracking-wider uppercase cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                        item.isActive
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      {item.isActive ? "Active" : "Off"}
                    </button>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
                        title="Edit config"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-950/20 hover:text-red-400 rounded-xl text-gray-500 transition-all cursor-pointer"
                        title="Delete Gateway"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
}
