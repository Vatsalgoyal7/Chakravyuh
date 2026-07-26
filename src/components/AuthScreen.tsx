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
  UserPlus
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

    // Offline sandbox flow if Firebase is not active
    if (!isFirebaseConfigured) {
      setTimeout(() => {
        setIsLoading(false);
        if (isSignUp) {
          // Register a mock user in sandbox
          const newUser: AdminUser = {
            uid: `mock_${Date.now()}`,
            email: email,
            displayName: displayName || email.split("@")[0].toUpperCase(),
            role: "coordinator",
            assignedSports: [],
            createdAt: new Date().toISOString(),
          };
          const existing = JSON.parse(localStorage.getItem("chakravyuh_2k26_users") || "[]");
          existing.push(newUser);
          localStorage.setItem("chakravyuh_2k26_users", JSON.stringify(existing));
          setSuccessMsg("Account request submitted! You can now log in using Sandbox quick logins or credentials.");
          setIsSignUp(false);
          setPassword("");
          setDisplayName("");
        } else {
          // Normal sandbox login
          if (email === "superadmin@imsec.ac.in") {
            onLoginSuccess({
              uid: "mock_super_admin",
              email: "superadmin@imsec.ac.in",
              displayName: "Vatsal Goyal (Super Admin)",
              role: "super_admin",
              assignedSports: [],
              createdAt: new Date().toISOString(),
            });
          } else if (email === "cricket.coord@imsec.ac.in") {
            onLoginSuccess({
              uid: "mock_coord_cricket",
              email: "cricket.coord@imsec.ac.in",
              displayName: "Prof. Amit Sharma (Cricket Coord)",
              role: "coordinator",
              assignedSports: ["cricket_2026"],
              createdAt: new Date().toISOString(),
            });
          } else if (email === "tt.coord@imsec.ac.in") {
            onLoginSuccess({
              uid: "mock_coord_tt",
              email: "tt.coord@imsec.ac.in",
              displayName: "Prof. Priya Verma (TT Coord)",
              role: "coordinator",
              assignedSports: ["table_tennis_singles"],
              createdAt: new Date().toISOString(),
            });
          } else {
            // Check in localStorage created users first
            const existing = JSON.parse(localStorage.getItem("chakravyuh_2k26_users") || "[]");
            const found = existing.find((u: any) => u.email === email);
            if (found) {
              onLoginSuccess(found);
            } else {
              // Allow custom simulated logins for complete freedom
              onLoginSuccess({
                uid: `mock_${Date.now()}`,
                email: email,
                displayName: email.split("@")[0].toUpperCase(),
                role: "coordinator",
                assignedSports: ["cricket_2026"],
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }, 800);
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

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("chakravyuh2026");
    setError("");
    setSuccessMsg("");
    if (clearExternalError) clearExternalError();
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      let user: AdminUser;
      if (demoEmail === "superadmin@imsec.ac.in") {
        user = {
          uid: "mock_super_admin",
          email: "superadmin@imsec.ac.in",
          displayName: "Vatsal Goyal (Super Admin)",
          role: "super_admin",
          assignedSports: [],
          createdAt: new Date().toISOString(),
        };
      } else {
        user = {
          uid: "mock_coord_cricket",
          email: "cricket.coord@imsec.ac.in",
          displayName: "Prof. Amit Sharma (Cricket Coordinator)",
          role: "coordinator",
          assignedSports: ["cricket_2026"],
          createdAt: new Date().toISOString(),
        };
      }
      onLoginSuccess(user);
    }, 400);
  };

  return (
    <div id="auth-screen-container" className="min-h-screen flex items-center justify-center bg-[#07080a] p-4 font-sans select-none overflow-hidden relative">
      {/* Visual Ambient Blur Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/[0.04] blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/[0.04] blur-[120px] pointer-events-none"></div>

      {/* Tech Grid mask */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />

      <div className="w-full max-w-lg glass-panel hover:glass-panel-glow border border-white/[0.05] rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Branding Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/20 mb-4 animate-pulse">
            <Trophy className="w-6 h-6 text-[#07080a] stroke-[2.5]" />
          </div>
          <h2 className="text-xs uppercase tracking-[0.25em] text-orange-500 font-bold mb-1.5 font-mono">
            IMS Engineering College, Ghaziabad
          </h2>
          <h1 className="text-2xl font-black tracking-widest text-white font-mono uppercase">
            CHAKRAVYUH <span className="text-orange-500">2K26</span>
          </h1>
          <p className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-wider">
            Secure Desk for Super Admins & Sport Coordinators
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-[11px] text-orange-200">
          {isSignUp 
            ? "Register a new coordinator profile. A Super Admin must approve your access request before you can manage sports."
            : "Admin accounts are provisioned by the Super Admin. Public account registration is disabled."
          }
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-950/20 border border-red-500/20 rounded-2xl text-xs text-red-400 flex items-start gap-2.5 animate-in fade-in">
            <Shield className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block text-[9px]">Access Denied</span>
              <span className="block mt-0.5 leading-normal">{error}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 flex items-start gap-2.5 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block text-[9px]">System Status</span>
              <span className="block mt-0.5 leading-normal">{successMsg}</span>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
              <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">
                Full Name
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#08090c] border border-white/[0.06] focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                  placeholder="Prof. Amit Sharma"
                  value={displayName}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">
              Authorized Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#08090c] border border-white/[0.06] focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                placeholder="coordinator@imsec.ac.in"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#08090c] border border-white/[0.06] focus:border-orange-500 rounded-xl text-xs text-white placeholder-gray-600 outline-none transition-all font-mono"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-[#07080a] font-black uppercase tracking-wider rounded-xl text-xs transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer outline-none"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-[#07080a] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? "Submit Registration Request" : "Enter Administrative Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setSuccessMsg("");
              if (clearExternalError) clearExternalError();
            }}
            className="w-full text-center text-xs text-orange-500 hover:text-orange-400 font-bold transition-all hover:underline cursor-pointer outline-none mt-2"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need coordinator access? Request Registration"}
          </button>
        </form>

        {isFirebaseConfigured && !isSignUp && (
          <div className="mt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">or</span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-3 cursor-pointer outline-none"
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


        {/* Sandbox Live Role Testing (Quick Logins) */}
        {!isFirebaseConfigured && (
          <div className="mt-6 pt-5 border-t border-white/[0.04]">
            <div className="flex items-center gap-2 mb-3 text-gray-400">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h3 className="text-[10px] uppercase tracking-wider font-bold font-mono">
                Sandbox Role Testing (Quick Logins)
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => handleQuickLogin("superadmin@imsec.ac.in")}
                className="p-3 bg-[#0c0d10] hover:bg-orange-500/[0.03] border border-white/[0.05] hover:border-orange-500/20 rounded-2xl transition-all text-left group cursor-pointer outline-none"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5 group-hover:text-orange-500">
                  <Shield className="w-3.5 h-3.5 text-orange-500" />
                  <span>Super Admin</span>
                </div>
                <p className="text-[9px] text-gray-500 font-mono">Full Access Controls</p>
              </button>

              <button
                onClick={() => handleQuickLogin("cricket.coord@imsec.ac.in")}
                className="p-3 bg-[#0c0d10] hover:bg-orange-500/[0.03] border border-white/[0.05] hover:border-orange-500/20 rounded-2xl transition-all text-left group cursor-pointer outline-none"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5 group-hover:text-orange-500">
                  <Users className="w-3.5 h-3.5 text-orange-500" />
                  <span>Coordinator</span>
                </div>
                <p className="text-[9px] text-gray-500 font-mono">Cricket Sport Access</p>
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-[10px] text-gray-600 font-mono uppercase tracking-wider">
          {!isFirebaseConfigured ? (
            <span className="text-amber-500/70 block mb-3 leading-normal font-bold">
              ⚡ Local sandbox mode active. Session persistent in client storage.
            </span>
          ) : (
            <span className="text-emerald-500/70 block mb-3 leading-normal font-bold">
              🛡️ Live production container. Authenticating on official Firestore.
            </span>
          )}
          {onBackToPublic && (
            <button
              type="button"
              onClick={onBackToPublic}
              className="text-orange-500 hover:text-orange-400 font-bold transition-all hover:underline cursor-pointer outline-none"
            >
              &larr; Return to Public Fest Website
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
