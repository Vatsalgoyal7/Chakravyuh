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

  // 1. Single compression pass for images
  if (file.type.startsWith("image/")) {
    try {
      const compressionPromise = imageCompression(file, {
        maxSizeMB: options?.maxImageSizeMB ?? 0.8,
        maxWidthOrHeight: options?.maxImageWidthOrHeight ?? 1200,
        useWebWorker: false, // Disabling WebWorker is much more stable in local networks / nested environments
      });

      const timeoutPromise = new Promise<File>((_, reject) =>
        setTimeout(() => reject(new Error("Compression timeout")), 3000)
      );

      compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
    } catch (compressionErr) {
      console.warn("Initial image compression failed or timed out, using original file:", compressionErr);
      compressedFile = file;
    }
  }

  // 2. Try Firebase Storage if configured (with a 30-second timeout for mobile networks)
  if (isFirebaseConfigured && storage) {
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
      
      const uploadPromise = uploadBytes(storageRef, compressedFile);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firebase Storage upload timeout")), 30000)
      );

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      console.warn("Firebase Storage upload failed, falling back to local compressed Base64:", err);
    }
  }

  // 4. Fallback: Base64 data URL (Ensure file is ultra-compressed < 150KB so it never truncates in Firestore/LocalStorage)
  let finalFile = compressedFile;
  if (file.type.startsWith("image/")) {
    try {
      finalFile = await imageCompression(file, {
        maxSizeMB: 0.12,
        maxWidthOrHeight: 600,
        useWebWorker: false,
      });
    } catch (e) {
      console.warn("Failed to compress for Base64 fallback:", e);
    }
  } else if (file.type.startsWith("video/")) {
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
