import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import PublicWebsite from "./components/PublicWebsite";
import { AdminUser } from "./types";
import { mapFirestoreUserProfile, canAccessTab } from "./lib/permissions";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./lib/firebase";

const AuthScreen = lazy(() => import("./components/AuthScreen"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const DashboardOverview = lazy(() => import("./components/DashboardOverview"));
const EventsManagement = lazy(() => import("./components/EventsManagement"));
const RegistrationsManagement = lazy(() => import("./components/RegistrationsManagement"));
const SchedulesManagement = lazy(() => import("./components/SchedulesManagement"));
const NotificationsManagement = lazy(() => import("./components/NotificationsManagement"));
const GalleryManagement = lazy(() => import("./components/GalleryManagement"));
const RulesContactsManagement = lazy(() => import("./components/RulesContactsManagement"));
const AboutManagement = lazy(() => import("./components/AboutManagement"));
const CoordinatorsManagement = lazy(() => import("./components/CoordinatorsManagement"));
const PaymentSettings = lazy(() => import("./components/PaymentSettings"));
const FAQManagement = lazy(() => import("./components/FAQManagement"));
const AdminsManagement = lazy(() => import("./components/AdminsManagement"));
const RevenueDashboard = lazy(() => import("./components/RevenueDashboard"));
const ActivityLogsManagement = lazy(() => import("./components/ActivityLogsManagement"));
const BackupResetManagement = lazy(() => import("./components/BackupResetManagement"));
const FormsManagement = lazy(() => import("./components/FormsManagement"));
const StaffChat = lazy(() => import("./components/StaffChat"));
const StaffDirectory = lazy(() => import("./components/StaffDirectory"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0d]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Loading module...</span>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Persistence of Admin Session and Firebase Auth synchronization
  useEffect(() => {
    // 1. Instantly load cached session for zero-flicker loading
    const cachedSession = !isFirebaseConfigured ? localStorage.getItem("chakravyuh_admin_session") : null;
    if (cachedSession) {
      try {
        setUser(JSON.parse(cachedSession));
      } catch (err) {
        console.error("Failed to parse cached session:", err);
      }
    }

    if (!isFirebaseConfigured || !auth || !db) {
      setIsInitializing(false);
      return;
    }

    // 2. Synchronize with real Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setAuthError(null);
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          let adminUser: AdminUser;

          if (docSnap.exists()) {
            const data = docSnap.data();
            adminUser = mapFirestoreUserProfile(
              firebaseUser.uid,
              firebaseUser.email || "",
              firebaseUser.displayName || "",
              data as Record<string, unknown>
            );
          } else {
            // Check pre-provisioning by email
            const usersColl = collection(db, "users");
            const q = query(usersColl, where("email", "==", firebaseUser.email));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
              const preProvDoc = querySnap.docs[0];
              const preProvData = preProvDoc.data();
              adminUser = mapFirestoreUserProfile(
                firebaseUser.uid,
                firebaseUser.email || "",
                preProvData.displayName || firebaseUser.displayName || "",
                preProvData as Record<string, unknown>
              );
              // Write new UID-keyed document
              await setDoc(doc(db, "users", firebaseUser.uid), adminUser);
              // Clean up email-keyed document if different
              if (preProvDoc.id !== firebaseUser.uid) {
                await deleteDoc(doc(db, "users", preProvDoc.id));
              }
            } else {
              // Check if database is empty to bootstrap first Super Admin
              const allUsersSnap = await getDocs(collection(db, "users"));
              if (allUsersSnap.empty) {
                adminUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: firebaseUser.displayName || "Chief Super Admin",
                  role: "super_admin",
                  assignedSports: [],
                  createdAt: new Date().toISOString(),
                };
                await setDoc(doc(db, "users", firebaseUser.uid), adminUser);
              } else {
                // Auto-create pending coordinator request
                adminUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0].toUpperCase() || "New Coordinator",
                  role: "pending",
                  assignedSports: [],
                  createdAt: new Date().toISOString(),
                };
                await setDoc(doc(db, "users", firebaseUser.uid), adminUser);
                await signOut(auth);
                setUser(null);
                localStorage.removeItem("chakravyuh_admin_session");
                setAuthError("Your account has been registered! Access request is pending approval from the Super Admin.");
                setIsInitializing(false);
                return;
              }
            }
          }

          if (adminUser.suspended) {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem("chakravyuh_admin_session");
            setAuthError("Your account has been suspended. Contact the Super Admin.");
            setIsInitializing(false);
            return;
          }

          if (adminUser.role === "pending") {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem("chakravyuh_admin_session");
            setAuthError("Your coordinator request is pending approval from the Super Admin.");
          } else {
            const categoriesSnapshot = await getDocs(collection(db, "categories"));
            if (!categoriesSnapshot.empty) {
              localStorage.setItem(
                "chakravyuh_2k26_categories",
                JSON.stringify(categoriesSnapshot.docs.map(category => ({ id: category.id, ...category.data() })))
              );
            }
            setUser(adminUser);
            localStorage.setItem("chakravyuh_admin_session", JSON.stringify(adminUser));
          }
        } catch (err: any) {
          console.error("Failed to retrieve or sync user profile from Firestore:", err);
          setAuthError(err.message || "Failed to retrieve user profile from database.");
          setUser(null);
          localStorage.removeItem("chakravyuh_admin_session");
          await signOut(auth);
        }
      } else {
        // Firebase user signed out
        setUser(null);
        localStorage.removeItem("chakravyuh_admin_session");
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (loggedInUser: AdminUser) => {
    setUser(loggedInUser);
    localStorage.setItem("chakravyuh_admin_session", JSON.stringify(loggedInUser));
    setActiveTab("dashboard");
    navigate("/admin/desk");
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Firebase logout error:", err);
      }
    }
    setUser(null);
    localStorage.removeItem("chakravyuh_admin_session");
    navigate("/"); // Return to public site on logout
  };

  const handleUpdateUser = async (updatedUser: AdminUser) => {
    setUser(updatedUser);
    localStorage.setItem("chakravyuh_admin_session", JSON.stringify(updatedUser));
    
    if (isFirebaseConfigured && db && auth?.currentUser) {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, {
          displayName: updatedUser.displayName,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to update user profile in Firestore:", err);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
            Securing Connection Tunnel...
          </span>
        </div>
      </div>
    );
  }

  // Render active admin tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview user={user!} onNavigate={(tabId) => setActiveTab(tabId)} onUpdateUser={handleUpdateUser} />;
      case "chat":
        return <StaffChat currentUser={user!} onUpdateUser={handleUpdateUser} />;
      case "staff_directory":
        if (user!.role !== "super_admin") return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <StaffDirectory actor={user!} />;
      case "events":
        if (!canAccessTab(user!, "events")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <EventsManagement />;
      case "coordinators":
        if (!canAccessTab(user!, "coordinators")) return <div className="text-xs text-red-500 font-mono">Access Locked.</div>;
        return <CoordinatorsManagement currentUser={user!} />;
      case "admins":
        if (!canAccessTab(user!, "admins")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <AdminsManagement actor={user!} />;
      case "registrations":
        return <RegistrationsManagement user={user!} />;
      case "schedules":
        if (!canAccessTab(user!, "schedules")) return <div className="text-xs text-red-500 font-mono">Access Locked.</div>;
        return <SchedulesManagement user={user!} />;
      case "notifications":
        if (!canAccessTab(user!, "notifications")) return <div className="text-xs text-red-500 font-mono">Access Locked.</div>;
        return <NotificationsManagement />;
      case "gallery":
        if (!canAccessTab(user!, "gallery")) return <div className="text-xs text-red-500 font-mono">Access Locked.</div>;
        return <GalleryManagement />;
      case "rules_contacts":
        if (!canAccessTab(user!, "rules_contacts")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <RulesContactsManagement />;
      case "about":
        if (!canAccessTab(user!, "about")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <AboutManagement />;
      case "payment_settings":
        if (!canAccessTab(user!, "payment_settings")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <PaymentSettings />;
      case "custom_forms":
        if (!canAccessTab(user!, "custom_forms")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <FormsManagement />;
      case "faq_management":
        if (!canAccessTab(user!, "faq_management")) return <div className="text-xs text-red-500 font-mono">Access Locked.</div>;
        return <FAQManagement />;
      case "revenue":
        if (!canAccessTab(user!, "revenue")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <RevenueDashboard />;
      case "activity_logs":
        if (!canAccessTab(user!, "activity_logs")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <ActivityLogsManagement />;
      case "backup_reset":
        if (!canAccessTab(user!, "backup_reset")) return <div className="text-xs text-red-500 font-mono">Access Locked. Super Admin credentials needed.</div>;
        return <BackupResetManagement actor={user!} />;
      default:
        return <DashboardOverview user={user!} onNavigate={(tabId) => setActiveTab(tabId)} onUpdateUser={handleUpdateUser} />;
    }
  };

  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* ── PUBLIC ROUTES ── */}
        <Route path="/" element={<PublicWebsite />} />

        {/* ── ADMIN ROUTES (hidden from public, URL-only access) ── */}
        <Route
          path="/admin"
          element={
            user
              ? <Navigate to="/admin/desk" replace />
              : <AuthScreen
                  onLoginSuccess={handleLoginSuccess}
                  onBackToPublic={() => navigate("/")}
                  externalError={authError}
                  clearExternalError={() => setAuthError(null)}
                />
          }
        />
        <Route
          path="/admin/desk"
          element={
            user
              ? (
                <AdminLayout
                  user={user}
                  onLogout={handleLogout}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onGoToPublic={() => navigate("/")}
                >
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderTabContent()}
                  </div>
                </AdminLayout>
              )
              : <Navigate to="/admin" replace />
          }
        />

        {/* Catch-all → public home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
