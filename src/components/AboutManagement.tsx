import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { AboutSection, LeadershipProfile } from "../types";
import { uploadMedia } from "../lib/uploadService";
import { 
  Loader2, 
  User, 
  Save, 
  Building,
  Plus,
  Trash2,
  Upload,
  Video,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from "lucide-react";

export default function AboutManagement() {
  const [about, setAbout] = useState<AboutSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [collegeName, setCollegeName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [location, setLocation] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [vision, setVision] = useState("");
  const [missionText, setMissionText] = useState("");
  const [sportsQuote, setSportsQuote] = useState("");
  const [profiles, setProfiles] = useState<LeadershipProfile[]>([]);

  // Homepage video settings
  const [videoUrl, setVideoUrl] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoSaveMsg, setVideoSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVideoUploading(true);
    try {
      const url = await uploadMedia(file);
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload video.");
    } finally {
      setIsVideoUploading(false);
    }
  };

  useEffect(() => {
    loadAboutData();
    // Load existing video settings
    dbService.getHomepageSettings().then(s => {
      setVideoUrl(s.videoUrl);
      setVideoEnabled(s.videoEnabled);
    }).catch(() => {});
  }, []);

  async function loadAboutData() {
    setIsLoading(true);
    try {
      const data = await dbService.getAboutData();
      setAbout(data);
      if (data) {
        setCollegeName(data.collegeName || "");
        setLogoUrl(data.logoUrl || "/imsec-logo.svg");
        setDescription(data.description || "");
        setEstablishedYear(data.establishedYear || "");
        setLocation(data.location || "");
        setAffiliation(data.affiliation || "");
        setVision(data.vision || "");
        setMissionText((data.mission || []).join("\n"));
        setSportsQuote(data.sportsQuote || "");
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error("Failed to load about data", err);
    } finally {
      setIsLoading(false);
    }
  }

  const addProfile = () => {
    const newProfile: LeadershipProfile = {
      id: `profile_${Date.now()}`,
      title: "",
      name: "",
      photoUrl: "",
      quote: ""
    };
    setProfiles([...profiles, newProfile]);
  };

  const removeProfile = (id: string) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };

  const updateProfileField = (id: string, field: keyof LeadershipProfile, value: string) => {
    setProfiles(
      profiles.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    profileId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIds(prev => ({ ...prev, [profileId]: true }));
    try {
      const url = await uploadMedia(file, { maxImageSizeMB: 1, maxImageWidthOrHeight: 800 });
      updateProfileField(profileId, "photoUrl", url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload image.");
    } finally {
      setUploadingIds(prev => ({ ...prev, [profileId]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeName.trim() || !description.trim()) {
      alert("College Name and Description are required.");
      return;
    }

    // Validation: make sure all profiles have names and titles
    for (const prof of profiles) {
      if (!prof.title.trim() || !prof.name.trim()) {
        alert("Each profile must have a title/designation and a name.");
        return;
      }
    }

    setIsSaving(true);
    const updatedData: AboutSection = {
      id: "about",
      collegeName: collegeName.trim(),
      logoUrl: logoUrl.trim() || "/imsec-logo.svg",
      description: description.trim(),
      establishedYear: establishedYear.trim(),
      location: location.trim(),
      affiliation: affiliation.trim(),
      vision: vision.trim(),
      mission: missionText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      sportsQuote: sportsQuote.trim(),
      profiles: profiles.map(p => ({
        id: p.id,
        title: p.title.trim(),
        name: p.name.trim(),
        photoUrl: p.photoUrl.trim(),
        quote: p.quote.trim()
      })),
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.saveAboutData(updatedData);
      alert("About Page details saved successfully!");
    } catch (err) {
      console.error("Failed to save about data", err);
      alert("Failed to save About details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Synchronizing About page...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white font-mono">Chakravyuh About Page Editor</h2>
        <p className="text-xs text-gray-500 mt-1">Update college details, sports quotes, and customize leadership profiles.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6">
        
        <div className="border-b border-gray-800 pb-4 flex items-center gap-2">
          <Building className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-bold text-orange-500 font-mono uppercase tracking-wider">College & Event Identity</h3>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {/* College Name */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">College Name *</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g. IMS Engineering College"
            />
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">College Logo URL</label>
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-xl bg-white border border-gray-800 overflow-hidden flex items-center justify-center shrink-0 p-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="College logo" className="w-full h-full object-contain" />
                ) : (
                  <Building className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <input
                type="text"
                className="flex-1 px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/imsec-logo.svg"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">About Description *</label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a brief introduction about the college's sports spirit and achievements..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Established Year</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                value={establishedYear}
                onChange={(e) => setEstablishedYear(e.target.value)}
                placeholder="2002"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Location</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ghaziabad, Uttar Pradesh"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Affiliation</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="Affiliated to AKTU"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Vision</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white leading-relaxed"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="College vision statement..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Mission (one point per line)</label>
            <textarea
              rows={5}
              className="w-full px-4 py-3 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white leading-relaxed"
              value={missionText}
              onChange={(e) => setMissionText(e.target.value)}
              placeholder="Enter each mission point on a new line..."
            />
          </div>

          {/* Sports Quote */}
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Sports Theme Quote</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white italic"
              value={sportsQuote}
              onChange={(e) => setSportsQuote(e.target.value)}
              placeholder='e.g. "Champions keep playing until they get it right."'
            />
          </div>
        </div>

        {/* Leadership Profile Cards */}
        <div className="border-b border-gray-800 pb-4 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-orange-500 font-mono uppercase tracking-wider">Leadership Profiles</h3>
          </div>
          <button
            type="button"
            onClick={addProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 hover:border-orange-500/40 rounded-xl text-xs text-orange-400 font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Profile
          </button>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-8 bg-[#0d0f12] border border-dashed border-gray-800 rounded-2xl">
            <p className="text-xs text-gray-500 font-mono">No leadership profiles added yet. Click "Add Profile" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile, index) => (
              <div key={profile.id} className="bg-[#0d0f12] border border-gray-800/80 p-5 rounded-2xl space-y-4 relative group">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-orange-400 font-mono uppercase">
                    {index + 1}. Profile Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeProfile(profile.id)}
                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    title="Remove Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Title / Designation */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Designation / Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white"
                    value={profile.title}
                    onChange={(e) => updateProfileField(profile.id, "title", e.target.value)}
                    placeholder="e.g. Chairman, Director, Sports Coordinator"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white"
                    value={profile.name}
                    onChange={(e) => updateProfileField(profile.id, "name", e.target.value)}
                    placeholder="Profile Name"
                  />
                </div>

                {/* Photo URL or Upload */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-gray-500 font-mono">Photo URL or Upload</label>
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded-lg bg-[#12141a] border border-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                      {profile.photoUrl ? (
                        <img 
                          src={profile.photoUrl} 
                          alt={profile.name || "Profile"} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12141a] hover:bg-orange-500/10 border border-gray-800 hover:border-orange-500/20 rounded-lg text-[10px] text-gray-300 cursor-pointer transition-all">
                      {uploadingIds[profile.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-orange-500" />
                      )}
                      <span>{uploadingIds[profile.id] ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, profile.id)}
                        disabled={uploadingIds[profile.id]}
                      />
                    </label>
                  </div>
                  
                  <input
                    type="url"
                    className="w-full px-3 py-1.5 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-lg text-[10px] text-gray-400 font-mono"
                    value={profile.photoUrl}
                    onChange={(e) => updateProfileField(profile.id, "photoUrl", e.target.value)}
                    placeholder="Or paste URL link (e.g. https://...)"
                  />
                </div>

                {/* Quote / Message */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-gray-500 font-mono">Quote / Message</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white leading-relaxed"
                    value={profile.quote}
                    onChange={(e) => updateProfileField(profile.id, "quote", e.target.value)}
                    placeholder="Write quote or message here..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-6 border-t border-gray-800">
          <button
            type="submit"
            disabled={isSaving || Object.values(uploadingIds).some(Boolean)}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-orange-500/10"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? "Saving details..." : "Save About Page Details"}</span>
          </button>
          <button
            type="button"
            onClick={loadAboutData}
            disabled={isSaving}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs cursor-pointer transition-all"
          >
            Reset Form
          </button>
        </div>
      </form>

      {/* ══ HOMEPAGE VIDEO CONTROL ══ */}
      <div className="mt-10 bg-[#0d1117] border border-white/8 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <Video className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-white">Homepage Video</h3>
            <p className="text-[11px] text-gray-500 font-mono">Control the highlight video shown on the public home page</p>
          </div>
        </div>

        {videoSaveMsg && (
          <div className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold ${
            videoSaveMsg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}>
            {videoSaveMsg.text}
          </div>
        )}

        {/* Enable/Disable toggle */}
        <div className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5">
          <div>
            <p className="text-xs font-mono font-semibold text-white">Show Video on Home Page</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">When disabled, the video section is hidden from public view</p>
          </div>
          <button
            type="button"
            onClick={() => setVideoEnabled(v => !v)}
            className="transition-all cursor-pointer"
          >
            {videoEnabled
              ? <ToggleRight className="w-9 h-9 text-orange-400" />
              : <ToggleLeft className="w-9 h-9 text-gray-600" />}
          </button>
        </div>

        {/* URL Input or Video File Upload */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono font-semibold uppercase tracking-widest text-gray-400">
            YouTube URL / Direct Video URL OR Upload Video File
          </label>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <input
              type="text"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
              className="flex-1 bg-[#080a0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-orange-500/40 transition-all"
            />
            <label className="flex items-center justify-center gap-2 px-5 py-3 bg-[#12141a] hover:bg-orange-500/10 border border-gray-800 hover:border-orange-500/20 rounded-xl text-xs font-mono text-gray-300 font-bold cursor-pointer transition-all shrink-0">
              {isVideoUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              ) : (
                <Upload className="w-4 h-4 text-orange-400" />
              )}
              <span>{isVideoUploading ? "Uploading..." : "Upload File"}</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
                disabled={isVideoUploading}
              />
            </label>
          </div>
          <p className="text-[10px] text-gray-500 font-mono">Supports YouTube watch links, direct .mp4 URLs, or local file uploads (max 1.5MB in local sandbox)</p>
        </div>

        {/* Preview if URL set */}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-orange-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview link in new tab
          </a>
        )}

        {/* Save button */}
        <button
          type="button"
          disabled={isSavingVideo}
          onClick={async () => {
            setIsSavingVideo(true);
            setVideoSaveMsg(null);
            try {
              await dbService.saveHomepageSettings({ videoUrl: videoUrl.trim(), videoEnabled });
              setVideoSaveMsg({ type: "success", text: "✓ Video settings saved successfully!" });
              setTimeout(() => setVideoSaveMsg(null), 3000);
            } catch {
              setVideoSaveMsg({ type: "error", text: "✗ Failed to save. Please try again." });
            } finally {
              setIsSavingVideo(false);
            }
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-[#07080a] font-bold rounded-xl text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"
        >
          {isSavingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSavingVideo ? "Saving..." : "Save Video Settings"}
        </button>
      </div>

    </div>
  );
}
