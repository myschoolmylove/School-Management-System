import React, { useState, useEffect } from "react";
import { Trophy, Calendar, ArrowRight, Search, User, Hash, School, Award, CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, writeBatch, onSnapshot } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { syncResultsWithAI } from "../services/geminiService";

interface PublicResult {
  id?: string;
  rollNo: string;
  studentName: string;
  fatherName: string;
  board: string;
  marks: number;
  totalMarks: number;
  grade: string;
  year: string;
  session: string;
  status: 'Pass' | 'Fail';
}

const BOARD_CARDS = [
  // Punjab Boards
  { name: 'BISE Lahore', date: 'Jul 15, 2026', status: 'Announced', type: 'Matric', url: 'https://www.biselahore.com/', resultUrl: 'https://result.biselahore.com/' },
  { name: 'BISE Gujranwala', date: 'Jul 20, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisegrw.edu.pk/', resultUrl: 'https://www.bisegrw.edu.pk/prev-years-result.html' },
  { name: 'BISE Multan', date: 'Aug 10, 2026', status: 'Expected', type: 'Inter', url: 'https://www.bisemultan.edu.pk/' },
  { name: 'BISE Rawalpindi', date: 'Jul 15, 2026', status: 'Announced', type: 'Matric', url: 'https://www.biserawalpindi.edu.pk/' },
  { name: 'BISE Faisalabad', date: 'Jul 25, 2026', status: 'Expected', type: 'Matric', url: 'http://www.bisefsd.edu.pk/' },
  { name: 'BISE Bahawalpur', date: 'Aug 05, 2026', status: 'Expected', type: 'Inter', url: 'https://www.bisebwp.edu.pk/' },
  { name: 'BISE D.G. Khan', date: 'Aug 12, 2026', status: 'Expected', type: 'Inter', url: 'https://www.bisedgkhan.edu.pk/' },
  { name: 'BISE Sahiwal', date: 'Jul 18, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisesahiwal.edu.pk/' },
  { name: 'BISE Sargodha', date: 'Jul 22, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisesargodha.edu.pk/' },
  
  // Sindh Boards
  { name: 'BIEK Karachi', date: 'Aug 25, 2026', status: 'Expected', type: 'Inter', url: 'https://biek.edu.pk/' },
  { name: 'BSEK Karachi', date: 'Jul 30, 2026', status: 'Expected', type: 'Matric', url: 'https://bsek.edu.pk/' },
  { name: 'BISE Hyderabad', date: 'Aug 20, 2026', status: 'Expected', type: 'Inter', url: 'https://biseh.edu.pk/' },
  { name: 'BISE Sukkur', date: 'Aug 15, 2026', status: 'Expected', type: 'Inter', url: 'https://www.bisesukkur.edu.pk/' },
  { name: 'BISE Larkana', date: 'Aug 18, 2026', status: 'Expected', type: 'Inter', url: 'https://www.biselrk.edu.pk/' },
  { name: 'BISE Mirpurkhas', date: 'Aug 22, 2026', status: 'Expected', type: 'Inter', url: 'https://bisempk.edu.pk/' },
  
  // KPK Boards
  { name: 'BISE Peshawar', date: 'Jul 10, 2026', status: 'Announced', type: 'Matric', url: 'https://www.bisep.com.pk/' },
  { name: 'BISE Abbottabad', date: 'Jul 12, 2026', status: 'Expected', type: 'Matric', url: 'https://www.biseatd.edu.pk/' },
  { name: 'BISE Mardan', date: 'Jul 14, 2026', status: 'Expected', type: 'Matric', url: 'https://web.bisemardan.edu.pk/' },
  { name: 'BISE Swat', date: 'Jul 16, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisesswat.edu.pk/' },
  { name: 'BISE Kohat', date: 'Jul 18, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisekohat.edu.pk/' },
  { name: 'BISE Bannu', date: 'Jul 20, 2026', status: 'Expected', type: 'Matric', url: 'https://www.biseb.edu.pk/' },
  { name: 'BISE Malakand', date: 'Jul 22, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisemalakand.edu.pk/' },
  { name: 'BISE D.I. Khan', date: 'Jul 24, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisedik.edu.pk/' },
  
  // Balochistan & Federal
  { name: 'BISE Quetta', date: 'Aug 30, 2026', status: 'Expected', type: 'Inter', url: 'https://www.bbiseqta.edu.pk/' },
  { name: 'FBISE Islamabad', date: 'Jul 05, 2026', status: 'Announced', type: 'Matric', url: 'https://www.fbise.edu.pk/' },
  { name: 'BISE Mirpur (AJK)', date: 'Aug 05, 2026', status: 'Expected', type: 'Inter', url: 'https://ajkbise.net/' },
];

