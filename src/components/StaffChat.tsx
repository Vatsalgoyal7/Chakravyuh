import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../lib/dbService";
import { AdminUser, ChatMessage, CustomCategory, SportEvent } from "../types";
import { roleDisplayLabel } from "../lib/permissions";
import {
  MessageSquare,
  Send,
  User,
  Phone,
  Mail,
  X,
  Edit3,
  Save,
  Shield,
  Users,
  Search,
  Trophy,
  Smile,
  Home,
  Building2,
  Sparkles,
  MapPin
} from "lucide-react";

interface StaffChatProps {
  currentUser: AdminUser;
  onUpdateUser?: (user: AdminUser) => void;
}

export default function StaffChat({ currentUser, onUpdateUser }: StaffChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  
  // Search & Filtering State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [activeChatTab, setActiveChatTab] = useState<"admins" | "coordinators">("admins");
  const [selectedRoom, setSelectedRoom] = useState<string>("admins_group");
  const [inputText, setInputText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "group" | "private">("all");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Profile Drawer State
  const [drawerUser, setDrawerUser] = useState<AdminUser | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Profile Form Fields
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileRollNo, setProfileRollNo] = useState("");
  const [profileBranch, setProfileBranch] = useState("");
  const [profileResidency, setProfileResidency] = useState<'hosteler' | 'day_scholar'>("day_scholar");
  const [profileRoomNo, setProfileRoomNo] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize and subscribe to real-time messages
  useEffect(() => {
    loadInitialData();
    const unsubscribe = dbService.subscribeToMessages((msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedRoom]);

  async function loadInitialData() {
    try {
      const [allUsers, allEvents, allCats] = await Promise.all([
        dbService.getUsers(),
        dbService.getEvents(),
        dbService.getCategories()
      ]);
      setUsers(allUsers);
      setEvents(allEvents);
      setCategories(allCats);
    } catch (e) {
      console.error("Failed to load chat metadata:", e);
    }
  }

  // Handle message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderUid: currentUser.uid,
      senderName: currentUser.displayName,
      senderRole: currentUser.role === "super_admin" ? "super_admin" : "admin",
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      recipientId: selectedRoom
    };

    if (currentUser.role === "coordinator") {
      newMessage.senderRole = "coordinator";
    }

    try {
      await dbService.sendMessage(newMessage);
      setInputText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Open profile drawer
  const handleOpenDrawer = (user: AdminUser) => {
    setDrawerUser(user);
    setIsEditingProfile(false);
    
    // Load form details
    setProfileName(user.displayName);
    setProfilePhone(user.phone || "");
    setProfileRollNo(user.rollNo || "");
    setProfileBranch(user.branch || "");
    setProfileResidency(user.residency || "day_scholar");
    setProfileRoomNo(user.roomNo || "");
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerUser) return;

    const updatedUser: AdminUser = {
      ...drawerUser,
      displayName: profileName.trim() || drawerUser.displayName,
      phone: profilePhone.trim() || undefined,
      rollNo: profileRollNo.trim() || undefined,
      branch: profileBranch.trim() || undefined,
      residency: profileResidency,
      roomNo: profileResidency === "hosteler" ? profileRoomNo.trim() || undefined : undefined
    };

    try {
      const saved = await dbService.saveUser(updatedUser);
      // Update local states
      setUsers(prev => prev.map(u => u.uid === saved.uid ? saved : u));
      setDrawerUser(saved);
      setIsEditingProfile(false);
      
      // Update session if it's the current user
      if (saved.uid === currentUser.uid && onUpdateUser) {
        onUpdateUser(saved);
      }
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  // Helper: Filter rooms and private contacts based on roles
  const getChatRooms = () => {
    const chatRooms: { id: string; name: string; type: "group" | "private"; roleLabel?: string; info?: string }[] = [];
    const lowerQuery = userSearchQuery.toLowerCase();

    // ───────────────── SUPER ADMIN WORKFLOW ─────────────────
    if (currentUser.role === "super_admin") {
      if (activeChatTab === "admins") {
        chatRooms.push({ id: "admins_group", name: "All Admins Group", type: "group", info: "Broadcasting to all managers" });
        
        // List of all admins
        users
          .filter(u => u.role === "admin" && u.uid !== currentUser.uid)
          .filter(u => u.displayName.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
          .forEach(admin => {
            chatRooms.push({
              id: admin.uid,
              name: admin.displayName,
              type: "private",
              roleLabel: `ADMIN · ${admin.adminCategory || "General"}`,
              info: admin.email
            });
          });
      } else {
        chatRooms.push({ id: "coordinators_group", name: "All Coordinators Group", type: "group", info: "Broadcasting to all coordinators" });
        
        // List of all sports coordinator groups
        events.forEach(sport => {
          chatRooms.push({
            id: `${sport.id}_group`,
            name: `${sport.title} Group`,
            type: "group",
            info: `All coordinators of ${sport.title}`
          });
        });

        // List of all coordinators
        users
          .filter(u => u.role === "coordinator")
          .filter(u => u.displayName.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
          .forEach(coord => {
            const sportsList = coord.assignedSports?.map(sId => events.find(e => e.id === sId)?.title || sId).join(", ") || "No sports";
            chatRooms.push({
              id: coord.uid,
              name: coord.displayName,
              type: "private",
              roleLabel: "COORDINATOR",
              info: sportsList
            });
          });
      }
    }
    
    // ───────────────── ADMIN WORKFLOW ─────────────────
    else if (currentUser.role === "admin") {
      chatRooms.push({ id: "admins_group", name: "All Admins Chat", type: "group", info: "Managers community" });
      const actualSuperAdmin = users.find(u => u.role === "super_admin");
      const superAdminId = actualSuperAdmin ? actualSuperAdmin.uid : "mock_super_admin";
      const superAdminName = actualSuperAdmin ? actualSuperAdmin.displayName : "Super Admin (Vatsal Goyal)";
      const superAdminEmail = actualSuperAdmin ? actualSuperAdmin.email : "superadmin@imsec.ac.in";
      chatRooms.push({ id: superAdminId, name: superAdminName, type: "private", roleLabel: "SUPER ADMIN", info: superAdminEmail });

      const adminCategory = (currentUser.adminCategory || "General").toLowerCase();
      const adminSports = currentUser.assignedSports || [];
      const hasSportsRestriction = adminCategory === "sports" && adminSports.length > 0;

      // Group rooms for admin's sports
      events
        .filter(sport => !hasSportsRestriction || adminSports.includes(sport.id))
        .forEach(sport => {
          chatRooms.push({
            id: `${sport.id}_group`,
            name: `${sport.title} Coord Group`,
            type: "group",
            info: `Group chat for ${sport.title}`
          });
        });

      // Coordinators under admin's jurisdiction
      users
        .filter(u => u.role === "coordinator")
        .filter(coord => {
          if (!hasSportsRestriction) return true;
          const coordSports = coord.assignedSports || [];
          return coordSports.some(sId => adminSports.includes(sId));
        })
        .filter(u => u.displayName.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
        .forEach(coord => {
          const sportsList = coord.assignedSports?.map(sId => events.find(e => e.id === sId)?.title || sId).join(", ") || "No sports";
          chatRooms.push({
            id: coord.uid,
            name: coord.displayName,
            type: "private",
            roleLabel: "COORDINATOR",
            info: sportsList
          });
        });
    }
    
    // ───────────────── COORDINATOR WORKFLOW ─────────────────
    else if (currentUser.role === "coordinator") {
      const actualSuperAdmin = users.find(u => u.role === "super_admin");
      const superAdminId = actualSuperAdmin ? actualSuperAdmin.uid : "mock_super_admin";
      const superAdminName = actualSuperAdmin ? actualSuperAdmin.displayName : "Super Admin (Vatsal Goyal)";
      const superAdminEmail = actualSuperAdmin ? actualSuperAdmin.email : "superadmin@imsec.ac.in";
      chatRooms.push({ id: superAdminId, name: superAdminName, type: "private", roleLabel: "SUPER ADMIN", info: superAdminEmail });

      const coordSports = currentUser.assignedSports || [];

      // Sports group chat for this coordinator
      events
        .filter(sport => coordSports.includes(sport.id))
        .forEach(sport => {
          chatRooms.push({
            id: `${sport.id}_group`,
            name: `${sport.title} Coord Group`,
            type: "group",
            info: `Sport coordinates chat room`
          });
        });

      // Supervising admins who share their sports, or general admins
      users
        .filter(u => u.role === "admin")
        .filter(admin => {
          const adminCat = (admin.adminCategory || "General").toLowerCase();
          if (adminCat === "general") return true;
          if (adminCat === "sports") {
            const adminSports = admin.assignedSports || [];
            return adminSports.some(sId => coordSports.includes(sId));
          }
          return false;
        })
        .filter(u => u.displayName.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
        .forEach(admin => {
          chatRooms.push({
            id: admin.uid,
            name: admin.displayName,
            type: "private",
            roleLabel: `ADMIN · ${admin.adminCategory || "General"}`,
            info: admin.email
          });
        });
    }

    return chatRooms;
  };

  // Helper: Filter messages by selected room
  const getFilteredMessages = () => {
    return messages.filter(msg => {
      // Group chats
      if (selectedRoom.endsWith("_group")) {
        return msg.recipientId === selectedRoom;
      }
      
      // Private chats: Message is either (sender -> recipient) or (recipient -> sender)
      return (
        (msg.senderUid === currentUser.uid && msg.recipientId === selectedRoom) ||
        (msg.senderUid === selectedRoom && msg.recipientId === currentUser.uid)
      );
    });
  };

  const getOnlineStatus = (roomId: string, roomType: "group" | "private") => {
    if (roomType === "group") return null;
    if (roomId === currentUser.uid) return "online";
    const userMsgs = messages.filter(m => m.senderUid === roomId);
    if (userMsgs.length > 0) {
      const latestMsg = userMsgs[userMsgs.length - 1];
      const diffMs = Date.now() - new Date(latestMsg.timestamp).getTime();
      if (diffMs < 15 * 60 * 1000) {
        return "online";
      }
    }
    return "recent";
  };

  const activeRooms = getChatRooms();
  const filteredRooms = activeRooms.filter(room => {
    if (filterType === "all") return true;
    return room.type === filterType;
  });
  const activeRoomData = activeRooms.find(r => r.id === selectedRoom) || { name: "System Log Thread", info: "Broadcasting room" };
  const filteredMessages = getFilteredMessages();

  return (
    <div className="h-[calc(100vh-140px)] border border-gray-800 bg-[#0d0f12] rounded-2xl overflow-hidden flex relative">
      
      {/* ── LEFT ROOMS PANEL ── */}
      <aside className="w-80 border-r border-gray-800 flex flex-col bg-[#111317]">
        {/* Super admin toggle column headers */}
        {currentUser.role === "super_admin" && (
          <div className="flex border-b border-gray-800 shrink-0">
            <button
              onClick={() => {
                setActiveChatTab("admins");
                setSelectedRoom("admins_group");
              }}
              className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeChatTab === "admins"
                  ? "border-orange-500 text-orange-400 bg-orange-500/[0.02]"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Admins Chat
            </button>
            <button
              onClick={() => {
                setActiveChatTab("coordinators");
                setSelectedRoom("coordinators_group");
              }}
              className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeChatTab === "coordinators"
                  ? "border-orange-500 text-orange-400 bg-orange-500/[0.02]"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              Coordinators Chat
            </button>
          </div>
        )}

        {/* User Search Input */}
        <div className="p-4 border-b border-gray-800 shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search channels & users..."
              className="w-full pl-9 pr-4 py-2 bg-[#08090c] border border-gray-800 focus:border-orange-500/40 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Quick Filter Buttons */}
          <div className="flex gap-1.5 bg-[#0a0b0d] p-1 rounded-lg border border-gray-850">
            {(["all", "group", "private"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`flex-1 py-1 text-[10px] font-bold font-mono uppercase rounded-md transition-all cursor-pointer ${
                  filterType === t
                    ? "bg-orange-500/10 border border-orange-500/20 text-orange-400 font-extrabold"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t === "all" ? "All" : t === "group" ? "Groups" : "DMs"}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-900/30">
          {filteredRooms.map((room) => {
            const isSelected = room.id === selectedRoom;
            const status = getOnlineStatus(room.id, room.type);
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`w-full p-3.5 flex items-start gap-3 transition-all text-left outline-none cursor-pointer ${
                  isSelected ? "bg-orange-500/[0.04] border-l-2 border-orange-500" : "hover:bg-white/[0.01]"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] shrink-0 relative ${
                  room.type === "group" 
                    ? "bg-orange-500/10 border border-orange-500/20 text-orange-400"
                    : "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                }`}>
                  {room.type === "group" ? <Users className="w-4 h-4" /> : room.name.charAt(0).toUpperCase()}
                  {room.type === "private" && (
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111317] ${
                      status === "online" ? "bg-emerald-500 animate-pulse" : "bg-amber-500/50"
                    }`} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{room.name}</span>
                    {room.roleLabel && (
                      <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-400 shrink-0">
                        {room.roleLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{room.info}</p>
                </div>
              </button>
            );
          })}
          {filteredRooms.length === 0 && (
            <p className="text-xs text-gray-600 italic p-6 text-center font-mono">No matching contacts found.</p>
          )}
        </div>

        {/* Current profile status footer */}
        <div className="p-3 bg-[#0d0f12] border-t border-gray-800 shrink-0 flex items-center justify-between">
          <button
            onClick={() => handleOpenDrawer(currentUser)}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="w-7.5 h-7.5 rounded-full bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-extrabold text-xs group-hover:bg-orange-500/20 transition-all">
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-200 truncate group-hover:text-white">{currentUser.displayName}</p>
              <p className="text-[9px] text-orange-500 font-mono tracking-wider">My Profile Settings</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ── RIGHT MESSAGES CHAT STREAM ── */}
      <main className="flex-1 flex flex-col bg-[#0a0b0d] relative">
        {/* Chat Thread Header */}
        <header className="p-4 border-b border-gray-800 bg-[#111317]/80 backdrop-blur-md sticky top-0 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {activeRoomData.name}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{activeRoomData.info}</p>
          </div>
          
          {/* If private message, let you open contact profile */}
          {!selectedRoom.endsWith("_group") && (
            <button
              onClick={() => {
                const found = users.find(u => u.uid === selectedRoom);
                if (found) handleOpenDrawer(found);
              }}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-[9px] font-bold rounded-lg transition-all border border-gray-700 cursor-pointer"
            >
              View Member Profile
            </button>
          )}
        </header>

        {/* Chat Bubbles */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {filteredMessages.map((msg) => {
            const isMe = msg.senderUid === currentUser.uid;
            const msgSender = users.find(u => u.uid === msg.senderUid) || { role: msg.senderRole, displayName: msg.senderName };
            const roleLabel = isMe ? "ME" : roleDisplayLabel(msgSender as AdminUser);
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <button
                  onClick={() => {
                    const found = users.find(u => u.uid === msg.senderUid);
                    if (found) handleOpenDrawer(found);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700/60 flex items-center justify-center text-gray-300 font-black text-xs shrink-0 cursor-pointer hover:border-orange-500/30 transition-all select-none"
                >
                  {msg.senderName.charAt(0).toUpperCase()}
                </button>

                <div className="space-y-1">
                  {/* Sender Metadata */}
                  <div className={`flex items-center gap-2 text-[10px] ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="font-bold text-gray-300">{msg.senderName}</span>
                    <span className="text-[8px] font-mono bg-gray-800 border border-gray-700 text-gray-500 px-1 py-0.2 rounded font-black">
                      {roleLabel}
                    </span>
                    <span className="text-gray-600 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Bubble content */}
                  <div className={`p-3 rounded-2xl text-xs font-mono break-all leading-normal whitespace-pre-wrap ${
                    isMe 
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 text-black font-extrabold rounded-tr-none" 
                      : "bg-[#111317] border border-gray-800 text-gray-200 rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 p-8">
              <MessageSquare className="w-8 h-8 text-gray-700 animate-bounce mb-2" />
              <p className="text-xs font-mono">No operations updates posted in this channel.</p>
              <p className="text-[10px] text-gray-700 font-mono mt-1">Start the thread by typing a message below.</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#111317]/50 border-t border-gray-800 shrink-0 flex items-center gap-2 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 bg-[#08090c] hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-orange-500 rounded-xl cursor-pointer transition-all outline-none"
              title="Add Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-0 bg-[#0d0e12] border border-gray-800 rounded-2xl p-3 shadow-2xl z-50 w-52 grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                {["🏆", "⚽", "🏏", "🏀", " volleyball", "🏐", "🏓", "📣", "🔥", "👍", "👏", "🙌", "🚀", "📢", "🎯", "🎉"].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText(prev => prev + (emoji === " volleyball" ? "🏐" : emoji));
                      setShowEmojiPicker(false);
                    }}
                    className="text-base hover:bg-white/[0.05] p-1.5 rounded-lg transition-colors cursor-pointer text-center outline-none"
                  >
                    {emoji === " volleyball" ? "🏐" : emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder={`Post message to ${activeRoomData.name}...`}
            className="flex-1 px-4 py-2.5 bg-[#08090c] border border-gray-800 focus:border-orange-500/40 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="submit"
            className="p-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-black font-bold rounded-xl shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </main>

      {/* ── CONTEXTUAL SIDE PROFILE DRAWER ── */}
      {drawerUser && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex justify-end">
          <div className="w-80 h-full bg-[#111317] border-l border-gray-800 p-6 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 shrink-0">
              <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-orange-500">
                Staff Identity Card
              </h3>
              <button
                onClick={() => setDrawerUser(null)}
                className="text-gray-500 hover:text-white p-1 hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {isEditingProfile ? (
              // ── EDITING PROFILE FORM ──
              <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto space-y-4 pt-4 min-h-0">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Display Name</label>
                  <input
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Mobile Number</label>
                  <input
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white font-mono"
                    placeholder="e.g. 9876543210"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Roll Number</label>
                  <input
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white font-mono"
                    placeholder="e.g. E26CS001"
                    value={profileRollNo}
                    onChange={(e) => setProfileRollNo(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Branch / Department</label>
                  <input
                    className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white"
                    placeholder="e.g. CSE / ECE / IT"
                    value={profileBranch}
                    onChange={(e) => setProfileBranch(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Residency Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileResidency("day_scholar")}
                      className={`flex-1 py-2 text-xs rounded-lg border font-mono transition-all cursor-pointer ${
                        profileResidency === "day_scholar"
                          ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                          : "bg-transparent border-gray-800 text-gray-500"
                      }`}
                    >
                      Day Scholar
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileResidency("hosteler")}
                      className={`flex-1 py-2 text-xs rounded-lg border font-mono transition-all cursor-pointer ${
                        profileResidency === "hosteler"
                          ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                          : "bg-transparent border-gray-800 text-gray-500"
                      }`}
                    >
                      Hosteler
                    </button>
                  </div>
                </div>

                {profileResidency === "hosteler" && (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                    <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-mono font-bold">Hostel Room Number</label>
                    <input
                      className="w-full px-3 py-2 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-lg text-xs text-white font-mono"
                      placeholder="e.g. B-302"
                      value={profileRoomNo}
                      onChange={(e) => setProfileRoomNo(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-800 shrink-0">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              // ── DISPLAYING CARD PROFILE VIEW ──
              <div className="flex-1 overflow-y-auto space-y-6 pt-5 min-h-0">
                {/* Visual Avatar Card */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center text-white text-2xl font-black shadow-lg mb-3">
                    {drawerUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">{drawerUser.displayName}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{drawerUser.email}</p>
                  
                  <span className="mt-2.5 px-3 py-0.8 rounded-full text-[9px] font-bold font-mono tracking-wider border bg-orange-500/10 border-orange-500/20 text-orange-400 uppercase">
                    {roleDisplayLabel(drawerUser)}
                  </span>
                </div>

                <div className="space-y-4 border-t border-gray-800/60 pt-4">
                  {/* Category Details */}
                  {drawerUser.role === "admin" && (
                    <div className="flex items-start gap-2.5 text-xs">
                      <Shield className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Assigned Category</p>
                        <p className="text-gray-300 font-semibold mt-0.5">{drawerUser.adminCategory || "General (Full Access)"}</p>
                      </div>
                    </div>
                  )}

                  {/* Contact Number */}
                  <div className="flex items-start gap-2.5 text-xs">
                    <Phone className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Mobile Contact</p>
                      <p className="text-gray-300 font-semibold font-mono mt-0.5">{drawerUser.phone || "—"}</p>
                    </div>
                  </div>

                  {/* Mail */}
                  <div className="flex items-start gap-2.5 text-xs">
                    <Mail className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Official Email</p>
                      <p className="text-gray-300 font-semibold font-mono mt-0.5">{drawerUser.email}</p>
                    </div>
                  </div>

                  {/* Roll No */}
                  <div className="flex items-start gap-2.5 text-xs">
                    <Building2 className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Roll No & Branch</p>
                      <p className="text-gray-300 font-semibold font-mono mt-0.5">
                        {drawerUser.rollNo || "—"} {drawerUser.branch ? `(${drawerUser.branch})` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Residency Status */}
                  <div className="flex items-start gap-2.5 text-xs">
                    <Home className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Campus Residency</p>
                      <p className="text-gray-300 font-semibold mt-0.5">
                        {drawerUser.residency === "hosteler" ? `Hosteler (Room: ${drawerUser.roomNo || "—"})` : "Day Scholar"}
                      </p>
                    </div>
                  </div>

                  {/* Sports Scope */}
                  {(drawerUser.role === "coordinator" || (drawerUser.role === "admin" && (drawerUser.adminCategory || "General").toLowerCase() === "sports")) && (
                    <div className="flex items-start gap-2.5 text-xs">
                      <Trophy className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-gray-500 font-mono">Assigned Sports Scope</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(!drawerUser.assignedSports || drawerUser.assignedSports.length === 0) ? (
                            <span className="text-[10px] text-gray-500 italic font-mono">All Sports control</span>
                          ) : (
                            drawerUser.assignedSports.map(id => {
                              const s = events.find(e => e.id === id);
                              return (
                                <span key={id} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded border border-gray-700 text-[8px] font-bold font-mono">
                                  {s ? s.title : id}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit Button if it's the current user */}
                {drawerUser.uid === currentUser.uid && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-gray-700 shrink-0 mt-6"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit My Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
