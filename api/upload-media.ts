export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileBase64, category = "gallery", fileName = "upload_media" } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ error: "No file content provided" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN || "8969139026:AAG_fnSiH828cH4tk0eAVVb1rcqhil5L9FM";
  const chatId = process.env.TELEGRAM_CHAT_ID || "-1004393512496";

  // Map category to Telegram Topic Thread IDs
  // 6 = Gallery Vault, 4 = Team & Staff, 2 = QRs & Videos
  let messageThreadId = 6;
  if (category === "team") messageThreadId = 4;
  if (category === "qr_video") messageThreadId = 2;

  try {
    const isVideo = fileBase64.startsWith("data:video/");
    const isPdf = fileBase64.startsWith("data:application/pdf");
    
    const cleanBase64 = fileBase64.replace(/^data:(image\/\w+|video\/\w+|application\/pdf);base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    const Boundary = "----TelegramMediaBoundary" + Date.now();
    let body = "";

    body += `--${Boundary}\r\n`;
    body += `Content-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`;

    body += `--${Boundary}\r\n`;
    body += `Content-Disposition: form-data; name="message_thread_id"\r\n\r\n${messageThreadId}\r\n`;

    const topicLabel = category === "team" ? "👤 TEAM & STAFF" : category === "qr_video" ? "🎬 QRs & VIDEOS" : "🖼️ GALLERY VAULT";
    const caption = `📁 *NEW MEDIA UPLOAD - CHAKRAVYUH 2K26*\n\n📌 *Category:* ${topicLabel}\n⏰ *Uploaded At:* ${new Date().toLocaleString("en-IN")}`;

    body += `--${Boundary}\r\n`;
    body += `Content-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`;

    body += `--${Boundary}\r\n`;
    body += `Content-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`;

    const fieldName = isVideo ? "video" : isPdf ? "document" : "photo";
    const mimeType = isVideo ? "video/mp4" : isPdf ? "application/pdf" : "image/jpeg";
    const extension = isVideo ? ".mp4" : isPdf ? ".pdf" : ".jpg";
    const apiEndpoint = isVideo ? "sendVideo" : isPdf ? "sendDocument" : "sendPhoto";

    body += `--${Boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}${extension}"\r\n`;
    body += `Content-Type: ${mimeType}\r\n\r\n`;

    const headerBuffer = Buffer.from(body, "utf-8");
    const footerBuffer = Buffer.from(`\r\n--${Boundary}--\r\n`, "utf-8");
    const multipartBody = Buffer.concat([headerBuffer, buffer, footerBuffer]);

    const response = await fetch(`https://api.telegram.org/bot${botToken}/${apiEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${Boundary}`,
      },
      body: multipartBody,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Telegram media ${apiEndpoint} error:`, data);
      return res.status(response.status).json({ error: data.description || "Failed to upload to Telegram Storage" });
    }

    return res.status(200).json({
      success: true,
      messageId: data.result?.message_id,
      fileUrl: fileBase64, // Instant browser fallback data URL
      category,
    });
  } catch (err: any) {
    console.error("Telegram upload media handler error:", err);
    return res.status(500).json({ error: err.message || "Failed to process media upload" });
  }
}
