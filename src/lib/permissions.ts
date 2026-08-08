import { AdminScope, AdminUser, SportEvent, CustomCategory } from "../types";

export type AdminTabId =
  | "dashboard"
  | "events"
  | "coordinators"
  | "admins"
  | "registrations"
  | "schedules"
  | "notifications"
  | "gallery"
  | "about"
  | "rules_contacts"
  | "payment_settings"
  | "faq_management"
  | "revenue"
  | "activity_logs"
  | "backup_reset"
  | "chat";

const TAB_ROLES: Record<AdminTabId, string[]> = {
  dashboard: ["super_admin", "admin", "coordinator"],
  events: ["super_admin"],
  coordinators: ["super_admin", "admin"],
  admins: ["super_admin"],
  registrations: ["super_admin", "admin", "coordinator"],
  schedules: ["super_admin", "admin", "coordinator"],
  notifications: ["super_admin", "admin", "coordinator"],
  gallery: ["super_admin", "admin"],
  about: ["super_admin"],
  rules_contacts: ["super_admin"],
  payment_settings: ["super_admin"],
  faq_management: ["super_admin", "admin"],
  revenue: ["super_admin"],
  activity_logs: ["super_admin"],
  backup_reset: ["super_admin"],
  chat: ["super_admin", "admin", "coordinator"]
};

export function getLoadedCategories(): CustomCategory[] {
  try {
    const data = localStorage.getItem("chakravyuh_2k26_categories") || localStorage.getItem("categories");
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse categories from localStorage", e);
  }
  // Default pre-seeded categories if localStorage is empty
  return [
    { id: "general", name: "General", allowedTabs: ["dashboard", "coordinators", "registrations", "schedules", "notifications", "gallery", "faq_management"] },
    { id: "sports", name: "Sports", allowedTabs: ["dashboard", "coordinators", "registrations", "schedules", "notifications", "gallery"] },
    { id: "discipline", name: "Discipline", allowedTabs: ["dashboard", "rules_contacts", "notifications", "faq_management"] },
    { id: "food", name: "Food", allowedTabs: ["dashboard", "notifications", "faq_management"] },
    { id: "medical", name: "Medical", allowedTabs: ["dashboard", "notifications", "faq_management"] },
    { id: "logistics", name: "Logistics", allowedTabs: ["dashboard", "schedules", "faq_management"] },
    { id: "media", name: "Media", allowedTabs: ["dashboard", "gallery", "notifications"] },
    { id: "technical", name: "Technical", allowedTabs: ["dashboard", "schedules", "faq_management", "events", "gallery", "custom_forms"] }
  ];
}

export function resolveAdminScope(user: AdminUser): AdminScope {
  if (user.role !== "admin") return "all";
  return user.scope ?? "all";
}

export function canAccessTab(user: AdminUser, tabId: string): boolean {
  if (user.role === "super_admin") return true;
  if (user.role === "pending") return false;
  
  if (user.role === "coordinator") {
    // Coordinators can access dashboard, registrations, schedules, notices, and chat
    return ["dashboard", "registrations", "schedules", "notifications", "chat"].includes(tabId);
  }

  if (user.role === "admin") {
    if (tabId === "chat" || tabId === "dashboard") return true;
    const categoryName = user.adminCategory || "General";
    const categories = getLoadedCategories();
    const foundCategory = categories.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase() || c.id.toLowerCase() === categoryName.toLowerCase()
    );
    if (foundCategory) {
      return foundCategory.allowedTabs.includes(tabId);
    }
    // Backward compatibility fallback for legacy admins
    return ["dashboard", "coordinators", "registrations", "schedules", "notifications", "gallery", "faq_management"].includes(tabId);
  }

  return false;
}

export function filterEventsByUserScope(user: AdminUser, events: SportEvent[]): SportEvent[] {
  if (user.role === "super_admin") return events;
  if (user.role === "coordinator") {
    const assigned = user.assignedSports || [];
    return events.filter((e) => assigned.includes(e.id));
  }
  if (user.role === "admin") {
    const category = (user.adminCategory || "General").toLowerCase();
    if (category === "sports") {
      const assigned = user.assignedSports || [];
      if (assigned.length === 0) return events;
      return events.filter((e) => assigned.includes(e.id));
    }
    return events;
  }
  return [];
}

