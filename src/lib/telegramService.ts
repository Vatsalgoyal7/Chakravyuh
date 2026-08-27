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
      body: JSON.stringify(payload),
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
