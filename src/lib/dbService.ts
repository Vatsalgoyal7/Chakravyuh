import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query, 
  where,
  orderBy 
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { 
  SportEvent, 
  Registration, 
  GalleryItem, 
  Announcement, 
  Contact, 
  GeneralRule, 
  ScheduleItem,
  AdminUser,
  AboutStaff,
  AboutSection,
  PublicRegistrationStatus
} from "../types";

// Safe UUID generator - works on both HTTP and HTTPS (crypto.randomUUID only works on HTTPS)
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Manual fallback for HTTP / older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Fallback initial data loaded directly from the blueprint structure
export const DEFAULT_EVENTS: SportEvent[] = [
  {
    id: "cricket_2026",
    title: "Cricket",
    category: "Outdoor",
    type: "team",
    minTeamSize: 11,
    maxTeamSize: 15,
    rules: "Standard ICC T20 Rules.",
    venue: "IMSEC Main Ground",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image:  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 32,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "volleyball_2026",
    title: "Volleyball",
    category: "Outdoor",
    type: "team",
    minTeamSize: 6,
    maxTeamSize: 12,
    rules: "Standard FIVB Volleyball Rules.",
    venue: "IMSEC Volleyball Court",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 24,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "basketball_2026",
    title: "Basketball",
    category: "Outdoor",
    type: "team",
    minTeamSize: 5,
    maxTeamSize: 10,
    rules: "Standard FIBA Basketball Rules.",
    venue: "IMSEC Basketball Court",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 16,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "football_2026",
    title: "Football",
    category: "Outdoor",
    type: "team",
    minTeamSize: 11,
    maxTeamSize: 16,
    rules: "Standard FIFA Football Rules.",
    venue: "IMSEC Football Ground",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 16,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "power_lifting_2026",
    title: "Power Lifting",
    category: "Indoor",
    type: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    rules: "Standard IPF Power Lifting Rules.",
    venue: "IMSEC Indoor Sports Hall",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 50,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "badminton_2026",
    title: "Badminton",
    category: "Indoor",
    type: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    rules: "Standard BWF Badminton Rules.",
    venue: "IMSEC Indoor Badminton Court",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 64,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "table_tennis_2026",
    title: "Table Tennis",
    category: "Indoor",
    type: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    rules: "Standard ITTF Table Tennis Rules.",
    venue: "IMSEC Indoor Sports Hall",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 64,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "race_100m_2026",
    title: "100m Race",
    category: "Outdoor",
    type: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    rules: "Standard Athletics Federation Rules.",
    venue: "IMSEC Athletics Track",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 100,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

    {
    id: "carrom_2026",
    title: "Carrom",
    category: "Indoor",
    type: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    rules: "Standard All India Carrom Federation Rules.",
    venue: "IMSEC Indoor Games Hall",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 64,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "chess_2026",
    title: "Chess",
    category: "Indoor",
    type: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    rules: "Standard FIDE Chess Rules.",
    venue: "IMSEC Seminar Hall",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 64,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "tug_of_war_2026",
    title: "Tug of War",
    category: "Outdoor",
    type: "team",
    minTeamSize: 8,
    maxTeamSize: 10,
    rules: "Standard Tug of War Federation Rules.",
    venue: "IMSEC Main Ground",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 16,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },

  {
    id: "shot_put_2026",
    title: "Shot Put",
    category: "Outdoor",
    type: "individual",
    minTeamSize: 1,
    maxTeamSize: 1,
    rules: "Standard Athletics Federation Rules.",
    venue: "IMSEC Athletics Ground",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 50,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  },


    {
    id: "kabaddi_2026",
    title: "Kabaddi",
    category: "Outdoor",
    type: "team",
    minTeamSize: 7,
    maxTeamSize: 12,
    rules: "Standard Amateur Kabaddi Federation of India (AKFI) Rules.",
    venue: "IMSEC Main Ground",
    coordinators: [
      {
        name: "Coordinator",
        phone: "",
        email: ""
      }
    ],
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200",
    registrationDeadline: "2026-10-05T23:59:59Z",
    registrationCount: 0,
    maxRegistrations: 16,
    isActive: true,
    createdAt: "2026-07-16T00:00:00Z",
    updatedAt: "2026-07-16T00:00:00Z"
  }
];


const DEFAULT_REGISTRATIONS: Registration[] = [
  {
    id: "reg_cricket_team_abc",
    eventId: "cricket_2026",
    eventTitle: "Chakravyuh Cricket League",
    sportType: "team",
    status: "pending",
    registeredAt: "2026-07-15T01:00:00Z",
    updatedAt: "2026-07-15T01:00:00Z",
    leadName: "Rajesh Kumar",
    leadEmail: "rajesh.kumar@gmail.com",
    leadPhone: "9898989898",
    leadCollege: "IMSEC Engineering College",
    leadRollNo: "2301430100055",
    leadBranch: "CSE",
    leadYear: "3rd Year",
    teamName: "IMSEC Avengers",
    members: [
      {
        name: "Suresh Raina",
        email: "suresh@gmail.com",
        phone: "9123456789",
        rollNo: "2301430100060",
        college: "IMSEC Engineering College"
      }
    ],
    duplicateCheckHash: "cricket_2026_2301430100055",
    remarks: "",
    trackingCode: "CHK-DEMO-2026"
  }
];

const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: "gallery_img_01",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    caption: "Inauguration Ceremony Chakravyuh 2K25",
    category: "Inauguration",
    uploadedBy: "super_admin",
    createdAt: "2026-07-15T00:00:00Z"
  }
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "notif_01",
    title: "Registrations Open!",
    message: "Registrations for Chakravyuh 2K26 are now live. Register your team before the October 15th deadline.",
    type: "urgent",
    isActive: true,
    createdAt: "2026-07-15T00:00:00Z",
    expiresAt: "2026-10-30T00:00:00Z"
  }
];

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "contact_01",
    name: "Dr. Manoj Kumar Singh",
    designation: "Director of Physical Education & Sports",
    phone: "9415123456",
    email: "sports.director@imsec.ac.in",
    order: 1
  }
];

