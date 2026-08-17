import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, isFirebaseConfigured } from "./firebase";
import imageCompression from "browser-image-compression";

const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || "";
const uploadPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || "";
const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export async function uploadMedia(
  file: File,
  options?: { maxImageSizeMB?: number; maxImageWidthOrHeight?: number }
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

  // 2. Try Firebase Storage if configured (5-second fast timeout)
  if (isFirebaseConfigured && storage) {
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
      
      const uploadPromise = uploadBytes(storageRef, compressedFile);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firebase Storage upload timeout")), 5000)
      );

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      console.warn("Firebase Storage upload failed or timed out, falling back to local compressed Base64:", err);
    }
  }

  // 4. Fast Fallback: Base64 data URL
  const finalFile = compressedFile;
  if (file.type.startsWith("video/")) {
    if (file.size > 1.5 * 1024 * 1024) {
      throw new Error("Video file is too large for local database storage (max 1.5MB offline). Please configure Firebase Storage or use a smaller video.");
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(finalFile);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
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
