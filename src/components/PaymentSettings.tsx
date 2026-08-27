import React, { useState, useEffect } from "react";
import {
  QrCode,
  Save,
  ToggleLeft,
  ToggleRight,
  IndianRupee,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  User,
  FileText,
  Smartphone,
  Upload,
  ImagePlus,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Power
} from "lucide-react";
import { dbService } from "../lib/dbService";
import { PaymentConfig, QRCode } from "../types";
import { storage, isFirebaseConfigured } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const DEFAULT_CONFIG: PaymentConfig = {
  enabled: false,
  upiId: "",
  qrImageUrl: "",
  qrCodes: [],
  registrationFee: 0,
  payeeName: "Chakravyuh 2K26",
  instructions: "Scan the QR code and pay the registration fee. Enter your UTR / Transaction ID below to complete your registration.",
  updatedAt: new Date().toISOString(),
};

export default function PaymentSettings() {
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [previewQR, setPreviewQR] = useState(false);
  const [selectedPreviewQRIndex, setSelectedPreviewQRIndex] = useState(0);

  // QR upload add-on state
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    dbService.getPaymentConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const handleAddQRCode = () => {
    const newQR: QRCode = {
      id: "qr_" + Date.now(),
      label: `QR Code ${((config.qrCodes || []).length + 1)}`,
      imageUrl: "",
      upiId: config.upiId || "",
      isActive: true,
      appliedTo: 'both',
    };
    setConfig(c => ({
      ...c,
      qrCodes: [...(c.qrCodes || []), newQR]
    }));
  };

  const handleDeleteQRCode = (id: string) => {
    setConfig(c => ({
      ...c,
      qrCodes: (c.qrCodes || []).filter(q => q.id !== id)
    }));
  };

  const handleUpdateQRCode = (id: string, field: keyof QRCode, value: any) => {
    setConfig(c => ({
      ...c,
      qrCodes: (c.qrCodes || []).map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const handleMoveQRCode = (index: number, direction: 'up' | 'down') => {
    const list = [...(config.qrCodes || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    setConfig(c => ({ ...c, qrCodes: list }));
  };

  const handleQRCodeUpload = async (file: File, index: number, id: string) => {
    setUploadError("");
    setUploadingIndex(index);
    setUploadProgress(0);

    const isLocal = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname);

    if (isFirebaseConfigured && storage && !isLocal) {
      try {
        const storageRef = ref(storage, `payment_qr/qr_${Date.now()}_${file.name}`);
        const task = uploadBytesResumable(storageRef, file);
        task.on(
          "state_changed",
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          (err) => { 
            console.warn("Firebase upload failed, falling back to local base64:", err);
            const reader = new FileReader();
            reader.onload = (ev) => {
              handleUpdateQRCode(id, "imageUrl", ev.target?.result as string);
              setUploadingIndex(null);
              setUploadProgress(100);
            };
            reader.readAsDataURL(file);
          },
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            handleUpdateQRCode(id, "imageUrl", url);
            setUploadingIndex(null);
            setUploadProgress(100);
          }
        );
      } catch (err: any) {
        console.warn("Firebase upload failed, falling back to local base64:", err);
        const reader = new FileReader();
        reader.onload = (ev) => {
          handleUpdateQRCode(id, "imageUrl", ev.target?.result as string);
          setUploadingIndex(null);
          setUploadProgress(100);
        };
        reader.readAsDataURL(file);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleUpdateQRCode(id, "imageUrl", ev.target?.result as string);
        setUploadingIndex(null);
        setUploadProgress(100);
      };
      reader.onerror = () => { setUploadError("Failed to read file"); setUploadingIndex(null); };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await dbService.savePaymentConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to save payment settings.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, icon: React.ReactNode, children: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {icon}
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-gray-600 leading-normal">{hint}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
        <span className="font-mono text-xs">Loading payment config...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-mono text-xs">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5 text-orange-500" />
            Payment Settings
          </h2>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Configure UPI QR payment gateway for student registrations
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Enable Toggle Card */}
      <div className="bg-[#12151a] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">Payment Gateway</p>
            <p className="text-gray-500 text-[10px] mt-0.5">
              {config.enabled
                ? "Students must pay before submission is accepted"
                : "Payment is disabled — registrations are free right now"}
            </p>
          </div>
          <button
            onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
            className="transition-all hover:scale-105"
          >
            {config.enabled ? (
              <ToggleRight className="w-10 h-10 text-orange-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-600" />
            )}
          </button>
        </div>

        {config.enabled && (
          <div className="mt-3 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-2 rounded-xl text-[10px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Payment is ACTIVE. Students will see the QR + UTR step after submitting their registration form.
          </div>
        )}
      </div>

      {/* Screenshot Required Toggle Card */}
      <div className="bg-[#12151a] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-orange-400" />
              Require Payment Screenshot
            </p>
            <p className="text-gray-500 text-[10px] mt-0.5">
              {config.screenshotRequired
                ? "Students must upload a screenshot or PDF receipt to submit payment proof"
                : "Screenshot is optional — students can submit with just UTR/Transaction ID"}
            </p>
          </div>
          <button
            onClick={() => setConfig((c) => ({ ...c, screenshotRequired: !c.screenshotRequired }))}
            className="transition-all hover:scale-105"
          >
            {config.screenshotRequired ? (
              <ToggleRight className="w-10 h-10 text-orange-500" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-600" />
            )}
          </button>
        </div>

        {config.screenshotRequired && (
          <div className="mt-3 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-2 rounded-xl text-[10px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Screenshot/PDF upload will be required. Students can still submit with only UTR if no file is available.
          </div>
        )}
      </div>

      {/* Config Fields */}
      <div className="bg-[#12151a] border border-white/[0.06] rounded-2xl p-5 space-y-5">
        <h3 className="text-white font-bold border-l-2 border-orange-500 pl-2.5">UPI Payment Details</h3>

        {field(
          "Registration Fee (INR)",
          <IndianRupee className="w-3 h-3" />,
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
            <input
              type="number"
              min={0}
              value={config.registrationFee}
              onChange={(e) => setConfig((c) => ({ ...c, registrationFee: Number(e.target.value) }))}
              className="w-full pl-8 pr-3.5 py-3 bg-[#0c0d10] border border-white/[0.06] rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all font-bold"
              placeholder="e.g. 200"
            />
          </div>,
          "Amount each team/individual will be asked to pay. Set to 0 if only tracking, not charging."
        )}

        {field(
          "Payee Name",
          <User className="w-3 h-3" />,
          <input
            type="text"
            value={config.payeeName}
            onChange={(e) => setConfig((c) => ({ ...c, payeeName: e.target.value }))}
            className="w-full px-3.5 py-3 bg-[#0c0d10] border border-white/[0.06] rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all"
            placeholder="e.g. Chakravyuh 2K26"
          />,
          "Name displayed on the payment screen for students"
        )}

        {field(
          "UPI ID",
          <Smartphone className="w-3 h-3" />,
          <input
            type="text"
            value={config.upiId}
            onChange={(e) => setConfig((c) => ({ ...c, upiId: e.target.value }))}
            className="w-full px-3.5 py-3 bg-[#0c0d10] border border-white/[0.06] rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all font-mono"
            placeholder="e.g. 9876543210@ybl or name@upi"
          />,
          "Your UPI handle — students can also type this manually if QR doesn't work"
        )}

        {field(
          "QR Code Image",
          <QrCode className="w-3 h-3" />,
          <div className="space-y-3">
            {/* Upload button — add-on */}
            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              uploading ? "border-orange-500/40 bg-orange-500/5" : "border-white/[0.08] hover:border-orange-500/30 hover:bg-white/[0.02]"
            }`}>
              <input
                id="qr-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadError("");
                  setUploading(true);
                  setUploadProgress(0);

                  const isLocal = window.location.hostname === "localhost" || 
                                  window.location.hostname === "127.0.0.1" || 
                                  /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname);

                  if (isFirebaseConfigured && storage && !isLocal) {
                    // Firebase Storage upload
                    try {
                      const storageRef = ref(storage, `payment_qr/qr_${Date.now()}_${file.name}`);
                      const task = uploadBytesResumable(storageRef, file);
                      task.on(
                        "state_changed",
                        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                        (err) => { 
                          console.warn("Firebase upload failed, falling back to local base64:", err);
                          // Fallback to FileReader on error
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setConfig((c) => ({ ...c, qrImageUrl: ev.target?.result as string }));
                            setUploading(false);
                            setUploadProgress(100);
                          };
                          reader.readAsDataURL(file);
                        },
                        async () => {
                          const url = await getDownloadURL(task.snapshot.ref);
                          setConfig((c) => ({ ...c, qrImageUrl: url }));
                          setUploading(false);
                          setUploadProgress(100);
                        }
                      );
                    } catch (err: any) {
                      console.warn("Firebase upload failed, falling back to local base64:", err);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setConfig((c) => ({ ...c, qrImageUrl: ev.target?.result as string }));
                        setUploading(false);
                        setUploadProgress(100);
                      };
                      reader.readAsDataURL(file);
                    }
                  } else {
                    // Local/Offline Mode: read as base64 data URL
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setConfig((c) => ({ ...c, qrImageUrl: ev.target?.result as string }));
                      setUploading(false);
                      setUploadProgress(100);
                    };
                    reader.onerror = () => { setUploadError("Failed to read file"); setUploading(false); };
                    reader.readAsDataURL(file);
                  }
                  // Reset input so same file can be re-selected
                  e.target.value = "";
                }}
              />
              <label htmlFor="qr-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                    <span className="text-orange-400 text-[10px] font-bold">Uploading... {uploadProgress}%</span>
                    <div className="w-full bg-white/[0.05] rounded-full h-1 mt-1">
                      <div className="bg-orange-500 h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-7 h-7 text-gray-500" />
                    <span className="text-gray-400 text-[10px] font-bold">Click to upload QR image</span>
                    <span className="text-gray-600 text-[10px]">PNG, JPG, WEBP — any size</span>
                  </>
                )}
              </label>
            </div>

            {uploadError && (
              <p className="text-red-400 text-[10px] flex items-center gap-1"><AlertCircle className="w-3 h-3" />{uploadError}</p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-gray-600 text-[10px]">OR paste URL directly</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

            {/* Existing URL input — unchanged */}
            <input
              type="url"
              value={config.qrImageUrl.startsWith("data:") ? "" : config.qrImageUrl}
              onChange={(e) => setConfig((c) => ({ ...c, qrImageUrl: e.target.value }))}
              className="w-full px-3.5 py-3 bg-[#0c0d10] border border-white/[0.06] rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all font-mono"
              placeholder="https://i.postimg.cc/... or any direct image URL"
            />
            <div className="flex items-center gap-2">
              {config.qrImageUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewQR(!previewQR)}
                  className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-[10px] font-bold transition-all"
                >
                  {previewQR ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {previewQR ? "Hide Preview" : "Preview QR"}
                </button>
              )}
            </div>
            {previewQR && config.qrImageUrl && (
              <div className="flex justify-center p-4 bg-white rounded-2xl mt-2 max-w-[200px]">
                <img
                  src={config.qrImageUrl}
                  alt="UPI QR Preview"
                  className="w-40 h-40 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </div>,
          "Upload your UPI QR image directly, or paste a direct image URL."
        )}

        {field(
          "Payment Instructions",
          <FileText className="w-3 h-3" />,
          <textarea
            value={config.instructions}
            onChange={(e) => setConfig((c) => ({ ...c, instructions: e.target.value }))}
            rows={3}
            className="w-full px-3.5 py-3 bg-[#0c0d10] border border-white/[0.06] rounded-xl focus:border-orange-500 focus:outline-none text-white transition-all resize-none leading-relaxed"
            placeholder="Instructions shown to students on the payment screen..."
          />,
          "Custom message shown above the QR code — e.g. add bank name, note to add in remarks, etc."
        )}
      </div>

      {/* Multiple QR Codes Manager */}
      <div className="bg-[#12151a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              <QrCode className="w-4 h-4 text-orange-500" />
              Multiple QR Routing Profiles
            </h3>
            <p className="text-gray-500 text-[10px] mt-0.5">
              Configure different UPI handles and QR codes for different sports (individual/team).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddQRCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add QR Code</span>
          </button>
        </div>

        {/* QR List */}
        <div className="space-y-4">
          {(!config.qrCodes || config.qrCodes.length === 0) ? (
            <div className="text-center py-6 text-gray-550 border border-dashed border-white/[0.04] rounded-xl font-mono text-[10px]">
              No custom QR profiles configured. The system will use the general payment details above.
            </div>
          ) : (
            config.qrCodes.map((qr, index) => (
              <div key={qr.id} className="bg-[#0c0d10] border border-white/[0.05] rounded-xl p-4 space-y-3 relative">
                
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-orange-400 font-mono">#{index + 1}</span>
                    <input
                      type="text"
                      className="bg-transparent border-b border-transparent hover:border-gray-700 focus:border-orange-500 focus:outline-none text-white text-xs font-bold font-mono px-1 py-0.5 w-40"
                      value={qr.label}
                      onChange={(e) => handleUpdateQRCode(qr.id, "label", e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveQRCode(index, 'up')}
                      className="p-1 hover:bg-gray-800 text-gray-400 disabled:opacity-30 rounded"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === (config.qrCodes?.length || 0) - 1}
                      onClick={() => handleMoveQRCode(index, 'down')}
                      className="p-1 hover:bg-gray-800 text-gray-400 disabled:opacity-30 rounded"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {/* Enable Toggle */}
                    <button
                      type="button"
                      onClick={() => handleUpdateQRCode(qr.id, "isActive", !qr.isActive)}
                      className={`p-1 rounded ${qr.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-500 hover:bg-gray-800'}`}
                      title={qr.isActive ? "Disable QR" : "Enable QR"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteQRCode(qr.id)}
                      className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-gray-500 font-bold">Specific UPI ID (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 bg-[#08090c] border border-white/[0.04] rounded-lg focus:border-orange-500 focus:outline-none text-xs text-white font-mono"
                      placeholder="e.g. name@upi (uses general if blank)"
                      value={qr.upiId || ""}
                      onChange={(e) => handleUpdateQRCode(qr.id, "upiId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-gray-500 font-bold">Apply To Event Type</label>
                    <select
                      className="w-full px-2.5 py-1.5 bg-[#08090c] border border-white/[0.04] rounded-lg focus:border-orange-500 focus:outline-none text-xs text-white font-mono"
                      value={qr.appliedTo}
                      onChange={(e) => handleUpdateQRCode(qr.id, "appliedTo", e.target.value)}
                    >
                      <option value="both">Both (Individual & Team)</option>
                      <option value="individual">Individual Sports Only</option>
                      <option value="team">Team Sports Only</option>
                    </select>
                  </div>
                </div>

                {/* Additional fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-gray-500 font-bold">Amount Override (₹ - Optional)</label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 bg-[#08090c] border border-white/[0.04] rounded-lg focus:border-orange-500 focus:outline-none text-xs text-white font-mono"
                      placeholder="e.g. 500 (uses general fee if blank)"
                      value={qr.amountOverride || ""}
                      onChange={(e) => handleUpdateQRCode(qr.id, "amountOverride", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-gray-500 font-bold">Custom Note (Optional)</label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 bg-[#08090c] border border-white/[0.04] rounded-lg focus:border-orange-500 focus:outline-none text-xs text-white"
                      placeholder="e.g. Recommended for GPay users"
                      value={qr.note || ""}
                      onChange={(e) => handleUpdateQRCode(qr.id, "note", e.target.value)}
                    />
                  </div>
                </div>

                {/* QR Image Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-1">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] uppercase text-gray-500 font-bold">QR Image URL / Upload</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        className="flex-1 px-2.5 py-1.5 bg-[#08090c] border border-white/[0.04] rounded-lg focus:border-orange-500 focus:outline-none text-xs text-white font-mono"
                        placeholder="Image URL or upload below"
                        value={qr.imageUrl}
                        onChange={(e) => handleUpdateQRCode(qr.id, "imageUrl", e.target.value)}
                      />
                      <input
                        id={`qr-file-${qr.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleQRCodeUpload(file, index, qr.id);
                        }}
                      />
                      <label
                        htmlFor={`qr-file-${qr.id}`}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1 select-none"
                      >
                        {uploadingIndex === index ? (
                          <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        <span>{uploadingIndex === index ? `${uploadProgress}%` : "Upload"}</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-center md:justify-end">
                    {qr.imageUrl ? (
                      <div className="bg-white p-1 rounded-lg shadow border border-white/15">
                        <img src={qr.imageUrl} alt="QR Mini" className="w-12 h-12 object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white/5 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-gray-600">
                        <QrCode className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Preview of student-facing payment card */}
      <div className="bg-[#12151a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-bold border-l-2 border-orange-500 pl-2.5">Student-Facing Preview</h3>
        <p className="text-gray-500 text-[10px]">This is how students will see the payment step after registering:</p>

        {/* Preview Wrapper */}
        {(() => {
          const activeQRs = (config.qrCodes || []).filter(q => q.isActive);
          const hasQRs = activeQRs.length > 0;
          const currentQR = hasQRs ? activeQRs[Math.min(selectedPreviewQRIndex, activeQRs.length - 1)] : null;
          
          const qrImage = currentQR?.imageUrl || config.qrImageUrl;
          const upiIdVal = currentQR?.upiId || config.upiId;
          const feeVal = currentQR?.amountOverride !== undefined ? currentQR.amountOverride : config.registrationFee;
          const noteText = currentQR?.note || null;
          const appliedText = currentQR ? `Applied to: ${currentQR.appliedTo.toUpperCase()}` : null;

          return (
            <div className="bg-[#0d0f12] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-orange-400 font-bold text-sm">Payment Required</p>
                <p className="text-gray-400 text-[10px]">{config.instructions || "Scan QR and submit UTR to complete registration"}</p>
              </div>

              {/* QR Tabs selector if multiple active QRs exist */}
              {hasQRs && (
                <div className="flex flex-wrap gap-1.5 justify-center py-1 border-y border-white/[0.03]">
                  {activeQRs.map((qr, index) => (
                    <button
                      key={qr.id}
                      type="button"
                      onClick={() => setSelectedPreviewQRIndex(index)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                        selectedPreviewQRIndex === index
                          ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                          : "bg-[#0c0d10] border-white/[0.05] text-gray-400"
                      }`}
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-2xl w-36 h-36 flex items-center justify-center shadow-lg shadow-black/30">
                  {qrImage ? (
                    <img src={qrImage} alt="QR" className="w-28 h-28 object-contain" />
                  ) : (
                    <QrCode className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-white font-bold text-sm">{config.payeeName || "Chakravyuh 2K26"}</p>
                  <p className="text-orange-400 font-mono text-xs">{upiIdVal || "upi@example"}</p>
                  
                  {appliedText && (
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{appliedText}</p>
                  )}
                  
                  {noteText && (
                    <p className="text-[9px] text-gray-400 bg-white/5 border border-white/[0.03] px-2 py-0.5 rounded mt-1 italic font-sans max-w-[180px] mx-auto text-center">{noteText}</p>
                  )}

                  <p className="text-2xl font-black text-white mt-1">
                    ₹{feeVal > 0 ? feeVal : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">UTR / Transaction ID</label>
                <input
                  disabled
                  className="w-full px-3.5 py-2.5 bg-[#0c0d10] border border-white/[0.06] rounded-xl text-gray-600 text-xs font-mono cursor-not-allowed"
                  placeholder="Enter 12-digit UTR or Transaction ID after payment"
                />
              </div>
              <div className="py-2.5 bg-orange-500/20 text-orange-400 text-center rounded-xl text-[11px] font-bold border border-orange-500/20">
                Submit Payment Proof
              </div>
            </div>
          );
        })()}
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : saved ? "Saved Successfully!" : "Save Payment Settings"}
        </button>
      </div>
    </div>
  );
}
