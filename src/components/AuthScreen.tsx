import React, { useState } from "react";
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
  BookOpen
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
  clearExternalError 
}: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync external errors from App.tsx (e.g. pending checks)
  React.useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  const handleInputChange = (field: 'email' | 'password' | 'name', value: string) => {
    if (clearExternalError) clearExternalError();
    setError("");
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'name') setDisplayName(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");
    if (clearExternalError) clearExternalError();

    // Guard: Firebase connection must be active
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      setError("Database connection missing. Please configure Firebase.");
      return;
    }

    // Real Firebase auth flow
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
              createdAt: new Date().toISOString()
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
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
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
    <div id="auth-screen-container" className="min-h-screen flex items-center justify-center bg-[#07080a] p-4 font-sans select-none overflow-hidden relative">

      {/* Animated floating orbs */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '55%', height: '55%', top: '-10%', left: '-15%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'authOrb1 9s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '45%', height: '45%', bottom: '-10%', right: '-10%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'authOrb2 11s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '20%', height: '20%', top: '40%', left: '60%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'authOrb3 7s ease-in-out infinite',
        }}
      />

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)] pointer-events-none" />

      {/* Keyframe styles */}
      <style>{`
        @keyframes authOrb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(40px,-40px) scale(1.08); }
          70% { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes authOrb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          35% { transform: translate(-30px,30px) scale(1.06); }
          70% { transform: translate(15px,-20px) scale(0.94); }
        }
        @keyframes authOrb3 {
          0%,100% { transform: scale(1); opacity:0.6; }
          50% { transform: scale(1.4); opacity:1; }
        }
        @keyframes authSpinRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes authPulseRing {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.5);  opacity: 0; }
        }
        @keyframes authSlideUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes authShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .auth-card-wrap { animation: authSlideUp 0.55s cubic-bezier(.22,1,.36,1) forwards; }
        .auth-delay-1  { animation: authSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.08s both; }
        .auth-delay-2  { animation: authSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.16s both; }
        .auth-delay-3  { animation: authSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.24s both; }
        .auth-delay-4  { animation: authSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.32s both; }
        .auth-shimmer-btn {
          background: linear-gradient(110deg, #f97316 0%, #f59e0b 40%, #fde68a 52%, #f59e0b 60%, #f97316 100%);
          background-size: 250% auto;
        }
        .auth-shimmer-btn:hover:not(:disabled) {
          animation: authShimmer 1.4s linear infinite;
        }
        .auth-input {
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
        }
        .auth-input:focus {
          border-color: rgba(249,115,22,0.6) !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.08), 0 0 20px rgba(249,115,22,0.06);
          background-color: #0b0c11 !important;
        }
        .auth-input-icon { transition: color 0.2s; }
        .auth-input-wrap:focus-within .auth-input-icon { color: #f97316; }
        .auth-google-btn { transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s; }
        .auth-google-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,255,255,0.08); }
        .auth-google-btn:active:not(:disabled) { transform: scale(0.98); }
        .auth-back-link { transition: color 0.2s, letter-spacing 0.2s; }
        .auth-back-link:hover { color: #fb923c; letter-spacing: 0.18em; }
      `}</style>

      <div className="auth-card-wrap w-full max-w-md relative z-10">
        {/* Glowing border wrapper */}
        <div
          className="rounded-3xl p-px"
          style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.35) 0%, rgba(255,255,255,0.04) 50%, rgba(245,158,11,0.25) 100%)' }}
        >
          <div className="rounded-3xl bg-[#0d0e13] p-8 relative overflow-hidden">

            {/* Subtle top glow inside card */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.025] to-transparent pointer-events-none" />

            {/* ── Branding ── */}
            <div className="text-center mb-7 auth-delay-1">
              {/* Trophy with rotating ring */}
              <div className="relative inline-flex mb-5">
                {/* Pulse ring */}
                <div
                  className="absolute inset-0 rounded-2xl bg-orange-500/25 pointer-events-none"
                  style={{ animation: 'authPulseRing 2.2s cubic-bezier(.455,.03,.515,.955) infinite' }}
                />
                {/* Rotating conic border */}
                <div
                  className="absolute -inset-[3px] rounded-[18px] pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, #f97316, transparent 40%, #f59e0b 60%, transparent 80%, #f97316)',
                    animation: 'authSpinRing 2.8s linear infinite',
                  }}
                />
                <div className="relative p-3.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl shadow-orange-500/30 z-10">
                  <Trophy className="w-6 h-6 text-[#07080a] stroke-[2.5]" />
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-[0.28em] text-orange-500/75 font-bold font-mono mb-1">
                IMS Engineering College, Ghaziabad
              </p>
              <h1 className="text-2xl font-black tracking-widest text-white font-mono uppercase leading-tight">
                CHAKRAVYUH <span className="text-orange-500">2K26</span>
              </h1>
              <p className="text-[9px] text-gray-600 mt-2 font-mono uppercase tracking-[0.18em]">
                Secure Desk for Super Admins &amp; Sport Coordinators
              </p>
            </div>

            {/* ── Info Banner ── */}
            <div className="auth-delay-2 mb-5 rounded-xl border border-orange-500/10 bg-orange-500/[0.04] px-4 py-3 flex items-start gap-2.5">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-500/60 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-200/55 leading-relaxed font-mono">
                {isSignUp
                  ? "Register a new coordinator profile. A Super Admin must approve your access request before you can manage sports."
                  : "Admin accounts are provisioned by the Super Admin. Public account registration is disabled."}
              </p>
            </div>

            {/* ── Error ── */}
            {error && (
              <div
                className="mb-4 p-3.5 bg-red-950/30 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2.5"
                style={{ animation: 'authSlideUp 0.3s ease-out' }}
              >
                <Shield className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase tracking-wider block text-[8px] text-red-500 mb-0.5">Access Denied</span>
                  <span className="leading-relaxed text-[11px]">{error}</span>
                </div>
              </div>
            )}

            {/* ── Success ── */}
            {successMsg && (
              <div
                className="mb-4 p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5"
                style={{ animation: 'authSlideUp 0.3s ease-out' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase tracking-wider block text-[8px] text-emerald-500 mb-0.5">System Status</span>
                  <span className="leading-relaxed text-[11px]">{successMsg}</span>
                </div>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleLogin} className="space-y-4 auth-delay-3">

              {/* Name (signup only) */}
              {isSignUp && (
                <div className="space-y-1.5" style={{ animation: 'authSlideUp 0.3s ease-out' }}>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Full Name</label>
                  <div className="auth-input-wrap relative">
                    <UserCheck className="auth-input-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                    <input
                      type="text"
                      required
                      className="auth-input w-full pl-10 pr-4 py-3 bg-[#08090c] border border-white/[0.07] rounded-xl text-xs text-white placeholder-gray-700 outline-none font-mono"
                      placeholder="Prof. Amit Sharma"
                      value={displayName}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Authorized Email Address</label>
                <div className="auth-input-wrap relative">
                  <Mail className="auth-input-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                  <input
                    type="email"
                    required
                    className="auth-input w-full pl-10 pr-4 py-3 bg-[#08090c] border border-white/[0.07] rounded-xl text-xs text-white placeholder-gray-700 outline-none font-mono"
                    placeholder="coordinator@imsec.ac.in"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold font-mono">Secret Password</label>
                <div className="auth-input-wrap relative">
                  <Lock className="auth-input-icon absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                  <input
                    type="password"
                    required
                    className="auth-input w-full pl-10 pr-4 py-3 bg-[#08090c] border border-white/[0.07] rounded-xl text-xs text-white placeholder-gray-700 outline-none font-mono"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="auth-shimmer-btn w-full py-3 text-[#07080a] font-black uppercase tracking-wider rounded-xl text-xs shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer outline-none disabled:opacity-60 disabled:cursor-not-allowed mt-1"
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

              {/* Toggle login/signup */}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setSuccessMsg("");
                  if (clearExternalError) clearExternalError();
                }}
                className="w-full text-center text-[10px] text-orange-500/70 hover:text-orange-400 font-bold transition-colors cursor-pointer outline-none pt-0.5 flex items-center justify-center gap-1.5 group"
              >
                <UserPlus className="w-3 h-3 transition-transform group-hover:scale-110" />
                <span>{isSignUp ? "Already have an account? Sign In" : "Need coordinator access? Request Registration"}</span>
              </button>
            </form>

            {/* ── Google Sign In ── */}
            {isFirebaseConfigured && !isSignUp && (
              <div className="mt-5 auth-delay-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <span className="text-[9px] uppercase tracking-wider text-gray-600 font-mono">or</span>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="auth-google-btn w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-3 cursor-pointer outline-none"
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

            {/* ── Footer ── */}
            {onBackToPublic && (
              <div className="mt-5 pt-4 border-t border-white/[0.04] text-center auth-delay-4">
                <button
                  type="button"
                  onClick={onBackToPublic}
                  className="auth-back-link text-[10px] text-gray-600 font-mono uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 mx-auto cursor-pointer outline-none group"
                >
                  <span className="transition-transform group-hover:-translate-x-1">←</span>
                  <span>Return to Public Fest Website</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
