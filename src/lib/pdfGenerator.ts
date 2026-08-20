import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Registration, SportEvent } from "../types";

export function generateEventPassPDF(registration: Registration, event?: SportEvent): jsPDF {
  // Create A4 portrait document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Background subtle fill
  doc.setFillColor(15, 23, 42); // #0f172a (dark background accent)
  doc.rect(0, 0, pageWidth, 20, "F");

  // Top Banner Branding
  doc.setTextColor(245, 158, 11); // #f59e0b (gold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CHAKRAVYUH 2K26", margin, 13);

  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text("IMS ENGINEERING COLLEGE | ANNUAL SPORTS FEST", pageWidth - margin, 13, { align: "right" });

  // Main Container Box
  let y = 26;

  // Header Title Card
  doc.setFillColor(30, 41, 59); // #1e293b
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const eventTitleStr = (registration.eventTitle || event?.title || "SPORTS EVENT").toUpperCase();
  doc.text(eventTitleStr, margin + 5, y + 9);

  const sportTypeStr = (registration.sportType || event?.type || "INDIVIDUAL").toUpperCase();
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`CATEGORY: ${sportTypeStr} ${registration.teamName ? ` | TEAM: ${registration.teamName.toUpperCase()}` : ""}`, margin + 5, y + 16);

  // Status Badge on Top Right
  let statusText = "PENDING AUDIT";
  let badgeColor = [234, 179, 8]; // yellow
  if (registration.status === "approved" || registration.paymentStatus === "payment_verified") {
    statusText = "VERIFIED SLOT";
    badgeColor = [16, 185, 129]; // green
  } else if (registration.paymentStatus === "ims_student") {
    statusText = "IMSEC EXEMPTION";
    badgeColor = [59, 130, 246]; // blue
  } else if (registration.status === "rejected" || registration.paymentStatus === "payment_rejected") {
    statusText = "REJECTED";
    badgeColor = [239, 68, 68]; // red
  }

  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(pageWidth - margin - 45, y + 5, 40, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, pageWidth - margin - 25, y + 12.5, { align: "center" });

  y += 27;

  // Tracking Code & Pass Barcode Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("OFFICIAL ENTRY TRACKING CODE", margin + 6, y + 7);

  doc.setFontSize(14);
  doc.setFont("courier", "bold");
  doc.setTextColor(217, 119, 6); // #d97706
  const trackingCodeStr = registration.trackingCode || `CHK-${registration.id.slice(-8).toUpperCase()}`;
  doc.text(trackingCodeStr, margin + 6, y + 16);

  // Barcode style lines simulation
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(`ISSUED: ${new Date(registration.registeredAt || Date.now()).toLocaleDateString("en-IN")}`, pageWidth - margin - 6, y + 16, { align: "right" });

  y += 29;

  // Section 1: Athlete / Captain Profile
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("1. ATHLETE / CAPTAIN PROFILE", margin, y);
  y += 3;

  const captainData = [
    [
      { content: "Full Name", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.leadName || "N/A",
      { content: "Roll Number", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.leadRollNo || "N/A"
    ],
    [
      { content: "Institution", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.leadCollege || "IMS Engineering College",
      { content: "Branch & Year", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      `${registration.leadBranch || "CSE"} (${registration.leadYear || "3rd Year"})`
    ],
    [
      { content: "Phone Number", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.leadPhone || "N/A",
      { content: "Email Address", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.leadEmail || "N/A"
    ],
    [
      { content: "Gender", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      (registration.gender || "male").toUpperCase(),
      { content: "Payment Status", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.paymentStatus === "ims_student" ? "EXEMPT (IMSEC Student)" : (registration.paymentStatus || "Pending Verification").toUpperCase()
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: captainData as any,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 58 },
      2: { cellWidth: 32 },
      3: { cellWidth: 60 }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Team Members (if team event)
  if (registration.sportType === "team" && registration.members && registration.members.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`2. TEAM ROSTER (${registration.members.length + 1} ATHLETES)`, margin, y);
    y += 3;

    const memberHeaders = [["#", "Member Name", "Roll No", "Branch / College", "Phone"]];
    const memberRows = registration.members.map((m, idx) => [
      idx + 1,
      m.name || "N/A",
      m.rollNo || "N/A",
      `${m.college || "IMSEC"}`,
      m.phone || "N/A"
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: memberHeaders,
      body: memberRows,
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 47 },
        4: { cellWidth: 35 }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section 3: Transaction & Payment Proof
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("3. PAYMENT & VERIFICATION PROOF", margin, y);
  y += 3;

  const paymentData = [
    [
      { content: "UTR / Transaction ID", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.utrNumber || "N/A (Internal / Offline)",
      { content: "Fee Amount", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
      registration.paymentStatus === "ims_student" ? "₹0 (IMSEC Free Exemption)" : (event?.registrationFee !== undefined ? `₹${event.registrationFee}` : "₹200 (Verified)")
    ]
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: paymentData as any,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 57 }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 4: Ground Regulations & Mandate Box
  doc.setFillColor(254, 243, 199); // #fef3c7 (light yellow alert)
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 83, 9); // #b45309
  doc.text("📌 MANDATORY GROUND REPORTING & CONDUCT RULES:", margin + 5, y + 6);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("• Physical College ID Card is MANDATORY for all athletes at verification counters.", margin + 5, y + 11);
  doc.text("• Teams/Athletes must report at the designated arena 30 minutes prior to scheduled fixture time.", margin + 5, y + 16);
  doc.text("• Unsportsmanlike conduct or fake credentials will lead to immediate disqualification & disciplinary action.", margin + 5, y + 21);

  y += 31;

  // Footer & Official Seal Line
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("CHAKRAVYUH 2K26 CENTRAL SPORTS COMMITTEE", margin, pageHeight - 14);

  doc.setFont("helvetica", "normal");
  doc.text("IMS Engineering College, NH-24, Adhyatmik Nagar, Ghaziabad", margin, pageHeight - 10);

  doc.setFont("courier", "bold");
  doc.setTextColor(217, 119, 6);
  doc.text("OFFICIAL DIGITAL PASS - SINGLE PAGE VALIDATED", pageWidth - margin, pageHeight - 12, { align: "right" });

  return doc;
}

export function downloadEventPassPDF(registration: Registration, event?: SportEvent): void {
  const doc = generateEventPassPDF(registration, event);
  const trackingCode = registration.trackingCode || `CHK-${registration.id.slice(-8)}`;
  doc.save(`Chakravyuh_Pass_${trackingCode}.pdf`);
}

export function getEventPassPDFBase64(registration: Registration, event?: SportEvent): string {
  const doc = generateEventPassPDF(registration, event);
  return doc.output("datauristring").split(",")[1];
}
