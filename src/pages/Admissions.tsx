import React, { useState, useEffect } from "react";
import { Bell, Calendar, MapPin, GraduationCap, ExternalLink, Sparkles, Loader2, Send, User, RefreshCw, Terminal, Globe, X, Search, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocFromServer, doc, Timestamp, writeBatch, getDocs, deleteDoc } from "firebase/firestore";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/src/lib/utils";
import { syncAdmissionsWithAI, searchInstitutionsWithAI, SyncAdmission } from "../services/geminiService";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface PublicAdmission {
  id: string;
  title: string;
  date: string;
  type: string;
  location: string;
  desc: string;
  deadline: string;
  applyUrl?: string;
  isFuture?: boolean;
}

export default function Admissions() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<PublicAdmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const isSeedingRef = React.useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [displaySearch, setDisplaySearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleSearching, setIsGoogleSearching] = useState(false);
  const [googleResults, setGoogleResults] = useState<SyncAdmission[]>([]);
  const [showGoogleConsole, setShowGoogleConsole] = useState(false);

  const cities = ["All Cities", "Lahore", "Karachi", "Islamabad", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Peshawar", "Quetta", "Sialkot", "National"];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
      setDisplaySearch(queryParam);
    }
  }, []);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err) {
        if(err instanceof Error && err.message.includes('the client is offline')) {
          setError("The database is currently offline. Please check your internet connection.");
        }
      }
    };
    testConnection();

    const q = query(collection(db, "public_admissions"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PublicAdmission[];
        setAdmissions(data);
        setIsLoading(false);
        setError(null);
        
        // Auto-seed if empty and not already seeding
        // Only seed if user is super admin (ernestvdavid@gmail.com or abes.gujranwala@gmail.com)
        const adminEmails = ["ernestvdavid@gmail.com", "abes.gujranwala@gmail.com"];
        if (data.length === 0 && !isSeedingRef.current && 
            auth.currentUser?.email && adminEmails.includes(auth.currentUser.email)) {
          seedAdmissions();
        }
      },
      (err) => {
        console.error("Snapshot error:", err);
        setError("Failed to load admissions. You might need to sign in as an administrator.");
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const filteredAdmissions = admissions.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    
    const content = `${item.title} ${item.location} ${item.desc} ${item.type}`.toLowerCase();
    
    const matchesSearch = searchWords.every(word => content.includes(word));
    const matchesFilter = activeFilter === "All" 
      ? true 
      : activeFilter === "Future" 
        ? item.isFuture === true 
        : item.type === activeFilter;
    const matchesCity = selectedCity === "All Cities" || item.location.toLowerCase().includes(selectedCity.toLowerCase());
    return matchesSearch && matchesFilter && matchesCity;
  });

  const handleApply = (admission: PublicAdmission | SyncAdmission) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(admission.title + " Admissions 2026")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleGoogleSearch = async () => {
    if (!displaySearch.trim()) return;
    setIsGoogleSearching(true);
    setShowGoogleConsole(true);
    try {
      const results = await searchInstitutionsWithAI(displaySearch);
      setGoogleResults(results);
    } catch (err) {
      console.error("Error searching with Google AI:", err);
    } finally {
      setIsGoogleSearching(false);
    }
  };

  const handleSearch = () => {
    setSearchTerm(displaySearch);
    if (displaySearch.trim().length > 0) {
      setActiveFilter("All");
    }
  };

  const handleSyncWithAI = async () => {
    if (!user || user.email !== "abes.gujranwala@gmail.com") return;
    
    setIsSyncing(true);
    try {
      const institutions = ["Punjab Group of Colleges", "KIPS Colleges", "Superior University", "FCCU", "LUMS", "NUST", "FAST-NUCES", "GIKI", "Aitchison College", "AKU", "IBA Karachi", "PIEAS", "UET Lahore", "KEMU", "Kinnaird College", "Punjab University", "GCU Lahore", "LCWU", "Beaconhouse", "The City School", "COMSATS"];
      const latestData = await syncAdmissionsWithAI(institutions);
      
      if (latestData && latestData.length > 0) {
        // Clear existing admissions first
        const snapshot = await getDocs(collection(db, "public_admissions"));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Add new data
        for (const item of latestData) {
          await addDoc(collection(db, "public_admissions"), {
            ...item,
            createdAt: serverTimestamp()
          });
        }
        alert("Database successfully updated with the latest AI-synced data!");
      }
    } catch (err) {
      console.error("Error syncing with AI:", err);
      alert("Failed to sync with AI. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const seedAdmissions = async () => {
    if (isSeedingRef.current) return;
    
    // Check authorization before seeding
    const adminEmails = ["ernestvdavid@gmail.com", "abes.gujranwala@gmail.com"];
    if (!auth.currentUser?.email || !adminEmails.includes(auth.currentUser.email)) {
      alert("You are not authorized to seed data. Please sign in as a super admin.");
      return;
    }

    setIsSeeding(true);
    isSeedingRef.current = true;
    const dummyData = [
      { 
        title: "Punjab Group of Colleges (PGC) - Admissions 2026", 
        date: "Aug 01, 2026", 
        deadline: "2026-08-01",
        type: "College", 
        location: "National",
        applyUrl: "https://pgc.edu/admissions/",
        desc: "Pakistan's largest educational network invites applications for Intermediate (FSc, ICS, ICom, FA) programs. Join the toppers' network."
      },
      { 
        title: "KIPS Colleges - Intermediate Admissions 2026", 
        date: "Jul 15, 2026", 
        deadline: "2026-07-15",
        type: "College", 
        location: "National",
        applyUrl: "https://kips.edu.pk/admissions/",
        desc: "KIPS Colleges announce admissions for Pre-Medical, Pre-Engineering, and ICS. Excellence in conceptual learning and board exam preparation."
      },
      { 
        title: "Superior University - Fall Admissions 2026", 
        date: "Sep 15, 2026", 
        deadline: "2026-09-15",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://superior.edu.pk/admissions/",
        desc: "Superior University invites applications for its innovative 3U1M program. Empowering students through entrepreneurship and excellence."
      },
      { 
        title: "FCCU Admissions 2026 - Undergraduate", 
        date: "Sep 30, 2026", 
        deadline: "2026-09-30",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://www.fccollege.edu.pk/admissions/",
        desc: "Forman Christian College University invites applications for its world-class undergraduate programs. Legacy of excellence since 1864."
      },
      { 
        title: "LUMS - Undergraduate Admissions 2026", 
        date: "Feb 15, 2026", 
        deadline: "2026-02-15",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://admissions.lums.edu.pk/",
        desc: "Lahore University of Management Sciences (LUMS) is now accepting applications for its diverse range of undergraduate programs."
      },
      { 
        title: "NUST - Entrance Test (NET) 2026", 
        date: "Jun 20, 2026", 
        deadline: "2026-06-20",
        type: "University", 
        location: "Islamabad",
        applyUrl: "https://ugadmissions.nust.edu.pk/",
        desc: "National University of Sciences & Technology (NUST) invites applications for NET-III for Engineering and Computing programs."
      },
      { 
        title: "FAST-NUCES - Fall Admissions 2026", 
        date: "Jul 05, 2026", 
        deadline: "2026-07-05",
        type: "University", 
        location: "National",
        applyUrl: "https://admissions.nu.edu.pk/",
        desc: "Admissions open for BS Computer Science, Software Engineering, and Data Science across all campuses."
      },
      { 
        title: "GIK Institute (GIKI) - Admissions 2026", 
        date: "Jun 15, 2026", 
        deadline: "2026-06-15",
        type: "University", 
        location: "Topi, KPK",
        applyUrl: "https://giki.edu.pk/admissions/",
        desc: "Ghulam Ishaq Khan Institute of Engineering Sciences and Technology invites applications for its engineering and management programs."
      },
      { 
        title: "Aitchison College - Admission 2026-27", 
        date: "Jan 31, 2026", 
        deadline: "2026-01-31",
        type: "School", 
        location: "Lahore",
        applyUrl: "https://www.aitchison.edu.pk/admissions",
        desc: "Aitchison College invites applications for K1, K2, and E2 levels for the upcoming academic session."
      },
      { 
        title: "Aga Khan University (AKU) - MBBS 2026", 
        date: "Jun 01, 2026", 
        deadline: "2026-06-01",
        type: "University", 
        location: "Karachi",
        applyUrl: "https://www.aku.edu/admissions/",
        desc: "AKU invites applications for its world-renowned MBBS and Nursing programs."
      },
      { 
        title: "IBA Karachi - Undergraduate Admissions", 
        date: "May 10, 2026", 
        deadline: "2026-05-10",
        type: "University", 
        location: "Karachi",
        applyUrl: "https://admissions.iba.edu.pk/",
        desc: "Institute of Business Administration (IBA) Karachi invites applications for its prestigious business and computer science programs."
      },
      { 
        title: "PIEAS - BS/MS Admissions 2026", 
        date: "Jun 30, 2026", 
        deadline: "2026-06-30",
        type: "University", 
        location: "Islamabad",
        applyUrl: "http://admissions.pieas.edu.pk/",
        desc: "Pakistan Institute of Engineering and Applied Sciences (PIEAS) invites applications for its top-ranked engineering programs."
      },
      { 
        title: "UET Lahore - Entrance Test 2026", 
        date: "Mar 15, 2026", 
        deadline: "2026-03-15",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://admission.uet.edu.pk/",
        desc: "University of Engineering and Technology (UET) Lahore announces ECAT registration for engineering admissions."
      },
      { 
        title: "King Edward Medical University - Admissions", 
        date: "Oct 15, 2026", 
        deadline: "2026-10-15",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://kemu.edu.pk/admissions",
        desc: "Admissions for MBBS and Allied Health Sciences at Pakistan's oldest medical institution."
      },
      { 
        title: "Kinnaird College for Women - Undergraduate", 
        date: "Aug 10, 2026", 
        deadline: "2026-08-10",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://www.kinnaird.edu.pk/admissions/",
        desc: "Kinnaird College invites applications for its prestigious undergraduate programs in Humanities, Social Sciences, and Professional Studies."
      },
      { 
        title: "University of the Punjab - Fall Admissions 2026", 
        date: "Aug 15, 2026", 
        deadline: "2026-08-15",
        type: "University", 
        location: "Lahore",
        applyUrl: "http://admissions.pu.edu.pk/",
        desc: "Applications are invited for undergraduate and postgraduate programs in Engineering, Arts, and Sciences."
      },
      { 
        title: "Government College University (GCU) - Intermediate", 
        date: "Jul 10, 2026", 
        deadline: "2026-07-10",
        type: "College", 
        location: "Lahore",
        applyUrl: "https://gcu.edu.pk/admissions/",
        desc: "Admissions open for Pre-Medical, Pre-Engineering, and ICS programs for the session 2026-28."
      },
      { 
        title: "Lahore College for Women University (LCWU)", 
        date: "Sep 05, 2026", 
        deadline: "2026-09-05",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://lcwu.edu.pk/admissions.html",
        desc: "Admissions open for Intermediate and Undergraduate programs for female students."
      },
      { 
        title: "Beaconhouse School System - Admissions 2026", 
        date: "Mar 01, 2026", 
        deadline: "2026-03-01",
        type: "School", 
        location: "National",
        applyUrl: "https://www.beaconhouse.net/admissions/",
        desc: "Admissions open for Early Years to A-Levels across Pakistan. Empowering students through global standards of education."
      },
      { 
        title: "The City School - Fall Admissions 2026", 
        date: "Apr 15, 2026", 
        deadline: "2026-04-15",
        type: "School", 
        location: "National",
        applyUrl: "https://thecityschool.edu.pk/admissions/",
        desc: "Join one of the largest private school networks in Pakistan. Quality education from Nursery to O/A Levels."
      },
      { 
        title: "COMSATS University - Fall 2026", 
        date: "Jul 25, 2026", 
        deadline: "2026-07-25",
        type: "University", 
        location: "National",
        applyUrl: "https://www.comsats.edu.pk/admissions/",
        desc: "Admissions open for Undergraduate and Graduate programs in all campuses (Islamabad, Lahore, Abbottabad, etc.)."
      },
      { 
        title: "Upcoming: LUMS Spring 2027", 
        date: "Jan 15, 2027", 
        deadline: "2027-01-15",
        type: "University", 
        location: "Lahore",
        applyUrl: "https://admissions.lums.edu.pk/",
        desc: "Spring 2027 admissions cycle will begin soon. Stay tuned for official dates.",
        isFuture: true
      },
      { 
        title: "Future: KIPS Entry Test Prep 2027", 
        date: "Dec 01, 2026", 
        deadline: "2026-12-01",
        type: "College", 
        location: "National",
        applyUrl: "https://kips.edu.pk/",
        desc: "Advance registration for 2027 entry test preparation sessions.",
        isFuture: true
      }
    ];

    try {
      for (const item of dummyData) {
        await addDoc(collection(db, "public_admissions"), item);
      }
      alert("Live data seeded successfully!");
    } catch (err) {
      console.error("Error seeding data:", err);
      handleFirestoreError(err, OperationType.WRITE, "public_admissions");
    } finally {
      setIsSeeding(false);
      isSeedingRef.current = false;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
              <Sparkles className="h-3 w-3" />
              Academic Year 2026
            </div>

            {user?.email === "abes.gujranwala@gmail.com" && (
              <div className="flex justify-center mb-6">
                <button 
                  onClick={handleSyncWithAI}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isSyncing ? "AI Syncing..." : "Sync with AI"}
                </button>
              </div>
            )}
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[0.9]">
              Find Your <br />
              <span className="text-emerald-600 italic font-serif font-normal">Opportunity.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed text-balance">
              Explore the most comprehensive database of admissions across Pakistan. 
              From elite universities to top-tier colleges, your next academic chapter starts here.
            </p>
          </motion.div>

          {/* Google Console UI */}
          <AnimatePresence>
            {showGoogleConsole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 max-w-4xl mx-auto overflow-hidden"
              >
                <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
                  <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Google AI Search Console</span>
                    </div>
                    <button 
                      onClick={() => setShowGoogleConsole(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-6 max-h-[400px] overflow-y-auto no-scrollbar space-y-4">
                    {isGoogleSearching ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                        <p className="text-slate-400 font-mono text-xs animate-pulse">Searching educational institutes across Pakistan...</p>
                      </div>
                    ) : googleResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {googleResults.map((result, idx) => (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx}
                            className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl hover:border-emerald-500/50 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-white font-bold text-sm leading-tight">{result.title}</h3>
                              <span className="text-[8px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                                {result.type}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[10px] line-clamp-2 mb-3 font-mono">{result.desc}</p>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                                <Calendar className="h-3 w-3" />
                                <span>Deadline: {result.deadline}</span>
                              </div>
                              <button 
                                onClick={() => handleApply(result)}
                                className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                              >
                                Apply Now <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-slate-500 font-mono text-xs">No educational institutes found for this query.</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-800/50 px-6 py-2 border-t border-slate-800">
                    <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                      Status: {isGoogleSearching ? "Searching..." : "Idle"} | Results: {googleResults.length}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-12 max-w-4xl mx-auto"
          >
            <div className="glass-morphism p-2 rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Search by institution, city, or program..." 
                  value={displaySearch}
                  onChange={(e) => setDisplaySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-transparent px-6 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
                />
              </div>
              <div className="flex gap-1 p-1 bg-slate-100/50 rounded-2xl overflow-x-auto no-scrollbar">
                {["All", "University", "College", "School", "Future"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                      activeFilter === filter 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex-shrink-0">
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent px-6 py-4 text-slate-900 font-medium focus:outline-none border-l border-slate-200"
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSearch}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:bg-slate-800 active:scale-95"
                >
                  Search
                </button>
                <button 
                  onClick={handleGoogleSearch}
                  disabled={isGoogleSearching}
                  className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold transition-all hover:bg-slate-50 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {isGoogleSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Google
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-50/30 to-transparent pointer-events-none" />
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        {/* FCCU Featured Card - Redesigned */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl mb-24"
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 backdrop-blur-md border border-white/10">
                <Sparkles className="h-3 w-3" />
                Featured Institution
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[0.9]">
                  FCCU <br />
                  <span className="text-emerald-400 italic font-serif font-normal">Admissions</span> <br />
                  is Now Open.
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                  Join a legacy of excellence since 1864. Experience South Asia's premier liberal arts education in the heart of Lahore.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <a 
                  href="https://www.fccollege.edu.pk/admissions/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-10 py-5 text-sm font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95"
                >
                  Apply Online <ExternalLink className="h-4 w-4" />
                </a>
                <button 
                  onClick={() => {
                    const el = document.getElementById('admissions-list');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-10 py-5 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/10"
                >
                  View Programs
                </button>
              </div>
            </div>
            
            <div className="relative aspect-square lg:aspect-auto lg:h-[400px] rounded-[2rem] overflow-hidden group">
              <img 
                src="https://picsum.photos/seed/fccu-campus/1200/800" 
                alt="FCCU Campus" 
                className="h-full w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">Location</div>
                <div className="text-xl font-bold">Lahore, Pakistan</div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />
        </motion.div>

        {/* Admissions List */}
        <div id="admissions-list" className="space-y-12">
          <div className="flex items-center justify-between border-b border-slate-100 pb-8">
            <h2 className="text-3xl font-bold text-slate-900 font-serif italic">Latest Notices</h2>
            <div className="text-sm font-medium text-slate-400">
              Showing {filteredAdmissions.length} results
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Synchronizing Database</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-rose-50 rounded-[3rem] border border-rose-100 p-12">
              <p className="text-rose-600 font-bold text-xl mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="rounded-full bg-rose-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white hover:bg-rose-700 transition-all"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredAdmissions.length === 0 ? (
            <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mx-auto text-slate-200 mb-8 shadow-sm">
                <GraduationCap className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No matches found</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
              
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(""); setDisplaySearch(""); }}
                  className="text-emerald-600 font-bold hover:underline mb-8 block mx-auto"
                >
                  Clear search for "{searchTerm}"
                </button>
              )}

              {auth.currentUser?.email && ["ernestvdavid@gmail.com", "abes.gujranwala@gmail.com"].includes(auth.currentUser.email) && (
                <div className="space-y-6">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Administrator Controls</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={seedAdmissions} 
                      disabled={isSeeding}
                      className="rounded-full bg-slate-100 px-10 py-5 text-sm font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                    >
                      {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isSeeding ? "Populating..." : "Reset to Default"}
                    </button>
                    <button 
                      onClick={handleSyncWithAI} 
                      disabled={isSyncing}
                      className="rounded-full bg-slate-900 px-10 py-5 text-sm font-bold uppercase tracking-widest text-white hover:bg-emerald-600 shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                    >
                      {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      {isSyncing ? "Syncing..." : "Sync Latest Data with AI"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    AI Sync will use Gemini to search official websites and update the database with the latest 2026 admission details.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filteredAdmissions.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex flex-col lg:flex-row gap-8 rounded-[2.5rem] bg-white p-8 border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:border-emerald-100"
                >
                  <div className="h-32 w-full lg:w-32 flex-shrink-0 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors duration-500">
                    <GraduationCap className="h-12 w-12" />
                  </div>
                  
                  <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:items-center">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          {item.type}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.location}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 leading-relaxed line-clamp-2 max-w-2xl">
                        {item.desc}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-6 lg:min-w-[200px]">
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Deadline</div>
                        <div className="flex items-center gap-2 text-rose-500 font-bold">
                          <Calendar className="h-4 w-4" />
                          {item.deadline}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleApply(item)}
                        className="w-full sm:w-auto rounded-2xl bg-slate-900 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      >
                        Apply Now <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter Section - Redesigned */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 relative overflow-hidden rounded-[3rem] bg-emerald-50 p-12 sm:p-20 text-center"
        >
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center mx-auto text-emerald-600 shadow-xl mb-10 rotate-12">
              <Bell className="h-10 w-10 animate-pulse" />
            </div>
            <h3 className="text-4xl font-bold text-slate-900 mb-4 font-serif italic">Stay Ahead of the Curve</h3>
            <p className="text-lg text-slate-600 mb-12">
              Subscribe to our elite notification circle and receive the latest admission alerts, scholarship opportunities, and academic news directly in your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-[2rem] shadow-2xl">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 bg-transparent px-6 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
              <button className="rounded-[1.5rem] bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                Join Circle
              </button>
            </div>
            <p className="mt-6 text-xs text-slate-400 font-medium">
              Join 50,000+ students already receiving our updates. No spam, ever.
            </p>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />
        </motion.div>
      </div>
    </div>
  );
}
