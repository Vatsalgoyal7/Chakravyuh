import { createHash, randomUUID } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();
const db = getFirestore();

type RegistrationInput = {
  eventId: string; eventTitle: string; sportType: "team" | "individual"; status: "pending";
  leadName: string; leadEmail: string; leadPhone: string; leadCollege: string; leadRollNo: string;
  leadBranch: string; leadYear: string; gender: "male" | "female"; teamName?: string;
  members: Array<{ name: string; email?: string; phone?: string; rollNo: string; college: string }>;
  duplicateCheckHash: string; isOutstation?: boolean; travelMode?: string; remarks?: string;
  paymentStatus?: string;
};

function text(value: unknown, maximum = 200): string {
  if (typeof value !== "string") throw new HttpsError("invalid-argument", "Invalid request data.");
  const clean = value.trim();
  if (!clean || clean.length > maximum) throw new HttpsError("invalid-argument", "Invalid request data.");
  return clean;
}

async function enforceRateLimit(key: string, limit: number, periodMs: number) {
  const ref = db.collection("_rate_limits").doc(createHash("sha256").update(key).digest("hex"));
  await db.runTransaction(async transaction => {
    const current = await transaction.get(ref);
    const now = Date.now();
    const data = current.data();
    const active = data && now - data.windowStartedAt < periodMs;
    const count = active ? Number(data.count || 0) : 0;
    if (count >= limit) throw new HttpsError("resource-exhausted", "Too many attempts. Please try again later.");
    transaction.set(ref, { count: count + 1, windowStartedAt: active ? data!.windowStartedAt : now, expiresAt: now + periodMs }, { merge: true });
  });
}

function callerKey(request: { rawRequest?: { ip?: string }; auth?: { uid: string } | null }) {
  return request.auth?.uid || request.rawRequest?.ip || "unknown";
}

