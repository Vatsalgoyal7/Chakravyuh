export interface TelegramProofPayload {
  registrationId: string;
  trackingCode: string;
  payerName: string;
  payerMobile: string;
  transactionId: string;
  amount: number;
  eventTitle?: string;
  photoBase64?: string;
}

export async function sendTelegramPaymentProof(payload: TelegramProofPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/upload-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, threadId: 8 }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Telegram post failed:", data);
      return { success: false, error: data.error || "Failed to post to Telegram" };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Telegram service error:", err);
    return { success: false, error: err.message || "Network error" };
  }
}

export async function syncAllMediaToTelegram(dbService: any): Promise<{ syncedCount: number; errorsCount: number }> {
  let syncedCount = 0;
  let errorsCount = 0;

  try {
    // 1. Sync Gallery Media -> Topic 6 (Gallery Vault)
    const galleryItems = await dbService.getGallery().catch(() => []);
    for (const item of galleryItems) {
      if (item.imageUrl && (item.imageUrl.startsWith("data:") || item.imageUrl.startsWith("http"))) {
        try {
          const res = await fetch("/api/upload-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileBase64: item.imageUrl, category: "gallery", fileName: item.title || "gallery_item" }),
          });
          if (res.ok) syncedCount++;
          else errorsCount++;
        } catch {
          errorsCount++;
        }
      }
    }

    // 2. Sync Coordinator & Staff Photos -> Topic 4 (Team & Staff)
    const users = await dbService.getUsers().catch(() => []);
    for (const u of users) {
      if (u.photoUrl && (u.photoUrl.startsWith("data:") || u.photoUrl.startsWith("http"))) {
        try {
          const res = await fetch("/api/upload-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileBase64: u.photoUrl, category: "team", fileName: u.displayName || "staff_member" }),
          });
          if (res.ok) syncedCount++;
          else errorsCount++;
        } catch {
          errorsCount++;
        }
      }
    }

    // 3. Sync Payment QRs & Homepage Videos -> Topic 2 (QRs & Videos)
    const payConfig = await dbService.getPaymentConfig().catch(() => null);
    if (payConfig) {
      const qrList = payConfig.qrCodes || [];
      for (const qr of qrList) {
        if (qr.imageUrl && (qr.imageUrl.startsWith("data:") || qr.imageUrl.startsWith("http"))) {
          try {
            const res = await fetch("/api/upload-media", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileBase64: qr.imageUrl, category: "qr_video", fileName: qr.label || "payment_qr" }),
            });
            if (res.ok) syncedCount++;
            else errorsCount++;
          } catch {
            errorsCount++;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync media to Telegram:", err);
  }

  return { syncedCount, errorsCount };
}
