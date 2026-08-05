import { AdminScope, AdminUser, SportEvent } from "../types";

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
  | "custom_forms";

const TAB_ROLES: Record<AdminTabId, UserRole[]> = {
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
  custom_forms: ["super_admin"],
};

type UserRole = AdminUser["role"];

export function resolveAdminScope(user: AdminUser): AdminScope {
  if (user.role !== "admin") return "all";
  return user.scope ?? "all";
}

export function canAccessTab(user: AdminUser, tabId: string): boolean {
  const roles = TAB_ROLES[tabId as AdminTabId];
  if (!roles) return false;
  return roles.includes(user.role);
}

export function filterEventsByUserScope(user: AdminUser, events: SportEvent[]): SportEvent[] {
  if (user.role === "super_admin") return events;
  if (user.role === "coordinator") {
    return events.filter((e) => user.assignedSports.includes(e.id));
  }
  if (user.role === "admin") {
    const scope = resolveAdminScope(user);
    if (scope === "all") return events;
    return events.filter((e) => e.type === scope);
  }
  return [];
}

/** Event IDs used to filter registration queries. undefined = no filter (all events). */
export function getRegistrationEventFilter(
  user: AdminUser,
  events: SportEvent[]
): string[] | undefined {
  if (user.role === "super_admin") return undefined;
  if (user.role === "coordinator") return user.assignedSports;
  if (user.role === "admin") {
    return filterEventsByUserScope(user, events).map((e) => e.id);
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
  const scopeIds = new Set(eventIdsInScope(actor, events));
  const assigned = coordinator.assignedSports || [];
  if (assigned.length === 0) return false;
  return assigned.every((id) => scopeIds.has(id));
}

export function canAssignSportToCoordinator(actor: AdminUser, event: SportEvent): boolean {
  if (actor.role === "super_admin") return true;
  if (actor.role !== "admin") return false;
  const scope = resolveAdminScope(actor);
  if (scope === "all") return true;
  return event.type === scope;
}

export function canVerifyPayments(user: AdminUser): boolean {
  return user.role === "super_admin";
}

export function canManageSchedulesFully(user: AdminUser): boolean {
  return user.role === "super_admin" || user.role === "admin";
}

export function canManageAnnouncements(user: AdminUser): boolean {
  return user.role === "super_admin" || user.role === "admin";
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
  };
}

export function roleDisplayLabel(user: AdminUser): string {
  if (user.role === "super_admin") return "SUPER ADMIN";
  if (user.role === "admin") {
    const scope = resolveAdminScope(user);
    if (scope === "individual") return "ADMIN · INDIVIDUAL";
    if (scope === "team") return "ADMIN · TEAM";
    return "ADMIN · GENERAL";
  }
  if (user.role === "coordinator") return "COORDINATOR";
  return "PENDING";
}
