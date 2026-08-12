import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../lib/firebase";
import {
  Shield,
  Trophy,
  Users,
  ArrowRight,
  Sparkles,
  LogIn,
  Mail,
  Lock,
  UserCheck,
  UserPlus,
  ShieldAlert,
  Terminal,
  BookOpen,
  Zap,
  Star,
} from "lucide-react";
import { AdminUser } from "../types";

interface AuthScreenProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToPublic?: () => void;
  externalError?: string | null;
  clearExternalError?: () => void;
}

export default function AuthScreen({
  onLoginSuccess,
  onBackToPublic,
  externalError,
  clearExternalError,
}: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Typing animation state
  const [typedTitle, setTypedTitle] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  // Sync external errors from App.tsx (e.g. pending checks)
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  // Typing animation
  useEffect(() => {
    const title = "CHAKRAVYUH 2K26";
    let i = 0;
    setTypedTitle("");
    const timer = setInterval(() => {
      if (i < title.length) {
        i++;
        setTypedTitle(title.slice(0, i));
      } else {
        clearInterval(timer);
      }
    }, 75);
    return () => clearInterval(timer);
  }, []);

  // Cursor blink
  useEffect(() => {
    const blink = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(blink);
  }, []);

  const handleInputChange = (field: "email" | "password" | "name", value: string) => {
    if (clearExternalError) clearExternalError();
    setError("");
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "name") setDisplayName(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    if (clearExternalError) clearExternalError();

    if (!isFirebaseConfigured) {
      setIsLoading(false);
      setError("Database connection missing. Please configure Firebase.");
      return;
    }

    try {
      if (auth) {
        if (isSignUp) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName: displayName });
            const newUserDoc = {
              uid: userCredential.user.uid,
              email,
              displayName: displayName || email.split("@")[0].toUpperCase(),
              role: "pending",
              assignedSports: [],
              createdAt: new Date().toISOString(),
            };
            if (db) {
              await setDoc(doc(db, "users", userCredential.user.uid), newUserDoc);
            }
            setSuccessMsg("Account registered! Access request is pending approval from the Super Admin.");
            setIsSignUp(false);
            setPassword("");
            setDisplayName("");
          }
        } else {
          await signInWithEmailAndPassword(auth, email, password);
          setSuccessMsg("Authenticating session credentials...");
        }
      }
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || "Authentication failed. Please verify credentials.";
      if (err.code === "auth/email-already-in-use") {
        friendlyError = "This email is already registered. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        friendlyError = "Password should be at least 6 characters long.";
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        friendlyError = "Invalid email or password. Please verify and try again.";
      }
      setError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    if (clearExternalError) clearExternalError();

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessMsg("Authenticating session credentials...");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Allow popups for this site and try again.");
      } else {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-screen-container"
      className="min-h-screen flex bg-[#07080a] relative overflow-hidden font-sans select-none"
    >
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes chakraSpin1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes chakraSpin2 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes chakraOrb1  {
          0%,100% { transform: translate(0,0) scale(1); opacity:.6; }
          50%      { transform: translate(60px,-40px) scale(1.1); opacity:.9; }
        }
        @keyframes chakraOrb2  {
          0%,100% { transform: translate(0,0) scale(1); opacity:.5; }
          50%      { transform: translate(-40px,50px) scale(1.08); opacity:.8; }
        }
        @keyframes authFadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes authSlideRight {
          from { opacity:0; transform:translateX(-18px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes authShimmerBtn {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes formSlideIn {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes formSlideInLeft {
          from { opacity:0; transform:translateX(-20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
          50%      { box-shadow: 0 0 0 6px rgba(249,115,22,0.08); }
        }
        .au-panel-left  { animation: authFadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
        .au-d1 { animation: authFadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .au-d2 { animation: authFadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.12s both; }
        .au-d3 { animation: authFadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.20s both; }
        .au-d4 { animation: authFadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.28s both; }
        .au-d5 { animation: authFadeUp 0.55s cubic-bezier(.22,1,.36,1) 0.36s both; }
        .au-form-in  { animation: formSlideIn 0.32s cubic-bezier(.22,1,.36,1) both; }
        .au-form-out { animation: formSlideInLeft 0.32s cubic-bezier(.22,1,.36,1) both; }
        .au-shimmer-btn {
          background: linear-gradient(110deg, #f97316 0%, #f59e0b 38%, #fde68a 50%, #f59e0b 62%, #f97316 100%);
          background-size: 250% auto;
        }
        .au-shimmer-btn:hover:not(:disabled) { animation: authShimmerBtn 1.3s linear infinite; }
        .au-input {
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
          border: 1.5px solid rgba(255,255,255,0.12) !important;
        }
        .au-input:focus {
          border-color: rgba(249,115,22,0.7) !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.1), inset 0 0 20px rgba(249,115,22,0.03);
          background: #0c0d12 !important;
        }
        .au-input-wrap:focus-within .au-ico { color: #f97316; }
        .au-ico { transition: color .2s; }
        .au-google:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,255,255,0.1); }
        .au-google { transition: transform .15s, box-shadow .15s; }
        .au-back:hover { color: #fb923c; letter-spacing: .2em; }
        .au-back { transition: color .2s, letter-spacing .25s; }
        .au-tag { animation: authSlideRight 0.5s cubic-bezier(.22,1,.36,1) both; }
        .au-feature { transition: transform .2s, background .2s; }
        .au-feature:hover { transform: translateX(4px); background: rgba(249,115,22,0.08); }
      `}</style>

      {/* ── Background: rotating chakra rings ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Ring 1 */}
        <div
          style={{
            width: 700, height: 700,
            border: "1px solid rgba(249,115,22,0.06)",
            borderRadius: "50%",
            position: "absolute",
            animation: "chakraSpin1 40s linear infinite",
          }}
        />
        {/* Ring 2 */}
        <div
          style={{
            width: 520, height: 520,
            border: "1px dashed rgba(249,115,22,0.05)",
            borderRadius: "50%",
            position: "absolute",
            animation: "chakraSpin2 28s linear infinite",
          }}
        />
        {/* Ring 3 */}
        <div
          style={{
            width: 340, height: 340,
            border: "1px solid rgba(245,158,11,0.04)",
            borderRadius: "50%",
            position: "absolute",
            animation: "chakraSpin1 18s linear infinite",
          }}
        />
        {/* Center glow */}
        <div
          style={{
            width: 180, height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)",
            filter: "blur(20px)",
            position: "absolute",
          }}
        />
      </div>

      {/* Ambient orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "40%", height: "50%", top: "-5%", left: "-5%",
          background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)",
          filter: "blur(50px)",
          animation: "chakraOrb1 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: "35%", height: "45%", bottom: "-5%", right: "-5%",
          background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 65%)",
          filter: "blur(50px)",
          animation: "chakraOrb2 15s ease-in-out infinite",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
        }}
      />

      {/* ══════════════════════════════════
          LEFT PANEL — Branding
      ══════════════════════════════════ */}
      <div className="au-panel-left hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative border-r border-white/[0.04] z-10">

        {/* Top badge */}
        <div>
          <div className="au-tag inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.07]">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-orange-400">
              Annual Sports Fest · 2026
            </span>
          </div>
        </div>

        {/* Main branding */}
        <div className="space-y-6">
          {/* Trophy icon */}
          <div className="relative inline-flex">
            <div
              className="absolute -inset-[3px] rounded-2xl pointer-events-none"
              style={{
                background: "conic-gradient(from 0deg, #f97316, transparent 35%, #f59e0b 60%, transparent 80%, #f97316)",
                animation: "chakraSpin1 3s linear infinite",
                borderRadius: "18px",
              }}
            />
            <div className="relative p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-2xl shadow-orange-500/30 z-10">
              <Trophy className="w-8 h-8 text-[#07080a] stroke-[2.5]" />
            </div>
          </div>

          {/* College name */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-orange-500/70 font-bold font-mono mb-3">
              IMS Engineering College, Ghaziabad
            </p>

            {/* Typing title */}
            <h1 className="text-5xl font-black tracking-tight text-white font-mono uppercase leading-none">
              {typedTitle}
              <span
                className="inline-block w-[3px] h-10 bg-orange-500 ml-1 align-middle"
                style={{ opacity: cursorVisible ? 1 : 0, transition: "opacity 0.1s" }}
              />
            </h1>

            <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xs">
              The official administrative portal for managing Chakravyuh 2K26 — sports events, registrations, coordinators & more.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-2">
            {[
              { icon: Shield, text: "Role-based access control" },
              { icon: Zap, text: "Real-time event management" },
              { icon: Users, text: "Coordinators & staff control" },
              { icon: Star, text: "Live registration tracking" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="au-feature flex items-center gap-3 px-3 py-2 rounded-xl cursor-default"
              >
                <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/15">
                  <Icon className="w-3 h-3 text-orange-500" />
                </div>
                <span className="text-[11px] text-gray-500 font-mono">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="text-[9px] text-gray-700 font-mono uppercase tracking-wider">
          © 2026 Chakravyuh · IMSEC · All Rights Reserved
        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT PANEL — Form
      ══════════════════════════════════ */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 lg:p-10 relative z-10">
        <div className="w-full max-w-sm">

          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-8 au-d1">
            <div className="relative inline-flex mb-4">
              <div
                className="absolute -inset-[3px] rounded-2xl pointer-events-none"
                style={{
                  background: "conic-gradient(from 0deg, #f97316, transparent 40%, #f59e0b 65%, transparent 85%, #f97316)",
                  animation: "chakraSpin1 3s linear infinite",
                  borderRadius: "18px",
                }}
              />
              <div className="relative p-3.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl shadow-orange-500/25 z-10">
                <Trophy className="w-6 h-6 text-[#07080a] stroke-[2.5]" />
              </div>
            </div>
            <h1 className="text-xl font-black tracking-widest text-white font-mono uppercase">
              CHAKRAVYUH <span className="text-orange-500">2K26</span>
            </h1>
            <p className="text-[9px] text-gray-600 mt-1 font-mono uppercase tracking-wider">
              IMS Engineering College, Ghaziabad
            </p>
          </div>

          {/* Form heading */}
          <div className="au-d1 mb-6">
            <h2 className="text-xl font-black text-white font-mono uppercase tracking-wider">
              {isSignUp ? "Request Access" : "Admin Sign In"}
            </h2>
            <p className="text-[10px] text-gray-600 font-mono mt-1">
              {isSignUp
                ? "Pending approval from Super Admin"
                : "Authorized personnel only"}
            </p>
          </div>

          {/* Info banner */}
          <div className="au-d2 mb-5 rounded-xl border border-orange-500/15 bg-orange-500/[0.05] px-4 py-3 flex items-start gap-2.5">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500/60 shrink-0 mt-0.5" />
            <p className="text-[10px] text-orange-200/50 leading-relaxed font-mono">
              {isSignUp
                ? "Register a new coordinator profile. A Super Admin must approve your access."
                : "Admin accounts are provisioned by the Super Admin. Public registration is disabled."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 p-3.5 bg-red-950/30 border border-red-500/25 rounded-xl flex items-start gap-2.5"
              style={{ animation: "authFadeUp 0.3s ease-out" }}
            >
              <Shield className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-black uppercase tracking-wider block text-[8px] text-red-500 mb-0.5">
                  Access Denied
                </span>
                <span className="text-[11px] text-red-400 leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div
              className="mb-4 p-3.5 bg-emerald-950/30 border border-emerald-500/25 rounded-xl flex items-start gap-2.5"
              style={{ animation: "authFadeUp 0.3s ease-out" }}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-black uppercase tracking-wider block text-[8px] text-emerald-500 mb-0.5">
                  System Status
                </span>
                <span className="text-[11px] text-emerald-400 leading-relaxed">{successMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-4 au-d3"
            key={isSignUp ? "signup" : "login"}
            style={{ animation: isSignUp ? "formSlideIn 0.3s ease-out" : "formSlideInLeft 0.3s ease-out" }}
          >
            {/* Name - signup only */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-[9px] uppercase tracking-[0.18em] text-gray-500 font-bold font-mono">
                  Full Name
                </label>
                <div className="au-input-wrap relative">
                  <UserCheck className="au-ico absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                  <input
                    type="text"
                    required
                    className="au-input w-full pl-10 pr-4 py-3 bg-[#0a0b0f] rounded-xl text-xs text-white placeholder-gray-700 outline-none font-mono"
                    placeholder="Prof. Amit Sharma"
                    value={displayName}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[9px] uppercase tracking-[0.18em] text-gray-500 font-bold font-mono">
                Email Address
              </label>
              <div className="au-input-wrap relative">
                <Mail className="au-ico absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                <input
                  type="email"
                  required
                  className="au-input w-full pl-10 pr-4 py-3 bg-[#0a0b0f] rounded-xl text-xs text-white placeholder-gray-700 outline-none font-mono"
                  placeholder="coordinator@imsec.ac.in"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[9px] uppercase tracking-[0.18em] text-gray-500 font-bold font-mono">
                Password
              </label>
              <div className="au-input-wrap relative">
                <Lock className="au-ico absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                <input
                  type="password"
                  required
                  className="au-input w-full pl-10 pr-4 py-3 bg-[#0a0b0f] rounded-xl text-xs text-white placeholder-gray-700 outline-none font-mono"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="au-shimmer-btn w-full py-3.5 text-[#07080a] font-black uppercase tracking-wider rounded-xl text-xs shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer outline-none disabled:opacity-60 mt-2 transition-shadow"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#07080a]/30 border-t-[#07080a] rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>{isSignUp ? "Submit Registration Request" : "Enter Administrative Portal"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccessMsg("");
                if (clearExternalError) clearExternalError();
              }}
              className="w-full text-center text-[10px] text-orange-500/60 hover:text-orange-400 font-bold transition-colors cursor-pointer outline-none pt-1 flex items-center justify-center gap-1.5 group"
            >
              <UserPlus className="w-3 h-3 transition-transform group-hover:scale-110" />
              <span>
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Need coordinator access? Request Registration"}
              </span>
            </button>
          </form>

          {/* Google Sign In */}
          {isFirebaseConfigured && !isSignUp && (
            <div className="mt-5 au-d4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[9px] uppercase tracking-wider text-gray-700 font-mono">or</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="au-google w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-3 cursor-pointer outline-none"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* Back to public */}
          {onBackToPublic && (
            <div className="mt-6 pt-4 border-t border-white/[0.04] text-center au-d5">
              <button
                type="button"
                onClick={onBackToPublic}
                className="au-back text-[9px] text-gray-700 font-mono uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 mx-auto cursor-pointer outline-none group"
              >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                <span>Return to Public Fest Website</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