export function getRegistrationEventFilter(
  user: AdminUser,
  events: SportEvent[]
): string[] | undefined {
  if (user.role === "super_admin") return undefined;
  if (user.role === "coordinator") return user.assignedSports;
  if (user.role === "admin") {
    const category = (user.adminCategory || "General").toLowerCase();
    if (category === "sports") {
      const assigned = user.assignedSports || [];
      if (assigned.length === 0) return undefined;
      return assigned;
    }
    return undefined; // no event filter (can see all)
  }
  return [];
}

export function eventIdsInScope(user: AdminUser, events: SportEvent[]): string[] {
  return filterEventsByUserScope(user, events).map((e) => e.id);
}

export function coordinatorManagedByUser(
  actor: AdminUser,
  coordinator: AdminUser,
  events: SportEvent[]
): boolean {
  if (coordinator.role !== "coordinator") return false;
  if (actor.role === "super_admin") return true;
  if (actor.role !== "admin") return false;
  
  const category = (actor.adminCategory || "General").toLowerCase();
  if (category !== "general" && category !== "sports") return false;
  if (category === "general") return true;

  const adminSports = actor.assignedSports || [];
  if (adminSports.length === 0) return true; // Full access fallback

  const assigned = coordinator.assignedSports || [];
  if (assigned.length === 0) return false;
  return assigned.every((id) => adminSports.includes(id));
}

export function canAssignSportToCoordinator(actor: AdminUser, event: SportEvent): boolean {
  if (actor.role === "super_admin") return true;
  if (actor.role !== "admin") return false;
  
  const category = (actor.adminCategory || "General").toLowerCase();
  if (category === "general") return true;
  if (category === "sports") {
    const adminSports = actor.assignedSports || [];
    if (adminSports.length === 0) return true;
    return adminSports.includes(event.id);
  }
  return false;
}

export function canVerifyPayments(user: AdminUser): boolean {
  if (user.role === "super_admin") return true;
  if (user.role === "admin") {
    const category = (user.adminCategory || "General").toLowerCase();
    return category === "general" || category === "sports";
  }
  return false;
}

export function canManageSchedulesFully(user: AdminUser): boolean {
  if (user.role === "super_admin") return true;
  if (user.role === "admin") {
    const category = (user.adminCategory || "General").toLowerCase();
    return category === "general" || category === "technical" || category === "sports";
  }
  return false;
}

export function canManageAnnouncements(user: AdminUser): boolean {
  if (user.role === "super_admin") return true;
  if (user.role === "admin") {
    const category = (user.adminCategory || "General").toLowerCase();
    return category === "general" || category === "discipline" || category === "sports";
  }
  return false;
}

export function parseUserRole(raw: unknown): AdminUser["role"] {
  if (raw === "super_admin") return "super_admin";
  if (raw === "admin") return "admin";
  if (raw === "coordinator") return "coordinator";
  return "pending";
}

export function parseAdminScope(raw: unknown): AdminScope | undefined {
  if (raw === "individual" || raw === "team" || raw === "all") return raw;
  return undefined;
}

export function mapFirestoreUserProfile(
  uid: string,
  email: string,
  displayName: string,
  data: Record<string, unknown>
): AdminUser {
  const role = parseUserRole(data.role);
  return {
    uid,
    email,
    displayName: (data.displayName as string) || displayName || "Admin User",
    role,
    assignedSports: Array.isArray(data.assignedSports) ? (data.assignedSports as string[]) : [],
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    scope: role === "admin" ? parseAdminScope(data.scope) ?? "all" : parseAdminScope(data.scope),
    suspended: data.suspended === true,
    adminCategory: data.adminCategory ? String(data.adminCategory) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    rollNo: data.rollNo ? String(data.rollNo) : undefined,
    branch: data.branch ? String(data.branch) : undefined,
    residency: (data.residency === "hosteler" || data.residency === "day_scholar") ? data.residency : undefined,
    roomNo: data.roomNo ? String(data.roomNo) : undefined,
  };
}

export function roleDisplayLabel(user: AdminUser): string {
  if (user.role === "super_admin") return "SUPER ADMIN";
  if (user.role === "admin") {
    const category = user.adminCategory || "General";
    return `ADMIN · ${category.toUpperCase()}`;
  }
  if (user.role === "coordinator") return "COORDINATOR";
  return "PENDING";
}
