# Chakravyuh 2K26

Production-ready sports-fest portal for IMSEC. It includes a public website, event registrations, privacy-safe status tracking, and a role-controlled admin workspace.

## Included

- Public event directory, registration form, schedules, gallery, rules, contacts and announcements.
- Generated registration tracking code for each participant; public tracking never exposes email, roll number or roster data.
- Admin registration review, CSV export, event configuration, content management and schedule controls.
- Firebase-backed production mode and a LocalStorage-only demo mode for local previews.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the Firebase web configuration.
2. Run `npm install` and then `npm run dev`.
3. Run `npm run lint` before deployment.

## Firebase launch checklist

1. Create a Firebase project and enable **Email/Password** authentication.
2. Create Firestore and Firebase Storage, then deploy `firestore.rules` and `storage.rules` using the Firebase CLI.
3. Create the first Authentication user in Firebase Console. In Firestore Console, create `users/<firebase-auth-uid>` with:

```json
{
  "email": "admin@imsec.ac.in",
  "displayName": "Chakravyuh Super Admin",
  "role": "super_admin",
  "assignedSports": [],
  "createdAt": "2026-07-23T00:00:00.000Z",
  "updatedAt": "2026-07-23T00:00:00.000Z"
}
```

4. Add coordinators from Firestore Console with `role: "coordinator"` and only the event IDs they manage in `assignedSports`, for example `["cricket_2026"]`.
5. Seed actual events, schedule, contacts and rules; the app intentionally does not permit public admin account creation.
6. Enable Firebase App Check before opening public registrations. For large traffic, move registration capacity and anti-spam validation to a Cloud Function.

## Security model

- Super Admins provision roles; the browser cannot create or elevate an admin profile.
- Coordinators can read and manage registrations for their assigned events only.
- Visitors can retrieve only a single non-sensitive registration-status record by tracking code.
- Use Firebase Storage for production uploads. Cloudinary is optional and should use a restricted unsigned preset.
