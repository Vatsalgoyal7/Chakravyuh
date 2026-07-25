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

  // 2. Try Firebase Storage if configured (with a 4-second timeout to prevent hanging)
  if (isFirebaseConfigured && storage) {
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      
      const uploadPromise = uploadBytes(storageRef, compressedFile);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firebase Storage upload timeout")), 4000)
      );

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      console.warn("Firebase Storage upload failed or timed out, trying Cloudinary:", err);
    }
  }

  // 3. Try Cloudinary when explicitly configured
  if (isCloudinaryConfigured) {
    try {
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", uploadPreset);

      const resourceType = file.type.startsWith("video") ? "video" : "image";
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      const data = await response.json();
      if (response.ok && data.secure_url) {
        return data.secure_url;
      } else {
        console.warn("Cloudinary upload rejected:", data);
      }
    } catch (cloudinaryErr) {
      console.warn("Cloudinary upload failed, falling back to Base64:", cloudinaryErr);
    }
  }

  // 4. Fallback: Base64 data URL
  let finalFile = compressedFile;
  if (file.type.startsWith("image/") && finalFile.size > 0.5 * 1024 * 1024) {
    try {
      finalFile = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
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