const DEFAULT_RULES: GeneralRule[] = [
  {
    id: "rule_01",
    title: "General Code of Conduct",
    content: "1. All players must bring their valid college ID cards.\n2. Indiscipline or misbehavior on the ground will lead to immediate team disqualification.\n3. The decision of the chief referee will be final and binding.\n4. Outstation teams must pre-arrange accommodation details with coordinators.",
    updatedAt: "2026-07-15T00:00:00Z"
  }
];

const DEFAULT_SCHEDULES: ScheduleItem[] = [
  {
    id: "sched_match_01",
    day: 1,
    date: "2026-11-01T00:00:00Z",
    title: "Cricket Match - IMSEC vs ABES",
    timeSlot: "10:00 AM - 01:00 PM",
    venue: "IMSEC Main Ground",
    status: "scheduled",
    updatedAt: "2026-07-15T00:00:00Z"
  }
];

export const DEFAULT_USERS: AdminUser[] = [
  {
    uid: "mock_super_admin",
    email: "superadmin@imsec.ac.in",
    displayName: "Vatsal Goyal (Super Admin)",
    role: "super_admin",
    assignedSports: [],
    createdAt: "2026-07-15T00:00:00Z"
  },
  {
    uid: "mock_coord_cricket",
    email: "cricket.coord@imsec.ac.in",
    displayName: "Prof. Amit Sharma",
    role: "coordinator",
    assignedSports: ["cricket_2026"],
    createdAt: "2026-07-15T00:00:00Z"
  }
];


const DEFAULT_ABOUT: AboutSection = {
  id: "about",

  collegeName: "IMS Engineering College",
  logoUrl: "/imsec-logo.svg",

  description:
    "IMS Engineering College (IMSEC), Ghaziabad, established in 2002, is committed to providing quality technical and management education through innovative teaching, research, discipline and holistic student development. Ranked among the top private engineering colleges in North India, the institution focuses on nurturing technically skilled, innovative, ethical and globally competent professionals.",

  establishedYear: "2002",
  location: "Ghaziabad, Uttar Pradesh",
  affiliation: "Affiliated to Dr. A.P.J. Abdul Kalam Technical University (AKTU)",

  vision:
    "To make IMSEC an Institution of Excellence for empowering students through technical education, incorporating human values, and developing engineering acumen for innovations and leadership skills to upgrade society.",

  mission: [
    "To promote academic excellence by continuous learning in core and emerging engineering domains using innovative teaching and learning methodologies.",
    "To inculcate values and ethics among the learners.",
    "To promote industry interactions and cultivate young minds for entrepreneurship.",
    "To create a conducive learning ecosystem and research environment on a perpetual basis to develop students as technology leaders and entrepreneurs who can address tomorrow's societal needs."
  ],

  sportsQuote: "Champions keep playing until they get it right.",

  profiles: [
    { id: "1", title: "Chairman", name: "Chairman", photoUrl: "", quote: "" },
    { id: "2", title: "Director", name: "Director", photoUrl: "", quote: "" },
    { id: "3", title: "Sports Officer", name: "Mr. Uday Singhta", photoUrl: "", quote: "" }
  ],

  chairmanName: "Chairman",
  chairmanPhoto: "",

  directorName: "Director",
  directorPhoto: "",

  sportsOfficerName: "Mr. Uday Singhta",
  sportsOfficerPhoto: "",

  updatedAt: new Date().toISOString()
};

