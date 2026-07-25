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
  ImagePlus
} from "lucide-react";
import { dbService } from "../lib/dbService";
import { PaymentConfig } from "../types";
import { storage, isFirebaseConfigured } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const DEFAULT_CONFIG: PaymentConfig = {
  enabled: false,
  upiId: "",
  qrImageUrl: "",
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

  // QR upload add-on state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    dbService.getPaymentConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

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

                  if (isFirebaseConfigured && storage) {
                    // Firebase Storage upload
                    try {
                      const storageRef = ref(storage, `payment_qr/qr_${Date.now()}_${file.name}`);
                      const task = uploadBytesResumable(storageRef, file);
                      task.on(
                        "state_changed",
                        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                        (err) => { setUploadError(err.message); setUploading(false); },
                        async () => {
                          const url = await getDownloadURL(task.snapshot.ref);
                          setConfig((c) => ({ ...c, qrImageUrl: url }));
                          setUploading(false);
                          setUploadProgress(100);
                        }
                      );
                    } catch (err: any) {
                      setUploadError(err.message || "Upload failed");
                      setUploading(false);
                    }
                  } else {
                    // Offline fallback: read as base64 data URL
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

      {/* Live Preview of student-facing payment card */}
      <div className="bg-[#12151a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-bold border-l-2 border-orange-500 pl-2.5">Student-Facing Preview</h3>
        <p className="text-gray-500 text-[10px]">This is how students will see the payment step after registering:</p>

        <div className="bg-[#0d0f12] border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="text-center space-y-1">
            <p className="text-orange-400 font-bold text-sm">Payment Required</p>
            <p className="text-gray-400 text-[10px]">{config.instructions || "Scan QR and submit UTR to complete registration"}</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl w-36 h-36 flex items-center justify-center shadow-lg shadow-black/30">
              {config.qrImageUrl ? (
                <img src={config.qrImageUrl} alt="QR" className="w-28 h-28 object-contain" />
              ) : (
                <QrCode className="w-16 h-16 text-gray-300" />
              )}
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-white font-bold text-sm">{config.payeeName || "Chakravyuh 2K26"}</p>
              <p className="text-orange-400 font-mono text-xs">{config.upiId || "upi@example"}</p>
              <p className="text-2xl font-black text-white mt-1">
                ₹{config.registrationFee > 0 ? config.registrationFee : "—"}
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
