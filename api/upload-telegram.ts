export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { trackingCode, payerName, payerMobile, transactionId, amount, eventTitle, photoBase64 } = req.body;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({ error: "Telegram bot not configured" });
  }

  try {
    const caption = 
      `📸 *PAYMENT PROOF SUBMITTED - CHAKRAVYUH 2K26*\n\n` +
      `👤 *Payer Name:* ${payerName || "N/A"}\n` +
      `📱 *Payer Mobile:* ${payerMobile || "N/A"}\n` +
      `⚽ *Event:* ${eventTitle || "Sports Event"}\n` +
      `💳 *UTR / TXN ID:* \`${transactionId || "N/A"}\` \n` +
      `💰 *Amount:* ₹${amount || 200}\n` +
      `🔖 *Tracking Code:* \`${trackingCode || "N/A"}\` \n` +
      `⏰ *Submitted At:* ${new Date().toLocaleString("en-IN")}`;

    if (photoBase64) {
      const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const Boundary = "----TelegramUploadBoundary" + Date.now();
      let body = "";

      body += `--${Boundary}\r\n`;
      body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`;

      body += `--${Boundary}\r\n`;
      body += `Content-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`;

      body += `--${Boundary}\r\n`;
      body += `Content-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`;

      body += `--${Boundary}\r\n`;
      body += `Content-Disposition: form-data; name="photo"; filename="receipt.jpg"\r\n`;
      body += `Content-Type: image/jpeg\r\n\r\n`;

      const headerBuffer = Buffer.from(body, "utf-8");
      const footerBuffer = Buffer.from(`\r\n--${Boundary}--\r\n`, "utf-8");
      const multipartBody = Buffer.concat([headerBuffer, buffer, footerBuffer]);

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${Boundary}`,
        },
        body: multipartBody,
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Telegram sendPhoto error:", data);
        return res.status(response.status).json({ error: data.description || "Failed to post to Telegram" });
      }

      return res.status(200).json({ success: true, messageId: data.result?.message_id, photoBase64 });
    } else {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
          parse_mode: "Markdown",
        }),
      });

      const data = await response.json();
      return res.status(200).json({ success: true, messageId: data.result?.message_id });
    }
  } catch (err: any) {
    console.error("Telegram upload handler error:", err);
    return res.status(500).json({ error: err.message || "Failed to notify Telegram" });
  }
}
