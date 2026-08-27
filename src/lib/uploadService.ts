import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, isFirebaseConfigured } from "./firebase";
import imageCompression from "browser-image-compression";

const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || "";
const uploadPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || "";
const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export async function uploadMedia(
  file: File,
  options?: { maxImageSizeMB?: number; maxImageWidthOrHeight?: number; category?: "gallery" | "team" | "qr_video" }
): Promise<string> {
  let compressedFile = file;

  // 1. Single compression pass for images (ultra-fast 800px max, ~150KB)
  if (file.type.startsWith("image/")) {
    try {
      const compressionPromise = imageCompression(file, {
        maxSizeMB: options?.maxImageSizeMB ?? 0.15,
        maxWidthOrHeight: options?.maxImageWidthOrHeight ?? 800,
        useWebWorker: false,
      });

      const timeoutPromise = new Promise<File>((_, reject) =>
        setTimeout(() => reject(new Error("Compression timeout")), 1500)
      );

      compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
    } catch (compressionErr) {
      console.warn("Initial image compression failed or timed out, using original file:", compressionErr);
      compressedFile = file;
    }
  }

  // 2. Read file as Base64 for Telegram Upload API
  const base64Data: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(compressedFile);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });

  // 3. Try Telegram Bot Media Storage API
  try {
    const res = await fetch("/api/upload-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: base64Data,
        category: options?.category || "gallery",
        fileName: file.name,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return data.fileUrl || base64Data;
    }
  } catch (err) {
    console.warn("Telegram Media Upload API warning, using local fallback:", err);
  }

  // 4. Fallback: Base64 Data URL
  return base64Data;
}

export const isVideo = (url: string) => {
  if (!url) return false;
  return (
    url.startsWith("data:video/") ||
    url.toLowerCase().endsWith(".mp4") ||
    url.toLowerCase().endsWith(".webm") ||
    url.toLowerCase().endsWith(".ogg") ||
    url.toLowerCase().endsWith(".mov") ||
    url.toLowerCase().includes("/video/upload/") ||
    (url.includes("firebasestorage.googleapis.com") && url.toLowerCase().includes(".mp4")) ||
    url.toLowerCase().includes("video")
  );
};