export const submitRegistration = onCall({ enforceAppCheck: false, consumeAppCheckToken: true }, async request => {
  await enforceRateLimit(`registration:${callerKey(request)}`, 8, 60 * 60 * 1000);
  const data = request.data as RegistrationInput;
  const eventId = text(data.eventId, 100);
  const leadEmail = text(data.leadEmail, 254).toLowerCase();
  const leadRollNo = text(data.leadRollNo, 80);
  const leadName = text(data.leadName);
  const leadPhone = text(data.leadPhone, 30);
  const leadCollege = text(data.leadCollege);
  const leadBranch = text(data.leadBranch, 100);
  const leadYear = text(data.leadYear, 50);
  if (!/^\S+@\S+\.\S+$/.test(leadEmail) || !/^[+0-9 ()-]{8,30}$/.test(leadPhone)) throw new HttpsError("invalid-argument", "Invalid contact information.");
  if (data.sportType !== "team" && data.sportType !== "individual") throw new HttpsError("invalid-argument", "Invalid event type.");
  if (!Array.isArray(data.members) || data.members.length > 30) throw new HttpsError("invalid-argument", "Invalid team roster.");
  const normalizedRoll = leadRollNo.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const registrationId = `reg_${eventId}_${normalizedRoll}`;
  const trackingCode = `CHK-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const now = new Date().toISOString();
  const eventRef = db.collection("events").doc(eventId);
  const registrationRef = db.collection("registrations").doc(registrationId);
  const statusRef = db.collection("registration_status").doc(trackingCode);

  const registration = await db.runTransaction(async transaction => {
    const [eventSnap, registrationSnap] = await Promise.all([transaction.get(eventRef), transaction.get(registrationRef)]);
    if (!eventSnap.exists) throw new HttpsError("not-found", "This event no longer exists.");
    if (registrationSnap.exists) throw new HttpsError("already-exists", "This roll number is already registered for this event.");
    const event = eventSnap.data()!;
    if (!event.isActive || new Date(String(event.registrationDeadline)).getTime() < Date.now()) throw new HttpsError("failed-precondition", "Registration is closed for this event.");
    if (Number(event.registrationCount || 0) >= Number(event.maxRegistrations || 0)) throw new HttpsError("resource-exhausted", "Registration capacity has been reached.");
    if (String(event.type) !== data.sportType) throw new HttpsError("invalid-argument", "Event details have changed. Refresh and try again.");
    const members = data.members.map(member => ({ name: text(member.name), email: typeof member.email === "string" ? member.email.trim().toLowerCase() : "", phone: typeof member.phone === "string" ? member.phone.trim() : "", rollNo: text(member.rollNo, 80), college: text(member.college) }));
    const rosterSize = members.length + 1;
    if ((data.sportType === "team" && (rosterSize < Number(event.minTeamSize) || rosterSize > Number(event.maxTeamSize))) || (data.sportType === "individual" && members.length !== 0)) throw new HttpsError("invalid-argument", "Invalid roster size.");
    const record = { id: registrationId, eventId, eventTitle: String(event.title), sportType: data.sportType, status: "pending", leadName, leadEmail, leadPhone, leadCollege, leadRollNo, leadBranch, leadYear, gender: data.gender === "female" ? "female" : "male", teamName: typeof data.teamName === "string" ? data.teamName.trim().slice(0, 120) : "", members, duplicateCheckHash: `${eventId}_${leadRollNo}`, isOutstation: data.isOutstation === true, travelMode: typeof data.travelMode === "string" ? data.travelMode.trim().slice(0, 80) : "", remarks: "", paymentStatus: data.paymentStatus === "ims_student" ? "ims_student" : "pending_payment", trackingCode, registeredAt: now, updatedAt: now, checkedIn: false };
    transaction.create(registrationRef, record);
    transaction.create(statusRef, { trackingCode, eventId, eventTitle: record.eventTitle, sportType: record.sportType, teamName: record.teamName, status: "pending", registeredAt: now, checkedIn: false });
    transaction.update(eventRef, { registrationCount: FieldValue.increment(1), updatedAt: now });
    return record;
  });
  return registration;
});

export const recoverRegistrations = onCall({ enforceAppCheck: false, consumeAppCheckToken: true }, async request => {
  await enforceRateLimit(`recovery:${callerKey(request)}`, 5, 60 * 60 * 1000);
  const email = text(request.data?.email, 254).toLowerCase();
  const rollNo = text(request.data?.rollNo, 80);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpsError("invalid-argument", "Enter a valid email address.");
  const snapshot = await db.collection("registrations").where("leadRollNo", "==", rollNo).limit(20).get();
  return snapshot.docs.map(doc => doc.data()).filter(record => String(record.leadEmail).toLowerCase() === email).map(record => ({ id: record.id, trackingCode: record.trackingCode, eventTitle: record.eventTitle, sportType: record.sportType, teamName: record.teamName, status: record.status, registeredAt: record.registeredAt, checkedIn: Boolean(record.checkedIn) }));
});

export const submitPaymentProof = onCall({ enforceAppCheck: false, consumeAppCheckToken: true }, async request => {
  await enforceRateLimit(`payment:${callerKey(request)}`, 5, 60 * 60 * 1000);
  const registrationId = text(request.data?.registrationId, 180);
  const trackingCode = text(request.data?.trackingCode, 40).toUpperCase();
  const payerName = text(request.data?.payerName);
  const payerMobile = text(request.data?.payerMobile, 30);
  const transactionId = text(request.data?.transactionId, 100);
  const amount = Number(request.data?.amount);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000 || !/^[+0-9 ()-]{8,30}$/.test(payerMobile)) throw new HttpsError("invalid-argument", "Invalid payment details.");
  const registrationRef = db.collection("registrations").doc(registrationId);
  const verificationRef = db.collection("payment_verifications").doc(`payment_${registrationId}`);
  const submittedAt = new Date().toISOString();
  await db.runTransaction(async transaction => {
    const [registration, existing] = await Promise.all([transaction.get(registrationRef), transaction.get(verificationRef)]);
    if (!registration.exists || registration.data()!.trackingCode !== trackingCode) throw new HttpsError("permission-denied", "Registration could not be verified.");
    if (existing.exists) throw new HttpsError("already-exists", "Payment proof has already been submitted.");
    transaction.create(verificationRef, { id: verificationRef.id, registrationId, payerName, payerMobile, transactionId, amount, status: "pending", submittedAt });
    transaction.update(registrationRef, { paymentStatus: "payment_submitted", utrNumber: transactionId, paymentSubmittedAt: submittedAt, updatedAt: submittedAt });
  });
  return { id: verificationRef.id, submittedAt };
});