// LocalStorage helpers
function getLocal<T>(key: string, defaults: T[]): T[] {
  const data = localStorage.getItem(`chakravyuh_2k26_${key}`);
  if (!data) {
    localStorage.setItem(`chakravyuh_2k26_${key}`, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(data);
}

function setLocal<T>(key: string, data: T[]) {
  localStorage.setItem(`chakravyuh_2k26_${key}`, JSON.stringify(data));
}

export const dbService = {
  // 1. EVENTS MANAGEMENT

  async getEvents(): Promise<SportEvent[]> {
    const sanitizeEventKeys = (event: any): SportEvent => {
      const sanitized: any = {};
      for (const key of Object.keys(event)) {
        sanitized[key.trim()] = event[key];
      }
      // Normalize 'type'
      if (sanitized.type) {
        sanitized.type = sanitized.type.trim();
      }
      if (!sanitized.type) {
        sanitized.type = sanitized.maxTeamSize > 1 ? 'team' : 'individual';
      }
      // Normalize 'category'
      if (sanitized.category) {
        sanitized.category = sanitized.category.trim();
      }
      if (!sanitized.minTeamSize) {
        sanitized.minTeamSize = sanitized.type === 'individual' ? 1 : 2;
      }
      if (!sanitized.maxTeamSize) {
        sanitized.maxTeamSize = sanitized.type === 'individual' ? 1 : 15;
      }
      return sanitized as SportEvent;
    };

    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, "events"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => sanitizeEventKeys({
          id: doc.id,
          ...doc.data()
        }));

      } catch (err) {
        console.error(
          "Firestore getEvents failed, reading local storage:",
          err
        );
      }
    }

    const localEvents = getLocal<SportEvent>("events", DEFAULT_EVENTS);
    return localEvents.map(e => sanitizeEventKeys(e));
  },

  async saveEvent(
    event: Omit<SportEvent, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
      createdAt?: string;
    }
  ): Promise<SportEvent> {
    const timestamp = new Date().toISOString();
    const id = event.id || `event_${Date.now()}`;

    // Clean keys of event payload
    const cleanedEvent: any = {};
    for (const key of Object.keys(event)) {
      cleanedEvent[key.trim()] = (event as any)[key];
    }

    const fullEvent: SportEvent = {
      ...cleanedEvent,
      id,
      registrationCount: event.registrationCount || 0,
      createdAt: event.createdAt || timestamp,
      updatedAt: timestamp,
    };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "events", id), fullEvent);
        return fullEvent;
      } catch (err) {
        console.error(
          "Firestore saveEvent failed, writing to local storage:",
          err
        );
      }
    }

    const local = getLocal<SportEvent>("events", DEFAULT_EVENTS);

    const existingIndex = local.findIndex(e => e.id === id);

    if (existingIndex > -1) {
      local[existingIndex] = {
        ...local[existingIndex],
        ...cleanedEvent,
        updatedAt: timestamp
      };
    } else {
      local.push(fullEvent);
    }

    setLocal("events", local);

    return fullEvent;
  },

  async deleteEvent(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "events", id));
        return;
      } catch (err) {
        console.error(
          "Firestore deleteEvent failed, deleting from local storage:",
          err
        );
      }
    }

    const local = getLocal<SportEvent>("events", DEFAULT_EVENTS);

    setLocal(
      "events",
      local.filter(e => e.id !== id)
    );
  },

  // 2. REGISTRATIONS
  async getRegistrations(eventIds?: string[]): Promise<Registration[]> {
    if (isFirebaseConfigured && db) {
      try {
        if (eventIds && eventIds.length === 0) return [];
        const registrationsQuery = eventIds
          ? query(collection(db, "registrations"), where("eventId", "in", eventIds.slice(0, 30)))
          : collection(db, "registrations");
        const snapshot = await getDocs(registrationsQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
      } catch (err) {
        console.error("Firestore getRegistrations failed:", err);
        throw err;
      }
    }
    return getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS);
  },

  async saveRegistration(reg: Omit<Registration, "id" | "registeredAt" | "updatedAt" | "trackingCode">): Promise<Registration> {
    const timestamp = new Date().toISOString();
    const normalizedRollNumber = reg.leadRollNo.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const id = `reg_${reg.eventId}_${normalizedRollNumber}`;
    const trackingCode = `CHK-${generateUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const fullReg: Registration = {
      ...reg,
      id,
      trackingCode,
      registeredAt: timestamp,
      updatedAt: timestamp,
    };

    // Duplicate prevention validation
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, "registrations", id), fullReg);
        batch.set(doc(db, "registration_status", trackingCode), {
          trackingCode,
          eventId: reg.eventId,
          eventTitle: reg.eventTitle,
          sportType: reg.sportType,
          teamName: reg.teamName || "",
          status: "pending",
          registeredAt: timestamp,
          checkedIn: false
        });
        await batch.commit();
        return fullReg;
      } catch (err) {
        console.error("Firestore saveRegistration failed:", err);
        throw new Error("Registration could not be saved. This roll number may already be registered for the selected event.");
      }
    }

    // Local Storage save
    const local = getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS);
    if (local.some(item => item.duplicateCheckHash === reg.duplicateCheckHash)) {
      throw new Error("Registration already exists for this roll number and sport.");
    }
    local.push(fullReg);
    setLocal("registrations", local);

    // Update count in events locally
    const events = getLocal<SportEvent>("events", DEFAULT_EVENTS);
    const evIndex = events.findIndex(e => e.id === reg.eventId);
    if (evIndex > -1) {
      events[evIndex].registrationCount = (events[evIndex].registrationCount || 0) + 1;
      setLocal("events", events);
    }

    return fullReg;
  },

  async getPublicRegistrationStatus(trackingCode: string): Promise<PublicRegistrationStatus | null> {
    const code = trackingCode.trim().toUpperCase();
    if (isFirebaseConfigured && db) {
      const statusDoc = await getDoc(doc(db, "registration_status", code));
      return statusDoc.exists() ? statusDoc.data() as PublicRegistrationStatus : null;
    }
    const registration = getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS)
      .find(item => item.trackingCode === code || item.id === code);
    return registration ? {
      trackingCode: registration.trackingCode,
      eventTitle: registration.eventTitle,
      sportType: registration.sportType,
      teamName: registration.teamName,
      status: registration.status,
      registeredAt: registration.registeredAt,
      checkedIn: Boolean(registration.checkedIn)
    } : null;
  },

  async updateRegistrationStatus(
    id: string, 
    status: 'pending' | 'approved' | 'rejected', 
    remarks: string = "",
    approvedBy: string = ""
  ): Promise<Registration> {
    const timestamp = new Date().toISOString();

    if (isFirebaseConfigured && db) {
      try {
        const regRef = doc(db, "registrations", id);
        const updateData = { 
          status, 
          remarks, 
          approvedBy, 
          approvedAt: timestamp,
          updatedAt: timestamp 
        };
        const currentDoc = await getDoc(regRef);
        if (!currentDoc.exists()) throw new Error("Registration record not found");
        const currentRegistration = { id: currentDoc.id, ...currentDoc.data() } as Registration;
        const batch = writeBatch(db);
        batch.update(regRef, updateData);
        batch.update(doc(db, "registration_status", currentRegistration.trackingCode), { status });
        await batch.commit();
        const updatedDoc = await getDoc(regRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as Registration;
      } catch (err) {
        console.error("Firestore updateRegistrationStatus failed, updating local storage:", err);
      }
    }

    const local = getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS);
    const index = local.findIndex(r => r.id === id);
    if (index > -1) {
      local[index] = {
        ...local[index],
        status,
        remarks,
        approvedBy,
        approvedAt: timestamp,
        updatedAt: timestamp
      };
      setLocal("registrations", local);
      return local[index];
    }
    throw new Error("Registration record not found");
  },

  async checkInRegistration(id: string): Promise<Registration> {
    const checkedInAt = new Date().toISOString();
    if (isFirebaseConfigured && db) {
      const registrationRef = doc(db, "registrations", id);
      const registrationDoc = await getDoc(registrationRef);
      if (!registrationDoc.exists()) throw new Error("Registration record not found");
      const registration = { id: registrationDoc.id, ...registrationDoc.data() } as Registration;
      const batch = writeBatch(db);
      batch.update(registrationRef, { checkedIn: true, checkedInAt, updatedAt: checkedInAt });
      batch.update(doc(db, "registration_status", registration.trackingCode), { checkedIn: true });
      await batch.commit();
      return { ...registration, checkedIn: true, checkedInAt, updatedAt: checkedInAt };
    }

    const local = getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS);
    const index = local.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Registration record not found");
    local[index] = { ...local[index], checkedIn: true, checkedInAt, updatedAt: checkedInAt };
    setLocal("registrations", local);
    return local[index];
  },

  async deleteRegistration(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const registrationDoc = await getDoc(doc(db, "registrations", id));
        const batch = writeBatch(db);
        batch.delete(doc(db, "registrations", id));
        if (registrationDoc.exists()) {
          const registration = registrationDoc.data() as Registration;
          batch.delete(doc(db, "registration_status", registration.trackingCode));
        }
        await batch.commit();
        return;
      } catch (err) {
        console.error("Firestore deleteRegistration failed, deleting from local storage:", err);
      }
    }
    const local = getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS);
    const reg = local.find(r => r.id === id);
    if (reg) {
      // Decrement event counter
      const events = getLocal<SportEvent>("events", DEFAULT_EVENTS);
      const evIndex = events.findIndex(e => e.id === reg.eventId);
      if (evIndex > -1 && events[evIndex].registrationCount > 0) {
        events[evIndex].registrationCount -= 1;
        setLocal("events", events);
      }
    }
    setLocal("registrations", local.filter(r => r.id !== id));
  },

  // 3. GALLERY
  async getGallery(): Promise<GalleryItem[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, "gallery"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
      } catch (err) {
        console.error("Firestore getGallery failed, reading local storage:", err);
      }
    }
    return getLocal<GalleryItem>("gallery", DEFAULT_GALLERY);
  },

  async saveGalleryItem(item: Omit<GalleryItem, "id" | "createdAt">): Promise<GalleryItem> {
    const timestamp = new Date().toISOString();
    const id = `gal_${Date.now()}`;
    const fullItem: GalleryItem = { ...item, id, createdAt: timestamp };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "gallery", id), fullItem);
        return fullItem;
      } catch (err) {
        console.error("Firestore saveGalleryItem failed, writing to local storage:", err);
      }
    }

    const local = getLocal<GalleryItem>("gallery", DEFAULT_GALLERY);
    local.push(fullItem);
    setLocal("gallery", local);
    return fullItem;
  },

  async deleteGalleryItem(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "gallery", id));
        return;
      } catch (err) {
        console.error("Firestore deleteGalleryItem failed, deleting from local storage:", err);
      }
    }
    const local = getLocal<GalleryItem>("gallery", DEFAULT_GALLERY);
    setLocal("gallery", local.filter(g => g.id !== id));
  },

  // 4. ANNOUNCEMENTS / NOTIFICATIONS
  async getAnnouncements(): Promise<Announcement[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, "notifications"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      } catch (err) {
        console.error("Firestore getAnnouncements failed, reading local storage:", err);
      }
    }
    return getLocal<Announcement>("notifications", DEFAULT_ANNOUNCEMENTS);
  },

  async saveAnnouncement(item: Omit<Announcement, "id" | "createdAt"> & { id?: string }): Promise<Announcement> {
    const timestamp = new Date().toISOString();
    const id = item.id || `notif_${Date.now()}`;
    const fullItem: Announcement = { ...item, id, createdAt: timestamp };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "notifications", id), fullItem);
        return fullItem;
      } catch (err) {
        console.error("Firestore saveAnnouncement failed, writing to local storage:", err);
      }
    }

    const local = getLocal<Announcement>("notifications", DEFAULT_ANNOUNCEMENTS);
    const existingIndex = local.findIndex(n => n.id === id);
    if (existingIndex > -1) {
      local[existingIndex] = fullItem;
    } else {
      local.push(fullItem);
    }
    setLocal("notifications", local);
    return fullItem;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "notifications", id));
        return;
      } catch (err) {
        console.error("Firestore deleteAnnouncement failed, deleting from local storage:", err);
      }
    }
    const local = getLocal<Announcement>("notifications", DEFAULT_ANNOUNCEMENTS);
    setLocal("notifications", local.filter(n => n.id !== id));
  },

  // 5. CONTACTS
  async getContacts(): Promise<Contact[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, "contacts"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
      } catch (err) {
        console.error("Firestore getContacts failed, reading local storage:", err);
      }
    }
    const contacts = getLocal<Contact>("contacts", DEFAULT_CONTACTS);
    return contacts.sort((a, b) => a.order - b.order);
  },

  async saveContact(item: Omit<Contact, "id"> & { id?: string }): Promise<Contact> {
    const id = item.id || `contact_${Date.now()}`;
    const fullItem: Contact = { ...item, id };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "contacts", id), fullItem);
        return fullItem;
      } catch (err) {
        console.error("Firestore saveContact failed, writing to local storage:", err);
      }
    }

    const local = getLocal<Contact>("contacts", DEFAULT_CONTACTS);
    const existingIndex = local.findIndex(c => c.id === id);
    if (existingIndex > -1) {
      local[existingIndex] = fullItem;
    } else {
      local.push(fullItem);
    }
    setLocal("contacts", local);
    return fullItem;
  },

  async deleteContact(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "contacts", id));
        return;
      } catch (err) {
        console.error("Firestore deleteContact failed, deleting from local storage:", err);
      }
    }
    const local = getLocal<Contact>("contacts", DEFAULT_CONTACTS);
    setLocal("contacts", local.filter(c => c.id !== id));
  },

  // 6. RULES GENERAL
  async getGeneralRules(): Promise<GeneralRule[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, "rules_general"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneralRule));
      } catch (err) {
        console.error("Firestore getGeneralRules failed, reading local storage:", err);
      }
    }
    return getLocal<GeneralRule>("rules_general", DEFAULT_RULES);
  },

  async saveGeneralRule(item: Omit<GeneralRule, "id" | "updatedAt"> & { id?: string }): Promise<GeneralRule> {
    const timestamp = new Date().toISOString();
    const id = item.id || `rule_${Date.now()}`;
    const fullItem: GeneralRule = { ...item, id, updatedAt: timestamp };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "rules_general", id), fullItem);
        return fullItem;
      } catch (err) {
        console.error("Firestore saveGeneralRule failed, writing to local storage:", err);
      }
    }

    const local = getLocal<GeneralRule>("rules_general", DEFAULT_RULES);
    const existingIndex = local.findIndex(r => r.id === id);
    if (existingIndex > -1) {
      local[existingIndex] = fullItem;
    } else {
      local.push(fullItem);
    }
    setLocal("rules_general", local);
    return fullItem;
  },

  async deleteGeneralRule(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "rules_general", id));
        return;
      } catch (err) {
        console.error("Firestore deleteGeneralRule failed, deleting from local storage:", err);
      }
    }
    const local = getLocal<GeneralRule>("rules_general", DEFAULT_RULES);
    setLocal("rules_general", local.filter(r => r.id !== id));
  },

  // 7. SCHEDULES
  async getSchedules(): Promise<ScheduleItem[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, "schedules"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
      } catch (err) {
        console.error("Firestore getSchedules failed, reading local storage:", err);
      }
    }
    return getLocal<ScheduleItem>("schedules", DEFAULT_SCHEDULES);
  },

  async saveScheduleItem(item: Omit<ScheduleItem, "id" | "updatedAt"> & { id?: string }): Promise<ScheduleItem> {
    const timestamp = new Date().toISOString();
    const id = item.id || `sched_${Date.now()}`;
    const fullItem: ScheduleItem = { ...item, id, updatedAt: timestamp };

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "schedules", id), fullItem);
        return fullItem;
      } catch (err) {
        console.error("Firestore saveScheduleItem failed, writing to local storage:", err);
      }
    }

    const local = getLocal<ScheduleItem>("schedules", DEFAULT_SCHEDULES);
    const existingIndex = local.findIndex(s => s.id === id);
    if (existingIndex > -1) {
      local[existingIndex] = fullItem;
    } else {
      local.push(fullItem);
    }
    setLocal("schedules", local);
    return fullItem;
  },

  async deleteScheduleItem(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "schedules", id));
        return;
      } catch (err) {
        console.error("Firestore deleteScheduleItem failed, deleting from local storage:", err);
      }
    }
    const local = getLocal<ScheduleItem>("schedules", DEFAULT_SCHEDULES);
    setLocal("schedules", local.filter(s => s.id !== id));
  },

  // 8. ABOUT SECTION
  async getAboutData(): Promise<AboutSection> {
    const migrateAboutData = (data: any): AboutSection => {
      const merged: AboutSection = {
        ...DEFAULT_ABOUT,
        ...data,
        mission: Array.isArray(data?.mission) && data.mission.length > 0
          ? data.mission
          : DEFAULT_ABOUT.mission
      };

      if (!data?.profiles || !Array.isArray(data.profiles)) {
        merged.profiles = [
          { id: "1", title: "Chairman", name: data?.chairmanName || "Chairman", photoUrl: data?.chairmanPhoto || "", quote: "" },
          { id: "2", title: "Director", name: data?.directorName || "Director", photoUrl: data?.directorPhoto || "", quote: "" },
          { id: "3", title: "Sports Officer", name: data?.sportsOfficerName || "Mr. Uday Singhta", photoUrl: data?.sportsOfficerPhoto || "", quote: "" }
        ];
      } else {
        merged.profiles = data.profiles;
      }

      if (!merged.logoUrl) {
        merged.logoUrl = DEFAULT_ABOUT.logoUrl;
      }

      return merged;
    };

    if (isFirebaseConfigured && db) {
      try {
        const aboutRef = doc(db, "settings", "about");
        const snap = await getDoc(aboutRef);

        if (snap.exists()) {
          return migrateAboutData(snap.data());
        }
      } catch (err) {
        console.error("Firestore getAboutData failed:", err);
      }
    }

    const local = localStorage.getItem("chakravyuh_about");

    if (local) {
      return migrateAboutData(JSON.parse(local));
    }

    const initialData = migrateAboutData({ ...DEFAULT_ABOUT });
    localStorage.setItem(
      "chakravyuh_about",
      JSON.stringify(initialData)
    );

    return initialData;
  },

  async saveAboutData(data: AboutSection): Promise<void> {

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(
          doc(db, "settings", "about"),
          data
        );
      } catch (err) {
        console.error("Firestore saveAboutData failed:", err);
      }
    }

    localStorage.setItem(
      "chakravyuh_about",
      JSON.stringify(data)
    );
  },

  // 9. USER/COORDINATOR MANAGEMENT
  async getUsers(): Promise<AdminUser[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AdminUser));
      } catch (err) {
        console.error("Firestore getUsers failed, reading local storage:", err);
      }
    }
    return getLocal<AdminUser>("users", DEFAULT_USERS);
  },

  async saveUser(user: AdminUser): Promise<AdminUser> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "users", user.uid), user);
        return user;
      } catch (err) {
        console.error("Firestore saveUser failed, writing to local storage:", err);
        throw err;
      }
    }
    const local = getLocal<AdminUser>("users", DEFAULT_USERS);
    const existingIndex = local.findIndex(u => u.uid === user.uid);
    if (existingIndex > -1) {
      local[existingIndex] = user;
    } else {
      local.push(user);
    }
    setLocal("users", local);
    return user;
  },

  async deleteUser(uid: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, "users", uid));
        return;
      } catch (err) {
        console.error("Firestore deleteUser failed, deleting from local storage:", err);
        throw err;
      }
    }
    const local = getLocal<AdminUser>("users", DEFAULT_USERS);
    setLocal("users", local.filter(u => u.uid !== uid));
  },

  // ── Homepage Video Settings ──────────────────────────────────────────────
  async getHomepageSettings(): Promise<{ videoUrl: string; videoEnabled: boolean }> {
    const defaults = { videoUrl: "", videoEnabled: false };
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, "settings", "homepage"));
        if (snap.exists()) {
          const data = snap.data();
          return {
            videoUrl: data.videoUrl || "",
            videoEnabled: data.videoEnabled ?? false,
          };
        }
        return defaults;
      } catch (err) {
        console.error("Firestore getHomepageSettings failed:", err);
      }
    }
    const stored = localStorage.getItem("chakravyuh_homepage_settings");
    return stored ? JSON.parse(stored) : defaults;
  },

  async saveHomepageSettings(settings: { videoUrl: string; videoEnabled: boolean }): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "settings", "homepage"), settings, { merge: true });
        return;
      } catch (err) {
        console.error("Firestore saveHomepageSettings failed:", err);
        throw err;
      }
    }
    localStorage.setItem("chakravyuh_homepage_settings", JSON.stringify(settings));
  },
  // ── Payment Configuration (Super Admin) ─────────────────────────────────
  async getPaymentConfig(): Promise<import("../types").PaymentConfig> {
    const defaults: import("../types").PaymentConfig = {
      enabled: false,
      upiId: "",
      qrImageUrl: "",
      registrationFee: 0,
      payeeName: "Chakravyuh 2K26",
      instructions: "Scan the QR code and pay the registration fee. Enter your UTR / Transaction ID below.",
      updatedAt: new Date().toISOString(),
    };
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, "settings", "payment"));
        if (snap.exists()) return { ...defaults, ...snap.data() } as import("../types").PaymentConfig;
        return defaults;
      } catch (err) {
        console.error("Firestore getPaymentConfig failed:", err);
      }
    }
    const stored = localStorage.getItem("chakravyuh_payment_config");
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  },

  async savePaymentConfig(config: import("../types").PaymentConfig): Promise<void> {
    const data = { ...config, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "settings", "payment"), data, { merge: true });
        return;
      } catch (err) {
        console.error("Firestore savePaymentConfig failed:", err);
        throw err;
      }
    }
    localStorage.setItem("chakravyuh_payment_config", JSON.stringify(data));
  },

  // Called by student after scanning QR and paying — submits UTR for admin verification
  async submitPaymentUTR(registrationId: string, utrNumber: string): Promise<Registration> {
    const timestamp = new Date().toISOString();
    const update = {
      paymentStatus: "payment_submitted" as const,
      utrNumber: utrNumber.trim(),
      paymentSubmittedAt: timestamp,
      updatedAt: timestamp,
    };

    if (isFirebaseConfigured && db) {
      try {
        const regRef = doc(db, "registrations", registrationId);
        await updateDoc(regRef, update);
        const updated = await getDoc(regRef);
        return { id: updated.id, ...updated.data() } as Registration;
      } catch (err) {
        console.error("Firestore submitPaymentUTR failed:", err);
        throw err;
      }
    }

    const local = getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS);
    const idx = local.findIndex(r => r.id === registrationId);
    if (idx > -1) {
      local[idx] = { ...local[idx], ...update };
      setLocal("registrations", local);
      return local[idx];
    }
    throw new Error("Registration not found");
  },

  // Called by admin to verify or reject a submitted payment
  async updatePaymentStatus(
    registrationId: string,
    paymentStatus: 'payment_verified' | 'payment_rejected',
    paymentRemarks: string = "",
    verifiedBy: string = ""
  ): Promise<Registration> {
    const timestamp = new Date().toISOString();
    const update = {
      paymentStatus,
      paymentRemarks,
      paymentVerifiedAt: timestamp,
      approvedBy: verifiedBy,
      updatedAt: timestamp,
    };

    if (isFirebaseConfigured && db) {
      try {
        const regRef = doc(db, "registrations", registrationId);
        await updateDoc(regRef, update);
        const updated = await getDoc(regRef);
        return { id: updated.id, ...updated.data() } as Registration;
      } catch (err) {
        console.error("Firestore updatePaymentStatus failed:", err);
        throw err;
      }
    }

    const local = getLocal<Registration>("registrations", DEFAULT_REGISTRATIONS);
    const idx = local.findIndex(r => r.id === registrationId);
    if (idx > -1) {
      local[idx] = { ...local[idx], ...update };
      setLocal("registrations", local);
      return local[idx];
    }
    throw new Error("Registration not found");
  },
};

