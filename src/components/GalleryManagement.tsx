import React, { useEffect, useState } from "react";
import { dbService } from "../lib/dbService";
import { GalleryItem } from "../types";
import { uploadMedia, isVideo } from "../lib/uploadService";

import {
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Tag,
  ExternalLink,
  Upload,
  Video,
  Loader2,
} from "lucide-react";

export default function GalleryManagement() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Ceremonies");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadGallery();
  }, []);

  async function loadGallery() {
    setIsLoading(true);

    try {
      const data = await dbService.getGallery();
      setGallery(data);
    } catch (error) {
      console.error("Failed to load gallery:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setSelectedFiles([]);
    setCaption("");
    setCategory("Ceremonies");
    setUploadProgress(0);
    setShowForm(false);
  };

  // Select multiple files
  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const files = Array.from(event.target.files) as File[];

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      return isImage || isVideo;
    });

    if (validFiles.length !== files.length) {
      alert("Only image and video files are allowed.");
    }

    setSelectedFiles(validFiles);
  };

  // Remove selected file before upload
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((previousFiles) =>
      previousFiles.filter((_, i) => i !== index)
    );
  };

  // Upload is handled by the shared uploadMedia utility

  // Upload all selected files
  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      alert("Please select at least one image or video.");
      return;
    }

    if (!caption.trim()) {
      alert("Please enter a caption.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Upload file
        const url = await uploadMedia(file);

        // Save uploaded URL to Firestore
        await dbService.saveGalleryItem({
          imageUrl: url,
          caption: caption.trim(),
          category,
          uploadedBy: "super_admin",
        });

        const progress = Math.round(
          ((i + 1) / selectedFiles.length) * 100
        );

        setUploadProgress(progress);
      }

      alert(
        `${selectedFiles.length} file(s) uploaded successfully!`
      );

      resetForm();
      await loadGallery();
    } catch (error) {
      console.error("Upload error:", error);

      alert(
        "Upload failed. Please check Cloudinary settings and try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Delete gallery item
  const handleDeleteClick = async (id: string) => {
    const confirmed = confirm(
      "Are you sure you want to permanently delete this gallery item?"
    );

    if (!confirmed) return;

    try {
      await dbService.deleteGalleryItem(id);
      await loadGallery();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete gallery item.");
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>

          <span className="text-xs text-gray-500 font-mono">
            Synchronizing gallery...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">
            Chakravyuh Gallery Vault
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Upload and manage event photographs and videos.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            Upload Media
          </button>
        )}
      </div>

      {/* UPLOAD FORM */}
      {showForm && (
        <div className="bg-[#12141a] border border-orange-500/10 p-6 rounded-2xl space-y-6">

          {/* FORM HEADER */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <h3 className="text-sm uppercase tracking-wider font-bold text-orange-500 font-mono flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Images & Videos
            </h3>

            <button
              onClick={resetForm}
              className="p-1.5 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* FILE UPLOAD */}
            <div className="space-y-2">

              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">
                Select Images / Videos
              </label>

              <label className="flex flex-col items-center justify-center w-full min-h-40 border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-2xl cursor-pointer bg-[#0d0f12] transition-all">

                <Upload className="w-8 h-8 text-orange-500 mb-3" />

                <p className="text-sm text-gray-300 font-semibold">
                  Click to select files
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  You can select multiple images and videos
                </p>

                <p className="text-[10px] text-gray-600 mt-2">
                  JPG, PNG, WEBP, MP4, MOV, AVI
                </p>

                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

              </label>

              {/* SELECTED FILES */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">

                  <p className="text-xs text-orange-400 font-bold">
                    {selectedFiles.length} file(s) selected
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-2">

                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between bg-[#0d0f12] border border-gray-800 rounded-lg px-3 py-2"
                      >

                        <div className="flex items-center gap-3 min-w-0">

                          {file.type.startsWith("video") ? (
                            <Video className="w-4 h-4 text-blue-400 shrink-0" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-orange-400 shrink-0" />
                          )}

                          <div className="min-w-0">
                            <p className="text-xs text-gray-300 truncate">
                              {file.name}
                            </p>

                            <p className="text-[10px] text-gray-600">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedFile(index)
                          }
                          className="text-gray-500 hover:text-red-400 ml-3"
                        >
                          <X className="w-4 h-4" />
                        </button>

                      </div>
                    ))}

                  </div>

                </div>
              )}

            </div>

            {/* CATEGORY */}
            <div className="space-y-2">

              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">
                Gallery Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white font-mono"
              >
                <option value="Ceremonies">
                  Ceremonies & Inaugurations
                </option>

                <option value="Action">
                  Action Game Shots
                </option>

                <option value="Winners">
                  Award Winners & Streaks
                </option>

                <option value="Videos">
                  Event Videos
                </option>

                <option value="Other">
                  Other Campus Sports Highlights
                </option>
              </select>

            </div>

            {/* CAPTION */}
            <div className="space-y-2">

              <label className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold font-mono">
                Caption
              </label>

              <input
                type="text"
                required
                placeholder="e.g. Cricket Final - CHAKRAVYUH 2K26"
                value={caption}
                onChange={(e) =>
                  setCaption(e.target.value)
                }
                className="w-full px-4 py-2.5 bg-[#0d0f12] border border-gray-800 focus:border-orange-500 rounded-xl text-xs text-white"
              />

            </div>

            {/* PROGRESS */}
            {isUploading && (
              <div className="space-y-2">

                <div className="flex justify-between text-xs text-gray-400">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>

                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />

                </div>

              </div>
            )}

            {/* BUTTONS */}
            <div className="flex gap-2 pt-4 border-t border-gray-800">

              <button
                type="submit"
                disabled={
                  isUploading ||
                  selectedFiles.length === 0
                }
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-2"
              >

                {isUploading && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {isUploading
                  ? `Uploading ${uploadProgress}%`
                  : "Upload All Files"}

              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={isUploading}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* GALLERY GRID */}
      {gallery.length === 0 ? (

        <div className="h-64 flex items-center justify-center border border-dashed border-gray-800 rounded-2xl">

          <div className="text-center">

            <ImageIcon className="w-10 h-10 text-gray-700 mx-auto mb-3" />

            <p className="text-sm text-gray-500">
              No gallery media uploaded yet.
            </p>

          </div>

        </div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {gallery.map((item) => (

            <div
              key={item.id}
              className="bg-[#12141a] border border-gray-800/80 rounded-2xl overflow-hidden group hover:border-gray-700 transition-all flex flex-col justify-between"
            >

              {/* MEDIA */}
              <div>

                <div className="h-48 relative overflow-hidden bg-gray-900">

                  {isVideo(item.imageUrl) ? (

                    <video
                      src={item.imageUrl}
                      controls
                      className="w-full h-full object-cover"
                    />

                  ) : (

                    <img
                      src={item.imageUrl}
                      alt={item.caption}
                      className="w-full h-full object-cover transition-all group-hover:scale-105 duration-500"
                      referrerPolicy="no-referrer"
                    />

                  )}

                  <span className="absolute top-3 left-3 text-[9px] uppercase font-bold font-mono tracking-wider bg-black/60 backdrop-blur-md text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/10 flex items-center gap-1">

                    <Tag className="w-3 h-3" />

                    <span>{item.category}</span>

                  </span>

                </div>

                <div className="p-4 space-y-2">

                  <p className="text-xs text-gray-300 leading-normal font-medium">
                    {item.caption}
                  </p>

                  <span className="block text-[9px] text-gray-500 font-mono">
                    Uploaded:{" "}
                    {new Date(
                      item.createdAt
                    ).toLocaleDateString()}
                  </span>

                </div>

              </div>

              {/* ACTIONS */}
              <div className="p-4 border-t border-gray-800/40 flex items-center justify-between">

                <a
                  href={item.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-gray-500 hover:text-white font-mono flex items-center gap-1"
                >
                  <span>View Full Asset</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() =>
                    handleDeleteClick(item.id)
                  }
                  className="p-1.5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-lg transition-all"
                  title="Remove media"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}