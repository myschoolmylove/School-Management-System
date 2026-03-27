import { Trophy, Calendar, ArrowRight, Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/src/lib/utils";

const BOARD_CARDS = [
  // Punjab Boards
  { name: 'BISE Lahore', date: 'Jul 15, 2026', status: 'Announced', type: 'Matric', url: 'https://www.biselahore.com/' },
  { name: 'BISE Gujranwala', date: 'Jul 20, 2026', status: 'Expected', type: 'Matric', url: 'https://www.bisegrw.edu.pk/' },
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
  const [searchTerm, setSearchTerm] = useState("");
  const [displaySearch, setDisplaySearch] = useState("");

  const filteredBoards = BOARD_CARDS.filter(board => {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    const content = `${board.name} ${board.type}`.toLowerCase();
    return searchWords.every(word => content.includes(word));
  });

  const handleSearch = () => {
    setSearchTerm(displaySearch);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">Board Results <span className="text-emerald-600">2026</span></h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Access official educational board results instantly. Find your board and visit the official portal.</p>
        </div>

        {/* Search Bar */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search board (e.g. Lahore, Karachi, Federal)..."
              value={displaySearch}
              onChange={(e) => {
                setDisplaySearch(e.target.value);
                // Also live search for better UX, but button is there as requested
                setSearchTerm(e.target.value);
              }}
              className="w-full h-16 rounded-2xl border border-slate-200 bg-white pl-12 pr-32 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
            <button 
              onClick={handleSearch}
              className="absolute right-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-all active:scale-95"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 group-hover:shadow-lg"
                >
                  View Result <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
  );
}

