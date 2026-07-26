export type UserRole = 'super_admin' | 'admin' | 'coordinator' | 'pending';

/** Scope for middle-tier admins; optional on existing profiles (defaults to all). */
export type AdminScope = 'individual' | 'team' | 'all';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  assignedSports: string[]; // Event IDs they are authorized to manage
  createdAt: string;
  /** Middle-tier admin only; omitted on legacy users → treated as "all". */
  scope?: AdminScope;
  /** When true, login is blocked until cleared by Super Admin. */
  suspended?: boolean;
}

export type ActivityAction =
  | 'registration_status_changed'
  | 'registration_deleted'
  | 'payment_verified'
  | 'schedule_updated'
  | 'schedule_deleted'
  | 'announcement_created'
  | 'announcement_deleted'
  | 'user_created'
  | 'user_updated'
  | 'user_suspended'
  | 'user_deleted'
  | 'backup_exported'
  | 'season_archived';

export interface ActivityLogEntry {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: ActivityAction;
  targetType: string;
  targetId?: string;
  summary: string;
  metadata?: Record<string, string>;
  timestamp: string;
}

export interface RevenueAnalytics {
  registrationFee: number;
  paymentEnabled: boolean;
  totalCollectedEstimate: number;
  verifiedPaymentsCount: number;
  submittedPendingCount: number;
  rejectedPaymentsCount: number;
  byEvent: { eventId: string; eventTitle: string; sportType: 'individual' | 'team'; verifiedCount: number; estimatedRevenue: number }[];
  bySportType: { individual: number; team: number };
  updatedAt: string;
}

export interface SportCoordinator {
  name: string;
  phone: string;
  email: string;
}

export interface SportEvent {
  id: string;
  title: string;
  category: string; // e.g., 'Outdoor', 'Indoor', 'Athletics'
  type: 'individual' | 'team';
  minTeamSize: number;
  maxTeamSize: number;
  rules: string;
  venue: string;
  coordinators: SportCoordinator[];
  image: string;
  registrationDeadline: string;
  registrationCount?: number;
  maxRegistrations: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  name: string;
  email: string;
  phone: string;
  rollNo: string;
  college: string;
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  sportType: 'individual' | 'team';
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
  updatedAt: string;
  // Lead / Individual details
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadCollege: string;
  leadRollNo: string;
  leadBranch: string;
  leadYear: string;
  // Team details if applicable
  teamName?: string;
  members?: TeamMember[];
  duplicateCheckHash: string; // eventId_leadRollNo to prevent double entries
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  isOutstation?: boolean;
  travelMode?: string; // e.g. "By Train", "By Bus", "By Car/Bike", "By Flight", "Other"
  // Payment fields
  paymentStatus?: 'pending_payment' | 'payment_submitted' | 'payment_verified' | 'payment_rejected' | 'ims_student';
  utrNumber?: string;        // Transaction ID / UTR submitted by user
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  paymentRemarks?: string;   // Admin remarks on payment
  trackingCode: string;
  checkedIn?: boolean;
  checkedInAt?: string;
}

export interface PublicRegistrationStatus {
  trackingCode: string;
  eventTitle: string;
  sportType: 'individual' | 'team';
  teamName?: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
  checkedIn: boolean;
}

export interface PaymentConfig {
  enabled: boolean;          // Toggle: payment required or not
  upiId: string;             // e.g. 9876543210@ybl
  qrImageUrl: string;        // URL of uploaded QR image
  registrationFee: number;   // Amount in INR
  payeeName: string;         // Name shown on QR screen
  instructions: string;      // Custom instructions for students
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  q: string;
  a: string;
  order: number;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  category: string; // e.g., 'Action', 'Ceremony', 'Winners'
  uploadedBy: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'alert' | 'info';
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface AboutStaff {
  id: string;
  name: string;
  designation: string;
  photoUrl: string;
  quote: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralRule {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  day: number; // e.g., 1, 2, 3
  date: string;
  title: string;
  timeSlot: string; // e.g., "10:00 AM - 12:00 PM"
  venue: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  order: number;
  imageUrl?: string;
}

export interface LeadershipProfile {
  id: string;
  title: string;
  name: string;
  photoUrl: string;
  quote: string;
}

export interface AboutSection {
  id: string;

  collegeName: string;
  logoUrl: string;

  description: string;

  establishedYear: string;
  location: string;
  affiliation: string;

  vision: string;
  mission: string[];

  sportsQuote: string;

  profiles?: LeadershipProfile[];

  chairmanName?: string;
  chairmanPhoto?: string;

  directorName?: string;
  directorPhoto?: string;

  sportsOfficerName?: string;
  sportsOfficerPhoto?: string;

  updatedAt: string;
}
