// Real email sender using Vercel /api/send-email serverless function (Resend)

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  encoding?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Email send failed:", data);
      return { success: false, error: data.error || data.message || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Email service error:", err);
    return { success: false, error: err.message || "Network error" };
  }
}

export function buildApprovalEmail(name: string, eventTitle: string, trackingCode?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0d0f12; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #000;">🏆 CHAKRAVYUH 2K26</h1>
        <p style="margin: 4px 0 0; color: #000; font-size: 14px;">IMS Engineering College Annual Sports Fest</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #34d399; margin-top: 0;">✅ Registration Approved!</h2>
        <p style="color: #d1d5db;">Dear <strong style="color: #fff;">${name}</strong>,</p>
        <p style="color: #d1d5db;">Congratulations! Your registration for <strong style="color: #f59e0b;">${eventTitle}</strong> has been <strong style="color: #34d399;">APPROVED</strong>.</p>
        <div style="background: #1a1d23; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #34d399;">
          <p style="margin: 0; color: #9ca3af; font-size: 14px;">📋 Next Steps:</p>
          <ul style="color: #d1d5db; margin: 8px 0 0; padding-left: 20px;">
            <li>Carry your College ID Card on match day</li>
            <li>Fixture details will be shared soon</li>
            <li>Stay updated on the portal for schedule</li>
          </ul>
        </div>
        ${trackingCode ? `<p style="color: #9ca3af; font-size: 13px;">Your Tracking Code: <strong style="color: #f59e0b; font-family: monospace;">${trackingCode}</strong></p>` : ""}
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #374151; padding-top: 16px;">
          This is an automated message from Chakravyuh 2K26. Do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

export function buildRejectionEmail(name: string, eventTitle: string, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0d0f12; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #000;">🏆 CHAKRAVYUH 2K26</h1>
        <p style="margin: 4px 0 0; color: #000; font-size: 14px;">IMS Engineering College Annual Sports Fest</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #f87171; margin-top: 0;">❌ Registration Update</h2>
        <p style="color: #d1d5db;">Dear <strong style="color: #fff;">${name}</strong>,</p>
        <p style="color: #d1d5db;">Unfortunately, your registration for <strong style="color: #f59e0b;">${eventTitle}</strong> could not be approved at this time.</p>
        ${reason ? `
        <div style="background: #1a1d23; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #f87171;">
          <p style="margin: 0; color: #9ca3af; font-size: 14px;">📝 Reason:</p>
          <p style="margin: 8px 0 0; color: #d1d5db;">${reason}</p>
        </div>` : ""}
        <p style="color: #d1d5db;">If you believe this is an error, please contact the sports committee or re-register through the public portal.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #374151; padding-top: 16px;">
          This is an automated message from Chakravyuh 2K26. Do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

export function buildRegistrationConfirmEmail(name: string, eventTitle: string, trackingCode: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #0d0f12; color: #fff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #000;">🏆 CHAKRAVYUH 2K26</h1>
        <p style="margin: 4px 0 0; color: #000; font-size: 14px;">IMS Engineering College Annual Sports Fest</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #60a5fa; margin-top: 0;">📩 Registration Received</h2>
        <p style="color: #d1d5db;">Dear <strong style="color: #fff;">${name}</strong>,</p>
        <p style="color: #d1d5db;">Your registration for <strong style="color: #f59e0b;">${eventTitle}</strong> has been received and is under review.</p>
        <div style="background: #1a1d23; border-radius: 8px; padding: 16px; margin: 20px 0; border-left: 4px solid #60a5fa;">
          <p style="margin: 0; color: #9ca3af; font-size: 14px;">🔖 Your Tracking Code:</p>
          <p style="margin: 8px 0 0; font-size: 22px; font-family: monospace; color: #f59e0b; letter-spacing: 2px;">${trackingCode}</p>
          <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">Use this code to track your registration status on the portal.</p>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #374151; padding-top: 16px;">
          This is an automated message from Chakravyuh 2K26. Do not reply to this email.
        </p>
      </div>
    </div>
  `;
}
