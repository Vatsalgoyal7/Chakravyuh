import React, { useEffect, useState } from "react";
import { dbService } from "../lib/dbService";
import { AboutSection } from "../types";
import {
  Building2,
  GraduationCap,
  MapPin,
  Target,
  Lightbulb,
  Trophy,
  Users,
  ExternalLink,
} from "lucide-react";

export default function PublicAbout() {
  const [about, setAbout] = useState<AboutSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const data = await dbService.getAboutData();
        setAbout(data);
      } catch (error) {
        console.error("Failed to load About data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAbout();
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-gray-400 animate-pulse">
          Loading About Section...
        </p>
      </section>
    );
  }

  if (!about) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-red-400">
          About information not available.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden pb-20">

      {/* ================= HERO SECTION ================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">

        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">

          {/* COLLEGE LOGO */}
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl border border-orange-500/30 bg-white flex items-center justify-center p-5 shrink-0 shadow-xl shadow-orange-500/5">

            {about.logoUrl ? (
              <img
                src={about.logoUrl}
                alt={`${about.collegeName} Logo`}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="w-16 h-16 text-orange-500" />
            )}

          </div>

          {/* COLLEGE TITLE */}
          <div className="text-center md:text-left">

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 text-xs font-mono uppercase tracking-widest mb-5">
              <GraduationCap className="w-4 h-4" />
              About the Institution
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-orange-500 leading-tight">
              {about.collegeName}
            </h1>

            <p className="text-gray-400 mt-4 text-sm md:text-base max-w-2xl leading-relaxed">
              Excellence in Education • Innovation • Leadership • Sportsmanship
            </p>

          </div>

        </div>

        {/* DESCRIPTION */}
        <div className="mt-12 max-w-5xl">

          <p className="text-lg text-gray-300 leading-relaxed">
            {about.description}
          </p>

          {/* INFORMATION BADGES */}
          <div className="flex flex-wrap gap-4 mt-8">

            {/* Established */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-orange-500/30 transition-all">

              <Building2 className="text-orange-500 w-5 h-5 shrink-0" />

              <div>
                <p className="text-xs text-gray-500">
                  Established
                </p>

                <p className="text-white font-semibold">
                  {about.establishedYear}
                </p>
              </div>

            </div>

            {/* Location */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-orange-500/30 transition-all">

              <MapPin className="text-orange-500 w-5 h-5 shrink-0" />

              <div>
                <p className="text-xs text-gray-500">
                  Location
                </p>

                <p className="text-white font-semibold">
                  {about.location}
                </p>
              </div>

            </div>

            {/* Affiliation */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:border-orange-500/30 transition-all">

              <GraduationCap className="text-orange-500 w-5 h-5 shrink-0" />

              <div>
                <p className="text-xs text-gray-500">
                  Affiliation
                </p>

                <p className="text-white font-semibold">
                  Dr. A.P.J. Abdul Kalam Technical University
                </p>
              </div>

            </div>

          </div>

          {/* CUSTOM USEFUL LINKS & LOCATIONS */}
          {about.customLinks && about.customLinks.filter(l => l.enabled !== false).length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-8">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-orange-500" />
                Useful Links & Locations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {about.customLinks.filter(l => l.enabled !== false).map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-orange-500/10 hover:border-orange-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-sm font-bold text-white group-hover:text-orange-400 transition-colors mb-1">
                        <span className="truncate">{link.title}</span>
                        <ExternalLink className="w-4 h-4 text-orange-500 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      {link.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {link.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-orange-500 font-mono mt-3 font-semibold tracking-wider uppercase">
                      Open Link &rarr;
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>


      {/* ================= VISION & MISSION ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="grid md:grid-cols-2 gap-6">

          {/* VISION */}
          <div className="p-8 rounded-3xl border border-orange-500/20 bg-orange-500/[0.04] hover:border-orange-500/40 transition-all">

            <div className="flex items-center gap-3 mb-5">

              <div className="p-3 rounded-xl bg-orange-500/10">
                <Target className="text-orange-500 w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold text-white">
                Our Vision
              </h2>

            </div>

            <p className="text-gray-400 leading-relaxed">
              {about.vision}
            </p>

          </div>


          {/* MISSION */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-orange-500/30 transition-all">

            <div className="flex items-center gap-3 mb-5">

              <div className="p-3 rounded-xl bg-orange-500/10">
                <Lightbulb className="text-orange-500 w-6 h-6" />
              </div>

              <h2 className="text-2xl font-bold text-white">
                Our Mission
              </h2>

            </div>

            <ul className="space-y-3">

              {about.mission.map((item, index) => (

                <li
                  key={index}
                  className="flex gap-3 text-gray-400"
                >

                  <span className="text-orange-500 shrink-0 text-xl leading-none">
                    •
                  </span>

                  <span>
                    {item}
                  </span>

                </li>

              ))}

            </ul>

          </div>

        </div>

      </div>


      {/* ================= SPORTS QUOTE ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="relative p-8 md:p-10 rounded-3xl border border-orange-500/20 bg-orange-500/[0.05] overflow-hidden">

          <div className="absolute right-0 bottom-0 opacity-5">
            <Trophy className="w-48 h-48 text-orange-500" />
          </div>

          <div className="relative">

            <div className="flex items-center gap-3 mb-4">

              <Trophy className="text-orange-500 w-6 h-6" />

              <span className="text-sm uppercase tracking-widest text-orange-400 font-mono">
                The Spirit of Chakravyuh
              </span>

            </div>

            <p className="text-2xl md:text-3xl text-orange-400 italic max-w-4xl">
              &ldquo;{about.sportsQuote}&rdquo;
            </p>

          </div>

        </div>

      </div>


      {/* ================= LEADERSHIP ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center gap-3 mb-8">

          <Users className="text-orange-500 w-7 h-7" />

          <h2 className="text-3xl font-bold text-white">
            Leadership &amp; Sports Administration
          </h2>

        </div>


        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {about.profiles?.map((profile) => (

            <div
              key={profile.id}
              className="rounded-3xl border border-white/10 overflow-hidden bg-[#12141a]/40 hover:border-orange-500/40 transition-all group"
            >

              {/* IMAGE CONTAINER */}
              <div className="w-full min-h-[300px] max-h-[520px] bg-black/20 flex items-center justify-center overflow-hidden">

                {profile.photoUrl ? (

                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="w-full h-auto max-h-[520px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";

                      const fallback =
                        img.parentElement?.querySelector(
                          ".image-fallback"
                        ) as HTMLElement | null;

                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />

                ) : null}


                {/* FALLBACK */}
                <div
                  className={`image-fallback ${
                    profile.photoUrl ? "hidden" : "flex"
                  } w-full min-h-[300px] items-center justify-center bg-gradient-to-br from-orange-500/10 to-transparent`}
                >

                  <span className="text-7xl font-bold text-orange-500/20">
                    {profile.name?.charAt(0) || "?"}
                  </span>

                </div>

              </div>


              {/* PROFILE DETAILS */}
              <div className="p-6">

                <h3 className="text-orange-500 text-xl font-bold">
                  {profile.title}
                </h3>

                <p className="text-white mt-2 font-semibold text-lg">
                  {profile.name}
                </p>

                {profile.quote && (

                  <p className="text-gray-400 italic text-sm mt-4 border-t border-white/5 pt-4 leading-relaxed">
                    &ldquo;{profile.quote}&rdquo;
                  </p>

                )}

              </div>

            </div>

          ))}

        </div>

      </div>


      {/* ================= COLLEGE WEBSITE LINK ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        <a
          href="http://imsec.ac.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors text-sm font-mono"
        >

          Visit Official College Website

          <ExternalLink className="w-4 h-4" />

        </a>

      </div>

    </section>
  );
}