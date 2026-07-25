import React, { useState, useEffect } from "react";
import { dbService } from "../lib/dbService";
import { SportEvent, SportCoordinator } from "../types";
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit3, 
  Users, 
  MapPin, 
  Calendar, 
  Check, 
  X, 
  AlertCircle,
  HelpCircle,
  Clock,
  Eye,
  Upload,
  Loader2
} from "lucide-react";
import { uploadMedia } from "../lib/uploadService";

export default function EventsManagement() {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Outdoor");
  const [sportType, setSportType] = useState<'individual' | 'team'>("team");
  const [minTeamSize, setMinTeamSize] = useState(11);
  const [maxTeamSize, setMaxTeamSize] = useState(15);
  const [rules, setRules] = useState("");
  const [venue, setVenue] = useState("");
  const [image, setImage] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [maxRegistrations, setMaxRegistrations] = useState(32);
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadMedia(file);
      setImage(url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Coordinators form list
  const [coordinators, setCoordinators] = useState<SportCoordinator[]>([
    { name: "", phone: "", email: "" }
  ]);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setIsLoading(true);
    try {
      const data = await dbService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddCoordinator = () => {
    setCoordinators([...coordinators, { name: "", phone: "", email: "" }]);
  };

  const handleRemoveCoordinator = (index: number) => {
    setCoordinators(coordinators.filter((_, i) => i !== index));
  };

  const handleCoordinatorChange = (index: number, field: keyof SportCoordinator, value: string) => {
    const updated = [...coordinators];
    updated[index][field] = value;
    setCoordinators(updated);
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Outdoor");
    setSportType("team");
    setMinTeamSize(11);
    setMaxTeamSize(15);
    setRules("");
    setVenue("");
    setImage("");
    setRegistrationDeadline("");
    setMaxRegistrations(32);
    setIsActive(true);
    setCoordinators([{ name: "", phone: "", email: "" }]);
    setIsEditing(false);
    setEditId(null);
  };

  const handleEditClick = (event: SportEvent) => {
    setIsEditing(true);
    setEditId(event.id);
    setTitle(event.title);
    setCategory(event.category);
    setSportType(event.type);
    setMinTeamSize(event.minTeamSize);
    setMaxTeamSize(event.maxTeamSize);
    setRules(event.rules);
    setVenue(event.venue);
    setImage(event.image);
    // Format date string to fit datetime-local input "yyyy-MM-ddThh:mm"
    if (event.registrationDeadline) {
      try {
        const formattedDate = new Date(event.registrationDeadline).toISOString().slice(0, 16);
        setRegistrationDeadline(formattedDate);
      } catch {
        setRegistrationDeadline("");
      }
    } else {
      setRegistrationDeadline("");
    }
    setMaxRegistrations(event.maxRegistrations);
    setIsActive(event.isActive);
    setCoordinators(event.coordinators && event.coordinators.length > 0 
      ? event.coordinators 
      : [{ name: "", phone: "", email: "" }]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venue || !rules || !registrationDeadline) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    // Filter empty coordinators
    const filteredCoordinators = coordinators.filter(c => c.name.trim() !== "");

    const eventPayload = {
      title,
      category,
      type: sportType,
      minTeamSize: sportType === "individual" ? 1 : Number(minTeamSize),
      maxTeamSize: sportType === "individual" ? 1 : Number(maxTeamSize),
      rules,
      venue,
      image: image || "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800", // placeholder
      registrationDeadline: new Date(registrationDeadline).toISOString(),
      maxRegistrations: Number(maxRegistrations),
      isActive,
      coordinators: filteredCoordinators,
    };

    try {
      if (isEditing && editId) {
        await dbService.saveEvent({ ...eventPayload, id: editId });
      } else {
        await dbService.saveEvent(eventPayload);
      }
      resetForm();
      loadEvents();
    } catch (err) {
      console.error(err);
      alert("Error saving event.");
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm("Are you sure you want to delete this event category? All associated registrations will lose link references!")) {
      try {
        await dbService.deleteEvent(id);
        loadEvents();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono">Synchronizing events data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header and Call to Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">Chakravyuh Event Fields</h2>
          <p className="text-xs text-gray-500 mt-1">Configure individual and team sports, constraints, and dynamic coordinators.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Sport</span>
          </button>
        )}
      </div>

      {/* Editor Drawer / Inline Form */}
      {isEditing && (
        <div className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>{editId ? "Update Event Configuration" : "Add New Event Category"}</span>
            </h3>
            <button 
              onClick={resetForm}
              className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Event Title */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Sport Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Badminton Men's Doubles"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Category</label>
                <select
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white outline-none transition-all font-mono"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Outdoor">Outdoor Sports</option>
                  <option value="Indoor">Indoor Sports</option>
                  <option value="Athletics">Athletics Track & Field</option>
                  <option value="Esports">Esports Games</option>
                </select>
              </div>

              {/* Sport Type */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Sport Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSportType("team"); setMinTeamSize(11); setMaxTeamSize(15); }}
                    className={`py-2.5 rounded-xl text-xs font-semibold font-mono border transition-all ${sportType === "team" ? "bg-orange-500/10 border-orange-500 text-orange-400" : "bg-[#0d0f12] border-gray-800 text-gray-500"}`}
                  >
                    Team Sport
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSportType("individual"); setMinTeamSize(1); setMaxTeamSize(1); }}
                    className={`py-2.5 rounded-xl text-xs font-semibold font-mono border transition-all ${sportType === "individual" ? "bg-orange-500/10 border-orange-500 text-orange-400" : "bg-[#0d0f12] border-gray-800 text-gray-500"}`}
                  >
                    Individual
                  </button>
                </div>
              </div>

            </div>

            {sportType === "team" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0d0f12] p-4 rounded-xl border border-gray-800/60">
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Min Team Size (including captain)</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    className="w-full px-4 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white outline-none transition-all font-mono"
                    value={minTeamSize}
                    onChange={(e) => setMinTeamSize(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Max Team Size (with substitutions)</label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    className="w-full px-4 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white outline-none transition-all font-mono"
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Venue */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Match Venue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ground A, Lawn Tennis Court"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>

              {/* Max Registrations Limit */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Max Registrations Allowed</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 32"
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                  value={maxRegistrations}
                  onChange={(e) => setMaxRegistrations(Number(e.target.value))}
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white outline-none transition-all font-mono"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>

            </div>

            {/* Rules Text Box */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Rules, Requirements & Conduct Guidelines *</label>
              <textarea
                required
                rows={4}
                placeholder="List official rules, disqualification triggers, equipment requirements..."
                className="w-full px-4 py-3 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
              />
            </div>

            {/* Event Cover Image */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">Cover Image *</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <input
                    type="url"
                    placeholder="Or paste an image URL: https://..."
                    className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-[#171a22] hover:bg-orange-500/10 border border-gray-800 hover:border-orange-500/20 rounded-xl text-xs text-gray-300 cursor-pointer transition-all">
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-orange-500" />
                      )}
                      <span>{isUploading ? "Uploading..." : "Upload from Computer"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                    {image && (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    )}
                  </div>
                </div>
                {image && (
                  <div className="w-24 h-16 rounded-xl border border-gray-800 overflow-hidden shrink-0 bg-gray-900">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Coordinators Block */}
            <div className="bg-[#0d0f12] p-5 rounded-xl border border-gray-800/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-300 font-mono">Faculty & Student Coordinators</h4>
                <button
                  type="button"
                  onClick={handleAddCoordinator}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg text-[11px] transition-all"
                >
                  + Add Contact
                </button>
              </div>

              <div className="space-y-3">
                {coordinators.map((coordinator, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-500 font-mono">Full Name</label>
                      <input
                        type="text"
                        placeholder="Coordinator Name"
                        className="w-full px-3 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white outline-none"
                        value={coordinator.name}
                        onChange={(e) => handleCoordinatorChange(idx, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-500 font-mono">Mobile Contact</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        className="w-full px-3 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white outline-none font-mono"
                        value={coordinator.phone}
                        onChange={(e) => handleCoordinatorChange(idx, "phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] text-gray-500 font-mono">Email</label>
                      <input
                        type="email"
                        placeholder="name@imsec.ac.in"
                        className="w-full px-3 py-2 bg-[#12141a] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white outline-none font-mono"
                        value={coordinator.email}
                        onChange={(e) => handleCoordinatorChange(idx, "email", e.target.value)}
                      />
                    </div>
                    <div>
                      {coordinators.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCoordinator(idx)}
                          className="w-full py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 hover:border-red-500/50 text-red-400 rounded-lg text-xs font-semibold transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IsActive Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActiveToggle"
                className="w-4 h-4 bg-[#0d0f12] border-gray-800 focus:ring-0 checked:bg-orange-500 rounded cursor-pointer accent-orange-500"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="isActiveToggle" className="text-xs font-bold text-gray-300 font-mono cursor-pointer">
                Allow Registration Forms (Open Registrations)
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-800/60">
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                {editId ? "Save Changes" : "Publish Event"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid List of Available Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-[#12141a] border border-gray-800/80 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-gray-700 transition-all">
            <div>
              {/* Event Cover Photo overlay */}
              <div className="h-44 w-full relative overflow-hidden bg-gray-900">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141a] via-[#12141a]/40 to-transparent"></div>
                <span className="absolute top-3 left-3 text-[10px] uppercase font-bold font-mono tracking-wider bg-black/60 backdrop-blur-md text-orange-400 px-3 py-1 rounded-full border border-orange-500/10">
                  {event.category}
                </span>
                <span className={`absolute top-3 right-3 text-[10px] font-bold font-mono uppercase px-3 py-1 rounded-full backdrop-blur-md border ${
                  event.isActive 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {event.isActive ? "REGISTRATION OPEN" : "CLOSED"}
                </span>
              </div>

              {/* Title & Stats */}
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-base font-extrabold tracking-tight text-white font-mono">{event.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-mono">Style: <span className="text-gray-300 capitalize">{event.type}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-[#0d0f12] p-3 rounded-xl border border-gray-800/40 text-[11px] font-mono text-gray-400">
                  <div>
                    <span className="block text-[9px] text-gray-600 font-bold uppercase">TEAM CONSTRAINTS</span>
                    <span className="text-gray-300">{event.minTeamSize}-{event.maxTeamSize} athletes</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-600 font-bold uppercase">FILLED SPOTS</span>
                    <span className="text-gray-300 font-bold text-orange-400">{event.registrationCount || 0} / {event.maxRegistrations}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-600" />
                    <span>{event.venue}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-600" />
                    <span className="truncate">Deadline: {new Date(event.registrationDeadline).toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Cards Action Buttons */}
            <div className="px-5 pb-5 pt-3 border-t border-gray-800/40 flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                {event.coordinators?.map((c, i) => (
                  <div 
                    key={i} 
                    title={`${c.name} (${c.phone})`}
                    className="w-7 h-7 rounded-full bg-orange-600/10 border-2 border-[#12141a] flex items-center justify-center text-[10px] text-orange-400 font-bold uppercase"
                  >
                    {c.name.charAt(0)}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditClick(event)}
                  className="p-2 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 text-gray-400 hover:text-orange-400 rounded-xl transition-all"
                  title="Edit Event"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(event.id)}
                  className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-gray-500 hover:text-red-400 rounded-xl transition-all"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
