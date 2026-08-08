import React, { useEffect, useState } from "react";

import { ShieldAlert, BookOpen, Users, Phone, Mail, FileText, Copy, Check, Info } from "lucide-react";

import { dbService } from "../lib/dbService";

import { GeneralRule, Contact } from "../types";

import { useTheme } from "../lib/ThemeContext";



export default function PublicRulesContact() {

  const { isWhiteBg } = useTheme();

  const [rules, setRules] = useState<GeneralRule[]>([]);

  const [contacts, setContacts] = useState<Contact[]>([]);

  const [loading, setLoading] = useState(true);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");



  useEffect(() => {

    async function loadData() {

      try {

        const [rulesList, contactsList] = await Promise.all([

          dbService.getGeneralRules(),

          dbService.getContacts()

        ]);

        setRules(rulesList);

        setContacts(contactsList);

      } catch (err) {

        console.error("Failed to load rules or contacts: ", err);

      } finally {

        setLoading(false);

      }

    }

    loadData();

  }, []);



  const handleCopy = (text: string, id: string) => {

    navigator.clipboard.writeText(text);

    setCopiedId(id);

    setTimeout(() => setCopiedId(null), 2000);

  };



  return (

    <div className={`bg-transparent min-h-screen py-12 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        

        {/* Header Title */}

        <div className="mb-12 text-center md:text-left">

          <h1 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-2">

            FESTIVAL CHARTER

          </h1>

          <h2 className={`text-3xl sm:text-4xl font-extrabold uppercase tracking-tight ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>

            RULES & ORGANIZING COMMITTEE

          </h2>

          <p className={`text-xs font-mono max-w-xl mt-2 ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>

            Review sports guidelines, anti-ragging mandates, campus rules, and reach out to designated event directors.

          </p>

        </div>



        {loading ? (

          <div className={`text-center py-20 font-mono text-xs ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>

            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />

            <span>Synchronizing committee databases...</span>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            

            {/* Rules Block: 7 cols */}

            <div className="lg:col-span-7 space-y-6">

              <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isWhiteBg ? 'border-gray-300 text-gray-900' : 'border-gray-800 text-white'}`}>

                <BookOpen className="w-5 h-5 text-orange-500" />

                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">

                  General Code of Conduct

                </h3>

              </div>



              {rules.length === 0 ? (

                <div className={`glass-panel border p-8 rounded-3xl font-mono text-xs text-center shadow-lg ${isWhiteBg ? 'border-gray-300 bg-gray-50 text-gray-600' : 'border-white/[0.05] text-gray-500'}`}>

                  <Info className={`w-10 h-10 mx-auto mb-3 ${isWhiteBg ? 'text-gray-400' : 'text-gray-700'}`} />

                  <span>No general rules published. Please verify standard guidelines.</span>

                </div>

              ) : (

                <div className="space-y-4">

                  {rules.map((rule) => (

                    <div 

                      key={rule.id}

                      className={`glass-panel hover:glass-panel-glow border p-6 rounded-3xl transition-all duration-300 space-y-3 shadow-md ${isWhiteBg ? 'border-gray-300 bg-white' : 'border-white/[0.05]'}`}

                    >

                      <h4 className={`text-xs font-bold font-mono tracking-wider uppercase flex items-center gap-2 text-orange-400`}>

                        <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />

                        <span>{rule.title}</span>

                      </h4>

                      <p className={`text-xs font-mono leading-relaxed whitespace-pre-line pl-6 border-l ${isWhiteBg ? 'text-gray-700 border-gray-300' : 'text-gray-400 border-white/[0.06]'}`}>

                        {rule.content}

                      </p>

                    </div>

                  ))}

                </div>

              )}

            </div>



            {/* Organizing Committee: 5 cols */}

            <div className="lg:col-span-5 space-y-6">

              <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isWhiteBg ? 'border-gray-300 text-gray-900' : 'border-white/[0.06] text-white'}`}>

                <Users className="w-5 h-5 text-orange-500" />

                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">

                  Committee Directory

                </h3>

              </div>



              {/* Filter Buttons */}

              <div className="flex flex-wrap gap-2 mb-4">

                {/* Gender Filter */}

                <div className={`flex rounded-lg overflow-hidden border ${isWhiteBg ? 'border-gray-300' : 'border-gray-800'}`}>

                  <button

                    onClick={() => setGenderFilter('all')}

                    className={`px-3 py-1.5 text-xs font-mono transition-all ${genderFilter === 'all' ? 'bg-orange-500 text-white' : isWhiteBg ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-[#0d0f12] text-gray-400 hover:text-white'}`}

                  >

                    All

                  </button>

                  <button

                    onClick={() => setGenderFilter('male')}

                    className={`px-3 py-1.5 text-xs font-mono transition-all ${genderFilter === 'male' ? 'bg-orange-500 text-white' : isWhiteBg ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-[#0d0f12] text-gray-400 hover:text-white'}`}

                  >

                    Boys

                  </button>

                  <button

                    onClick={() => setGenderFilter('female')}

                    className={`px-3 py-1.5 text-xs font-mono transition-all ${genderFilter === 'female' ? 'bg-orange-500 text-white' : isWhiteBg ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-[#0d0f12] text-gray-400 hover:text-white'}`}

                  >

                    Girls

                  </button>

                </div>



                {/* Category Filter */}

                <select

                  value={categoryFilter}

                  onChange={(e) => setCategoryFilter(e.target.value)}

                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border outline-none cursor-pointer ${isWhiteBg ? 'bg-white border-gray-300 text-gray-700' : 'bg-[#0d0f12] border-gray-800 text-gray-400'}`}

                >

                  <option value="all">All Categories</option>

                  <option value="General Coordinator">General</option>

                  <option value="Sports Coordinator">Sports</option>

                  <option value="Discipline Coordinator">Discipline</option>

                  <option value="Food Coordinator">Food</option>

                  <option value="Medical Coordinator">Medical</option>

                  <option value="Logistics Coordinator">Logistics</option>

                  <option value="Media Coordinator">Media</option>

                  <option value="Technical Coordinator">Technical</option>

                </select>

              </div>



              {contacts.length === 0 ? (

                <div className={`glass-panel border p-8 rounded-3xl font-mono text-xs text-center shadow-lg ${isWhiteBg ? 'border-gray-300 bg-gray-50 text-gray-600' : 'border-white/[0.05] text-gray-500'}`}>

                  <Info className={`w-10 h-10 mx-auto mb-3 ${isWhiteBg ? 'text-gray-400' : 'text-gray-700'}`} />

                  <span>No coordinators published in committee roster yet.</span>

                </div>

              ) : (

                <>

                  {/* Main Coordinators (Pinned at Top) */}

                  {contacts.filter(co => 

                    (co.enabled === undefined || co.enabled !== false) && 

                    co.isMainCoordinator === true && 

                    (genderFilter === 'all' || co.gender === genderFilter) &&

                    (categoryFilter === 'all' || co.category === categoryFilter)

                  ).length > 0 && (

                    <div className="mb-6">

                      <h4 className={`text-xs font-bold uppercase tracking-wider font-mono mb-3 ${isWhiteBg ? 'text-gray-700' : 'text-gray-400'}`}>

                        ⭐ Main Coordinators

                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {contacts.filter(co => 

                          (co.enabled === undefined || co.enabled !== false) && 

                          co.isMainCoordinator === true && 

                          (genderFilter === 'all' || co.gender === genderFilter) &&

                          (categoryFilter === 'all' || co.category === categoryFilter)

                        ).map((co) => (

                          <div 

                            key={co.id}

                            className={`glass-panel hover:glass-panel-glow border rounded-3xl overflow-hidden transition-all duration-300 flex flex-col font-mono text-xs shadow-md ring-2 ring-orange-500/30 ${isWhiteBg ? 'border-gray-300 bg-white' : 'border-white/[0.05]'}`}

                          >

                            {/* Photo frame - fixed aspect ratio, crops smartly from top */}

                            <div className={`relative w-full aspect-[4/5] overflow-hidden ${isWhiteBg ? 'bg-orange-100' : 'bg-orange-600/10'}`}>

                              {co.imageUrl ? (

                                <img

                                  src={co.imageUrl}

                                  alt={co.name}

                                  className="w-full h-full object-cover"

                                  style={{ objectPosition: "center top" }}

                                />

                              ) : (

                                <div className="w-full h-full flex items-center justify-center">

                                  <Users className={`w-12 h-12 ${isWhiteBg ? 'text-orange-400' : 'text-orange-500/40'}`} />

                                </div>

                              )}

                              <div className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t ${isWhiteBg ? 'from-black/30 to-transparent' : 'from-black/85 to-transparent'}`} />

                            </div>



                            <div className={`p-4 flex-1 flex flex-col ${isWhiteBg ? 'bg-white' : ''}`}>

                              <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>

                                {co.designation}

                              </span>

                              <h4 className={`font-extrabold text-sm uppercase tracking-wide mb-3 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>

                                {co.name}

                              </h4>



                              <div className={`grid grid-cols-1 gap-2 text-[10px] border-t pt-3 mt-auto ${isWhiteBg ? 'border-gray-300 text-gray-700' : 'border-white/[0.05] text-gray-400'}`}>

                                

                                {/* Copy Phone */}

                                <button

                                  onClick={() => handleCopy(co.phone, `${co.id}_p`)}

                                  className={`flex items-center gap-1.5 transition-all text-left truncate cursor-pointer outline-none ${isWhiteBg ? 'hover:text-orange-500' : 'hover:text-orange-400'}`}

                                >

                                  <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />

                                  <span className="truncate">{co.phone}</span>

                                  {copiedId === `${co.id}_p` ? (

                                    <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />

                                  ) : (

                                    <Copy className={`w-3.5 h-3.5 shrink-0 ml-auto ${isWhiteBg ? 'text-gray-500' : 'text-gray-600'}`} />

                                  )}

                                </button>



                                {/* Copy Email */}

                                <button

                                  onClick={() => handleCopy(co.email, `${co.id}_e`)}

                                  className={`flex items-center gap-1.5 transition-all text-left truncate cursor-pointer outline-none ${isWhiteBg ? 'hover:text-orange-500' : 'hover:text-orange-400'}`}

                                >

                                  <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />

                                  <span className="truncate">{co.email}</span>

                                  {copiedId === `${co.id}_e` ? (

                                    <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />

                                  ) : (

                                    <Copy className={`w-3.5 h-3.5 shrink-0 ml-auto ${isWhiteBg ? 'text-gray-500' : 'text-gray-600'}`} />

                                  )}

                                </button>



                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  )}



                  {/* Other Coordinators */}

                  {contacts.filter(co => 

                    (co.enabled === undefined || co.enabled !== false) && 

                    co.isMainCoordinator !== true && 

                    (genderFilter === 'all' || co.gender === genderFilter) &&

                    (categoryFilter === 'all' || co.category === categoryFilter)

                  ).length > 0 && (

                    <div>

                      <h4 className={`text-xs font-bold uppercase tracking-wider font-mono mb-3 ${isWhiteBg ? 'text-gray-700' : 'text-gray-400'}`}>

                        📋 Coordinators

                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {contacts.filter(co => 

                          (co.enabled === undefined || co.enabled !== false) && 

                          co.isMainCoordinator !== true && 

                          (genderFilter === 'all' || co.gender === genderFilter) &&

                          (categoryFilter === 'all' || co.category === categoryFilter)

                        ).map((co) => (

                          <div 

                            key={co.id}

                            className={`glass-panel hover:glass-panel-glow border rounded-3xl overflow-hidden transition-all duration-300 flex flex-col font-mono text-xs shadow-md ${isWhiteBg ? 'border-gray-300 bg-white' : 'border-white/[0.05]'}`}

                          >

                            {/* Photo frame - fixed aspect ratio, crops smartly from top */}

                            <div className={`relative w-full aspect-[4/5] overflow-hidden ${isWhiteBg ? 'bg-orange-100' : 'bg-orange-600/10'}`}>

                              {co.imageUrl ? (

                                <img

                                  src={co.imageUrl}

                                  alt={co.name}

                                  className="w-full h-full object-cover"

                                  style={{ objectPosition: "center top" }}

                                />

                              ) : (

                                <div className="w-full h-full flex items-center justify-center">

                                  <Users className={`w-12 h-12 ${isWhiteBg ? 'text-orange-400' : 'text-orange-500/40'}`} />

                                </div>

                              )}

                              <div className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t ${isWhiteBg ? 'from-black/30 to-transparent' : 'from-black/85 to-transparent'}`} />

                            </div>



                            <div className={`p-4 flex-1 flex flex-col ${isWhiteBg ? 'bg-white' : ''}`}>

                              <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${isWhiteBg ? 'text-gray-600' : 'text-gray-500'}`}>

                                {co.designation}

                              </span>

                              <h4 className={`font-extrabold text-sm uppercase tracking-wide mb-3 ${isWhiteBg ? 'text-gray-900' : 'text-white'}`}>

                                {co.name}

                              </h4>



                              <div className={`grid grid-cols-1 gap-2 text-[10px] border-t pt-3 mt-auto ${isWhiteBg ? 'border-gray-300 text-gray-700' : 'border-white/[0.05] text-gray-400'}`}>

                                

                                {/* Copy Phone */}

                                <button

                                  onClick={() => handleCopy(co.phone, `${co.id}_p`)}

                                  className={`flex items-center gap-1.5 transition-all text-left truncate cursor-pointer outline-none ${isWhiteBg ? 'hover:text-orange-500' : 'hover:text-orange-400'}`}

                                >

                                  <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />

                                  <span className="truncate">{co.phone}</span>

                                  {copiedId === `${co.id}_p` ? (

                                    <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />

                                  ) : (

                                    <Copy className={`w-3.5 h-3.5 shrink-0 ml-auto ${isWhiteBg ? 'text-gray-500' : 'text-gray-600'}`} />

                                  )}

                                </button>



                                {/* Copy Email */}

                                <button

                                  onClick={() => handleCopy(co.email, `${co.id}_e`)}

                                  className={`flex items-center gap-1.5 transition-all text-left truncate cursor-pointer outline-none ${isWhiteBg ? 'hover:text-orange-500' : 'hover:text-orange-400'}`}

                                >

                                  <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />

                                  <span className="truncate">{co.email}</span>

                                  {copiedId === `${co.id}_e` ? (

                                    <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />

                                  ) : (

                                    <Copy className={`w-3.5 h-3.5 shrink-0 ml-auto ${isWhiteBg ? 'text-gray-500' : 'text-gray-600'}`} />

                                  )}

                                </button>



                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                    </div>

                  )}

                </>

              )}

            </div>

          </div>

        )}

      </div>

    </div>

  );

}

