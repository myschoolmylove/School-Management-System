import React, { useState, useEffect } from "react";
import { Search, Bell, Calendar, ArrowRight, MapPin, GraduationCap, ExternalLink, Sparkles, X, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, getDocFromServer, doc } from "firebase/firestore";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/src/lib/utils";

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
}

export default function Admissions() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<PublicAdmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<PublicAdmission | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    email: "",
    phone: "",
    class: "Class 1",
    message: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [displaySearch, setDisplaySearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

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
        setAdmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PublicAdmission[]);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Snapshot error:", err);
        setError("Failed to load admissions. You might need to sign in as an administrator.");
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredAdmissions = admissions.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    
    const content = `${item.title} ${item.location} ${item.desc} ${item.type}`.toLowerCase();
    
    const matchesSearch = searchWords.every(word => content.includes(word));
    const matchesFilter = activeFilter === "All" || item.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleSearch = () => {
    setSearchTerm(displaySearch);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    setIsApplying(true);

    try {
      await addDoc(collection(db, "public_applications"), {
        ...formData,
        admissionId: selectedAdmission.id,
        admissionTitle: selectedAdmission.title,
        status: "Received",
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedAdmission(null);
        setFormData({ studentName: "", parentName: "", email: "", phone: "", class: "Class 1", message: "" });
      }, 3000);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const seedAdmissions = async () => {
    if (!user) {
      alert("Please sign in to seed data.");
      return;
    }
    
    setIsSeeding(true);
    const dummyData = [
      { 
        title: "FCCU Admissions 2026 - Undergraduate", 
        date: "Sep 30, 2026", 
        deadline: "2026-09-30",
        type: "University", 
        location: "Lahore",
        desc: "Forman Christian College University invites applications for its world-class undergraduate programs. Legacy of excellence since 1864."
      },
      { 
        title: "LUMS - Undergraduate Admissions 2026", 
        date: "Feb 15, 2026", 
        deadline: "2026-02-15",
        type: "University", 
        location: "Lahore",
        desc: "Lahore University of Management Sciences (LUMS) is now accepting applications for its diverse range of undergraduate programs."
      },
      { 
        title: "NUST - Entrance Test (NET) 2026", 
        date: "Jun 20, 2026", 
        deadline: "2026-06-20",
        type: "University", 
        location: "Islamabad",
        desc: "National University of Sciences & Technology (NUST) invites applications for NET-III for Engineering and Computing programs."
      },
      { 
        title: "FAST-NUCES - Fall Admissions 2026", 
        date: "Jul 05, 2026", 
        deadline: "2026-07-05",
        type: "University", 
        location: "National",
        desc: "Admissions open for BS Computer Science, Software Engineering, and Data Science across all campuses."
      },
      { 
        title: "GIK Institute (GIKI) - Admissions 2026", 
        date: "Jun 15, 2026", 
        deadline: "2026-06-15",
        type: "University", 
        location: "Topi, KPK",
        desc: "Ghulam Ishaq Khan Institute of Engineering Sciences and Technology invites applications for its engineering and management programs."
      },
      { 
        title: "COMSATS University - Fall 2026", 
        date: "Jul 25, 2026", 
        deadline: "2026-07-25",
        type: "University", 
        location: "National",
        desc: "Admissions open for undergraduate and graduate programs in all campuses (Islamabad, Lahore, Abbottabad, etc.)."
      },
      { 
        title: "IBA Karachi - Undergraduate Admissions", 
        date: "May 10, 2026", 
        deadline: "2026-05-10",
        type: "University", 
        location: "Karachi",
        desc: "Institute of Business Administration (IBA) Karachi invites applications for its prestigious business and computer science programs."
      },
      { 
        title: "PIEAS - BS/MS Admissions 2026", 
        date: "Jun 30, 2026", 
        deadline: "2026-06-30",
        type: "University", 
        location: "Islamabad",
        desc: "Pakistan Institute of Engineering and Applied Sciences (PIEAS) invites applications for its top-ranked engineering programs."
      },
      { 
        title: "UET Lahore - Entrance Test 2026", 
        date: "Mar 15, 2026", 
        deadline: "2026-03-15",
        type: "University", 
        location: "Lahore",
        desc: "University of Engineering and Technology (UET) Lahore announces ECAT registration for engineering admissions."
      },
      { 
        title: "Aga Khan University (AKU) - MBBS 2026", 
        date: "Jun 01, 2026", 
        deadline: "2026-06-01",
        type: "University", 
        location: "Karachi",
        desc: "AKU invites applications for its world-renowned MBBS and Nursing programs."
      },
      { 
        title: "King Edward Medical University - Admissions", 
        date: "Oct 15, 2026", 
        deadline: "2026-10-15",
        type: "University", 
        location: "Lahore",
        desc: "Admissions for MBBS and Allied Health Sciences at Pakistan's oldest medical institution."
      },
      { 
        title: "Aitchison College - Admission 2026-27", 
        date: "Jan 31, 2026", 
        deadline: "2026-01-31",
        type: "School/College", 
        location: "Lahore",
        desc: "Aitchison College invites applications for K1, K2, and E2 levels for the upcoming academic session."
      },
      { 
        title: "Kinnaird College for Women - Undergraduate", 
        date: "Aug 10, 2026", 
        deadline: "2026-08-10",
        type: "University", 
        location: "Lahore",
        desc: "Kinnaird College invites applications for its prestigious undergraduate programs in Humanities, Social Sciences, and Professional Studies."
      },
      { 
        title: "University of the Punjab - Fall Admissions 2026", 
        date: "Aug 15, 2026", 
        deadline: "2026-08-15",
        type: "University", 
        location: "Lahore",
        desc: "Applications are invited for undergraduate and postgraduate programs in Engineering, Arts, and Sciences."
      },
      { 
        title: "Government College University (GCU) - Intermediate", 
        date: "Jul 10, 2026", 
        deadline: "2026-07-10",
        type: "College", 
        location: "Lahore",
        desc: "Admissions open for Pre-Medical, Pre-Engineering, and ICS programs for the session 2026-28."
      },
      { 
        title: "Lahore College for Women University (LCWU)", 
        date: "Sep 05, 2026", 
        deadline: "2026-09-05",
        type: "University", 
        location: "Lahore",
        desc: "Admissions open for Intermediate and Undergraduate programs for female students."
      },
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
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">Admissions <span className="text-emerald-600">2026</span></h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Find the best educational opportunities across Pakistan. Latest notices from top schools, colleges, and universities.</p>
        </div>

        {/* FCCU Featured Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl ring-1 ring-white/10"
        >
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 ring-1 ring-emerald-500/30">
                <Sparkles className="h-3 w-3" />
                Featured Institution
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                    <GraduationCap className="h-10 w-10 text-slate-900" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">FCCU Admissions 2026</h2>
                    <p className="text-emerald-400 font-mono text-xs font-bold tracking-widest uppercase">Forman Christian College University</p>
                  </div>
                </div>
                <p className="max-w-2xl text-slate-400 text-lg leading-relaxed">
                  Experience a world-class liberal arts education at one of South Asia's most prestigious institutions. 
                  Admissions are now open for Undergraduate, Intermediate, and Postgraduate programs. 
                  Legacy of excellence since 1864.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://www.fccollege.edu.pk/admissions/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-10 py-5 text-sm font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95"
              >
                Apply Online <ExternalLink className="h-4 w-4" />
              </a>
              <button 
                onClick={() => {
                  const el = document.getElementById('admissions-list');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-10 py-5 text-sm font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/10"
              >
                View Programs
              </button>
            </div>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute right-10 bottom-10 opacity-5">
            <GraduationCap className="h-64 w-64 text-white" />
          </div>
        </motion.div>

        {/* Search & Filter Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by institution, city, or program..."
                value={displaySearch}
                onChange={(e) => {
                  setDisplaySearch(e.target.value);
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full h-14 rounded-2xl border border-slate-200 bg-white pl-12 pr-32 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition-all active:scale-95"
              >
                Search
              </button>
            </div>
            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto no-scrollbar">
              {["All", "University", "College", "School"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeFilter === filter 
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="admissions-list" className="mt-16 flex flex-col gap-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Admissions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-rose-50 rounded-[2.5rem] border border-rose-100 p-8">
              <p className="text-rose-600 font-bold mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="rounded-xl bg-rose-600 px-8 py-3 text-sm font-bold text-white hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          ) : filteredAdmissions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300 mb-4">
                <Search className="h-10 w-10" />
              </div>
              <p className="text-slate-500 mb-4 font-bold">No matching admissions found.</p>
              {admissions.length === 0 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">The database is currently empty. If you are an administrator, you can seed the initial data.</p>
                  <button 
                    onClick={seedAdmissions} 
                    disabled={isSeeding}
                    className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                  >
                    {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isSeeding ? "Seeding..." : "Seed Live Data"}
                  </button>
                  {!user && <p className="text-[10px] text-amber-600 font-bold uppercase">Sign in required to seed data</p>}
                </div>
              )}
              {admissions.length > 0 && (
                <button onClick={() => { setDisplaySearch(""); setSearchTerm(""); setActiveFilter("All"); }} className="text-emerald-600 font-bold hover:underline">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            filteredAdmissions.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl md:flex-row md:items-center"
              >
                <div className="h-24 w-24 flex-shrink-0 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <GraduationCap className="h-10 w-10" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      {item.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                  <p className="text-slate-600 line-clamp-2">{item.desc}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-rose-600">
                      <Calendar className="h-4 w-4" />
                      Deadline: {item.deadline}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAdmission(item)}
                  className="rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 hover:scale-105 active:scale-95"
                >
                  Apply Now
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Application Modal */}
        <AnimatePresence>
          {selectedAdmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl rounded-[2.5rem] bg-white p-8 shadow-2xl overflow-hidden relative"
              >
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Application Submitted!</h3>
                    <p className="text-slate-500 max-w-sm">Your application for {selectedAdmission.title} has been received. We will contact you soon.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Apply for Admission</h3>
                        <p className="text-sm font-medium text-emerald-600">{selectedAdmission.title}</p>
                      </div>
                      <button onClick={() => setSelectedAdmission(null)} className="text-slate-400 hover:text-slate-600 p-2">
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Student Full Name</label>
                          <input
                            type="text"
                            required
                            value={formData.studentName}
                            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Parent/Guardian Name</label>
                          <input
                            type="text"
                            required
                            value={formData.parentName}
                            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Phone Number</label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Class/Program</label>
                          <input
                            type="text"
                            required
                            value={formData.class}
                            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Additional Message</label>
                          <textarea
                            rows={1}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5"
                          />
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 pt-4">
                        <button
                          disabled={isApplying}
                          className="w-full rounded-2xl bg-slate-900 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {isApplying ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : "Submit Application"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="mt-20 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 text-center">
          <Bell className="mx-auto h-12 w-12 text-emerald-600 animate-bounce" />
          <h3 className="mt-4 text-2xl font-bold text-slate-900">Never Miss an Update</h3>
          <p className="mt-2 text-slate-600">Subscribe to our newsletter to get the latest admission alerts directly in your inbox.</p>
          <div className="mt-8 flex max-w-md mx-auto gap-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
}
