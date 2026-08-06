import React, { useState } from "react";
import { ExternalLink, RefreshCw, Layers } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

interface PublicCustomFormProps {
  url: string;
  title: string;
}

export default function PublicCustomForm({ url, title }: PublicCustomFormProps) {
  const { isWhiteBg } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Helper to ensure google forms use the embedded parameter or at least show up nicely
  const getEmbeddableUrl = (originalUrl: string) => {
    let target = originalUrl.trim();
    if (target.includes("docs.google.com/forms")) {
      if (target.includes("/viewform") && !target.includes("embedded=true")) {
        target = target.includes("?") ? `${target}&embedded=true` : `${target}?embedded=true`;
      }
    }
    return target;
  };

  const embedUrl = getEmbeddableUrl(url);

  return (
    <div className="bg-transparent text-white min-h-[80vh] pt-12 pb-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header control panel */}
        <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs ${
          isWhiteBg
            ? "bg-white/80 border-gray-200 text-gray-800 shadow-md"
            : "bg-[#0b0e14]/80 border-slate-700/60 text-gray-200 shadow-xl"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm font-extrabold uppercase tracking-wide leading-none ${isWhiteBg ? "text-gray-900" : "text-white"}`}>
                {title}
              </h2>
              <p className="text-[10px] text-gray-500 mt-1">
                Collegiate Sports Portal Gateway • Iframe Sandbox Connection
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsLoading(true);
                const iframe = document.getElementById("custom-form-iframe") as HTMLIFrameElement;
                if (iframe) iframe.src = embedUrl;
              }}
              className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer hover:scale-105 transition-all ${
                isWhiteBg
                  ? "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  : "bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.08]"
              }`}
              title="Reload form frame"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-xl border font-bold flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all ${
                isWhiteBg
                  ? "bg-orange-100 border-orange-200 text-orange-700 hover:bg-orange-200"
                  : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
              }`}
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Iframe Frame container */}
        <div className={`relative w-full rounded-3xl overflow-hidden border shadow-2xl h-[750px] transition-all ${
          isWhiteBg ? "border-gray-200 bg-gray-50" : "border-slate-800 bg-[#06080d]"
        }`}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0c10] z-10 font-mono text-xs text-gray-500">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <Layers className="w-4 h-4 text-orange-500 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-bold uppercase tracking-wider text-orange-500 mb-1">Connecting to Gateway</p>
                <p className="text-[10px] text-gray-600">Please wait while the page is secure-tunneling...</p>
              </div>
            </div>
          )}
          
          <iframe
            id="custom-form-iframe"
            src={embedUrl}
            className="w-full h-full border-none"
            onLoad={() => setIsLoading(false)}
            title={title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
        </div>
      </div>
    </div>
  );
}
