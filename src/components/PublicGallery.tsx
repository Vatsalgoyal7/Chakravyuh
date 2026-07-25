import React, { useEffect, useState } from "react";
import { Image as ImageIcon, X, ZoomIn, Calendar, Eye } from "lucide-react";
import { dbService } from "../lib/dbService";
import { GalleryItem } from "../types";
import { isVideo } from "../lib/uploadService";
import { useTheme } from "../lib/ThemeContext";

export default function PublicGallery() {
  const { isWhiteBg } = useTheme();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        const items = await dbService.getGallery();
        setGallery(items);
      } catch (err) {
        console.error("Failed to load gallery items:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  // Compute unique categories
  const categories = ["All", ...Array.from(new Set(gallery.map(item => item.category))).filter(Boolean)];

  const filteredGallery = gallery.filter(item => {
    return activeCategory === "All" || item.category === activeCategory;
  });

  return (
    <div className={`bg-transparent min-h-screen py-12 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-2">
            MOMENTS OF VALOR
          </h1>
          <h2 className={`text-3xl sm:text-4xl font-extrabold uppercase tracking-tight ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
            CHAKRAVYUH GALLERY
          </h2>
          <p className={`text-xs font-mono max-w-xl mt-2 ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>
            Browse through athletic triumphs, prize ceremonies, crowd energy, and iconic inaugurations of past tournaments.
          </p>
        </div>

        {/* Categories Toolbar */}
        <div className={`flex flex-wrap gap-2 mb-10 pb-6 border-b font-mono text-xs justify-center md:justify-start ${isWhiteBg ? 'border-gray-200' : 'border-gray-800/40'}`}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                activeCategory === cat
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/10"
                  : isWhiteBg
                    ? "text-gray-600 bg-gray-100 hover:text-gray-900 hover:bg-gray-200 border border-gray-300"
                    : "text-gray-400 bg-gray-900/60 hover:text-white hover:bg-gray-800/40 border border-gray-800/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className={`text-center py-20 font-mono text-xs ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
            <span>Opening snapshot archives...</span>
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className={`text-center py-16 border rounded-2xl p-8 font-mono ${isWhiteBg ? 'bg-gray-50 border-gray-300' : 'bg-[#12151a] border-gray-800/50'}`}>
            <ImageIcon className={`w-12 h-12 mx-auto mb-4 ${isWhiteBg ? 'text-gray-400' : 'text-gray-700'}`} />
            <p className={`text-xs ${isWhiteBg ? 'text-gray-600' : 'text-gray-400'}`}>No media archives found under this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group relative aspect-[4/3] rounded-3xl overflow-hidden border cursor-pointer hover:border-orange-500/20 hover:scale-[1.01] transition-all duration-300 shadow-md hover:shadow-lg ${isWhiteBg ? 'bg-gray-200 border-gray-300' : 'bg-gray-950 border-white/[0.04]'}`}
              >
                {/* Image or Video */}
                {isVideo(item.imageUrl) ? (
                  <video
                    src={item.imageUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={item.imageUrl}
                    alt={item.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Dark Vignette Overlay on hover */}
                <div className={`absolute inset-0 opacity-70 group-hover:opacity-90 transition-opacity flex flex-col justify-end p-5 ${isWhiteBg ? 'bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-gray-900/5' : 'bg-gradient-to-t from-black/95 via-black/30 to-black/5'}`} />

                {/* Floating Category tag */}
                <span className={`absolute top-4 left-4 px-2.5 py-1 backdrop-blur-md border text-orange-400 font-mono text-[9px] font-bold uppercase rounded-lg ${isWhiteBg ? 'bg-white/80 border-gray-300' : 'bg-black/80 border-white/[0.06]'}`}>
                  {item.category}
                </span>

                {/* Info Text */}
                <div className="absolute inset-x-0 bottom-0 p-5 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-xs font-mono font-bold text-white line-clamp-2 uppercase tracking-wide leading-snug">
                    {item.caption}
                  </p>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-mono mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3.5 h-3.5 text-orange-500" />
                    <span>Click to view spotlight</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Lightbox Spotlight Popup Modal */}
        {selectedItem && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md transition-all animate-in fade-in duration-300 ${isWhiteBg ? 'bg-gray-900/90' : 'bg-[#07080a]/90'}`}
            onClick={() => setSelectedItem(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className={`absolute top-6 right-6 p-2.5 text-gray-400 hover:text-white rounded-2xl border transition-all cursor-pointer ${isWhiteBg ? 'bg-gray-800/80 hover:bg-gray-700 border-gray-700' : 'bg-gray-900/80 hover:bg-gray-800 border-white/[0.05]'}`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Body Container */}
            <div 
              className="max-w-4xl w-full flex flex-col items-center gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main Image Frame */}
              <div className={`relative max-h-[70vh] rounded-3xl overflow-hidden border bg-gray-950 flex items-center justify-center shadow-2xl w-full ${isWhiteBg ? 'border-gray-700' : 'border-white/[0.08]'}`}>
                {isVideo(selectedItem.imageUrl) ? (
                  <video
                    src={selectedItem.imageUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain max-h-[70vh] rounded-2xl"
                  />
                ) : (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.caption}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain max-h-[70vh] rounded-2xl"
                  />
                )}
              </div>

              {/* Text Description Frame */}
              <div className="text-center font-mono max-w-xl">
                <span className="px-3.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {selectedItem.category}
                </span>
                <p className={`text-xs font-bold uppercase tracking-wide mt-3 leading-relaxed ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>
                  {selectedItem.caption}
                </p>
                {selectedItem.createdAt && (
                  <span className={`block text-[10px] mt-2 uppercase ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>
                    Captured: {new Date(selectedItem.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
