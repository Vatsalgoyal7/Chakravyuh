import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing required fields: to, subject, html" });
  }

  const gmailUser = process.env.GMAIL_USER || "vatsalgoyal71@gmail.com";
  const gmailPass = process.env.GMAIL_APP_PASSWORD || "ygmscxzwnbzvjuqv";

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Gmail SMTP credentials not configured" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass.replace(/\s+/g, ""),
      },
    });

    const mailOptions = {
      from: `"Chakravyuh 2K26 Sports" <${gmailUser}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("Gmail SMTP send error:", err);
    return res.status(500).json({ error: err.message || "Failed to send email via Gmail" });
  }
}