export default function Results() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [displaySearch, setDisplaySearch] = useState("");
  
  // Individual Result Search State
  const [rollNo, setRollNo] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("BISE Lahore");
  const [selectedSession, setSelectedSession] = useState("Annual");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<PublicResult | null>(null);
  const [searchError, setSearchError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [boardCards, setBoardCards] = useState(BOARD_CARDS);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
      setDisplaySearch(queryParam);
    }

    // Sync board announcement dates from Firestore
    const unsubscribe = onSnapshot(collection(db, "public_result_announcements"), (snapshot) => {
      if (!snapshot.empty) {
        const syncedData = snapshot.docs.map(doc => doc.data());
        const updatedCards = BOARD_CARDS.map(card => {
          const aiData = syncedData.find(d => d.name === card.name);
          if (aiData) {
            return {
              ...card,
              date: aiData.date,
              status: aiData.status as any
            };
          }
          return card;
        });
        setBoardCards(updatedCards);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredBoards = boardCards.filter(board => {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    const content = `${board.name} ${board.type}`.toLowerCase();
    return searchWords.every(word => content.includes(word));
  });

  const handleSearch = () => {
    setSearchTerm(displaySearch);
  };

  const handleRollNoSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo) return;

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const q = query(
        collection(db, "public_results"), 
        where("rollNo", "==", rollNo),
        where("board", "==", selectedBoard),
        where("session", "==", selectedSession)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setSearchResult(querySnapshot.docs[0].data() as PublicResult);
      } else {
        setSearchError("No result found for this roll number and board.");
      }
    } catch (err) {
      console.error("Error searching result:", err);
      setSearchError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSyncWithAI = async () => {
    if (!user || user.email !== "abes.gujranwala@gmail.com") return;
    
    setIsSyncing(true);
    try {
      const boards = BOARD_CARDS.map(b => b.name);
      const latestData = await syncResultsWithAI(boards);
      
      if (latestData && latestData.length > 0) {
        // Update the local state for board cards with latest dates
        const updatedCards = BOARD_CARDS.map(card => {
          const aiData = latestData.find(d => d.name === card.name);
          if (aiData) {
            return {
              ...card,
              date: aiData.date,
              status: aiData.status as any
            };
          }
          return card;
        });
        setBoardCards(updatedCards);
        alert("Board announcement dates updated with the latest AI-synced data!");
      }
    } catch (err) {
      console.error("Error syncing with AI:", err);
      alert("Failed to sync with AI. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const seedResults = async () => {
    if (!user || user.email !== "abes.gujranwala@gmail.com") {
      alert("Only authorized admins can seed data.");
      return;
    }

    const dummyResults: PublicResult[] = [
      { rollNo: "123456", studentName: "Ahmed Ali", fatherName: "Muhammad Ali", board: "BISE Lahore", marks: 1045, totalMarks: 1100, grade: "A+", year: "2026", session: "Annual", status: "Pass" },
      { rollNo: "654321", studentName: "Sara Khan", fatherName: "Imran Khan", board: "BISE Lahore", marks: 980, totalMarks: 1100, grade: "A", year: "2026", session: "Annual", status: "Pass" },
      { rollNo: "112233", studentName: "Zainab Bibi", fatherName: "Abdul Rehman", board: "BISE Gujranwala", marks: 1010, totalMarks: 1100, grade: "A+", year: "2026", session: "Annual", status: "Pass" },
      { rollNo: "445566", studentName: "Hamza Sheikh", fatherName: "Bilal Sheikh", board: "FBISE Islamabad", marks: 1060, totalMarks: 1100, grade: "A+", year: "2026", session: "Annual", status: "Pass" },
      { rollNo: "778899", studentName: "Ayesha Malik", fatherName: "Sajid Malik", board: "BISE Multan", marks: 950, totalMarks: 1100, grade: "A", year: "2026", session: "Annual", status: "Pass" },
    ];

    try {
      for (const res of dummyResults) {
        await addDoc(collection(db, "public_results"), {
          ...res,
          createdAt: serverTimestamp()
        });
      }
      alert("Sample results seeded successfully!");
    } catch (err) {
      console.error("Error seeding results:", err);
      alert("Failed to seed results.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles className="h-4 w-4" />
            Official Portals
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">Board Results <span className="text-emerald-600">2026</span></h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Access official educational board results instantly. Find your board or search your individual result below.</p>
          
          {user?.email === "abes.gujranwala@gmail.com" && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <button 
                onClick={handleSyncWithAI}
                disabled={isSyncing}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isSyncing ? "AI Syncing..." : "Sync Results with AI"}
              </button>
              <button 
                onClick={seedResults}
                className="text-xs text-slate-400 hover:text-emerald-600 transition-colors"
              >
                (Admin: Seed Sample Results)
              </button>
            </div>
          )}
        </div>

        {/* Individual Result Search Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 max-w-4xl mx-auto rounded-[2.5rem] bg-white p-8 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Search Individual Result</h2>
              <p className="text-slate-500 text-sm">Enter your roll number to view detailed marksheet</p>
            </div>
          </div>

          <form onSubmit={handleRollNoSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Board</label>
              <div className="relative">
                <School className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select 
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  {BOARD_CARDS.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Roll Number</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  required
                  type="text"
                  placeholder="e.g. 123456"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Session</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select 
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="Annual">Annual 2026</option>
                  <option value="Supplementary">Supplementary 2026</option>
                  <option value="Annual 2025">Annual 2025</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <button 
                type="submit"
                disabled={isSearching}
                className="flex-1 rounded-2xl bg-emerald-600 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {isSearching ? "Searching..." : "Check Result"}
              </button>
              {boardCards.find(b => b.name === selectedBoard)?.resultUrl && (
                <a 
                  href={boardCards.find(b => b.name === selectedBoard)?.resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-2xl bg-slate-900 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <ExternalLink className="h-5 w-5" />
                  Official Portal
                </a>
              )}
            </div>
          </form>

          {/* Result Display */}
          <AnimatePresence>
            {searchError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 p-6 rounded-2xl bg-red-50 text-red-600 text-sm font-medium flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5" />
                  {searchError}
                </div>
                {boardCards.find(b => b.name === selectedBoard)?.resultUrl && (
                  <a 
                    href={boardCards.find(b => b.name === selectedBoard)?.resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors whitespace-nowrap"
                  >
                    Search on Official Portal <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </motion.div>
            )}

            {searchResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-12 p-8 rounded-[2rem] bg-slate-900 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Trophy className="h-32 w-32" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-10 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold">{searchResult.studentName}</h3>
                        <p className="text-slate-400 font-medium">S/O {searchResult.fatherName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-2",
                        searchResult.status === 'Pass' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        {searchResult.status === 'Pass' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {searchResult.status}
                      </div>
                      <p className="text-slate-400 text-sm">{searchResult.board} - {searchResult.year}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Roll Number</p>
                      <p className="text-xl font-bold">{searchResult.rollNo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Marks Obtained</p>
                      <p className="text-xl font-bold text-emerald-400">{searchResult.marks} / {searchResult.totalMarks}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Grade</p>
                      <p className="text-xl font-bold">{searchResult.grade}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Percentage</p>
                      <p className="text-xl font-bold">{((searchResult.marks / searchResult.totalMarks) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Board Portals Section */}
        <div className="mt-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Official Board Portals</h2>
              <p className="text-slate-500 mt-2">Direct links to all educational boards of Pakistan</p>
              {user?.email === "abes.gujranwala@gmail.com" && (
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button 
                    onClick={handleSyncWithAI}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {isSyncing ? "Syncing Dates..." : "Sync Announcement Dates"}
                  </button>
                  <button 
                    onClick={seedResults}
                    className="text-xs text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    (Admin: Seed Sample Results)
                  </button>
                </div>
              )}
            </div>
            
            {/* Search Bar */}
            <div className="w-full max-w-md">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search board (e.g. Lahore, Karachi)..."
                  value={displaySearch}
                  onChange={(e) => {
                    setDisplaySearch(e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full h-14 rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredBoards.length > 0 ? (
              filteredBoards.map((board, idx) => (
                <motion.div 
                  key={board.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <span className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                      board.status === 'Announced' ? 'bg-emerald-100 text-emerald-600' : 
                      board.status === 'Expected' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                    )}>
                      {board.status}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-slate-900">{board.name}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{board.type} Annual Examination</p>
                  
                  <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{board.date}</span>
                  </div>

                  <a 
                    href={board.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-emerald-600 group-hover:shadow-lg"
                  >
                    Official Website <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-slate-500 font-bold">No boards found matching "{displaySearch}"</p>
                <button 
                  onClick={() => { setDisplaySearch(""); setSearchTerm(""); }}
                  className="mt-4 text-emerald-600 font-bold hover:underline"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
