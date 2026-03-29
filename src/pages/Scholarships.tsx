import { useState, useEffect } from "react";
import { Search, Trophy, Calendar, ArrowRight, X } from "lucide-react";
import { motion } from "motion/react";

const SCHOLARSHIPS = [
  { name: 'HEC Indigenous Scholarship', type: 'Fully Funded', deadline: 'Sep 30, 2026', desc: 'Apply now for the HEC Indigenous program for PhD studies in Pakistan.', url: 'https://www.hec.gov.pk/english/scholarships/Pakistan/Indigenous/Pages/default.aspx' },
  { name: 'PEEF Scholarship 2026', type: 'Merit Based', deadline: 'Oct 15, 2026', desc: 'Punjab Education Endowment Fund offers scholarships for undergraduate students.', url: 'https://peef.org.pk/' },
  { name: 'Commonwealth Scholarship', type: 'Fully Funded', deadline: 'Dec 01, 2026', desc: 'Study in the UK with the prestigious Commonwealth Scholarship program.', url: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-scholarships-for-developing-commonwealth-countries/' },
  { name: 'USAID Merit-Based Scholarship', type: 'Merit Based', deadline: 'Nov 15, 2026', desc: 'USAID offers scholarships for students in partner universities across Pakistan.', url: 'https://www.usaid.gov/pakistan/merit-and-needs-based-scholarship-program' },
  { name: 'Fulbright Scholarship', type: 'Fully Funded', deadline: 'May 15, 2026', desc: 'The Fulbright Program offers grants to study, teach and conduct research in the US.', url: 'https://usefp.org/scholarships/fulbright-degree.cfm' },
  { name: 'Chevening Scholarship', type: 'Fully Funded', deadline: 'Nov 01, 2026', desc: 'Chevening is the UK government’s international awards program for global leaders.', url: 'https://www.chevening.org/scholarship/pakistan/' },
];

export default function Scholarships() {
  const [searchTerm, setSearchTerm] = useState("");
  const [displaySearch, setDisplaySearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
      setDisplaySearch(queryParam);
    }
  }, []);

  const filteredScholarships = SCHOLARSHIPS.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    const content = `${s.name} ${s.type} ${s.desc}`.toLowerCase();
    return searchWords.every(word => content.includes(word));
  });

  const handleSearch = () => {
    setSearchTerm(displaySearch);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">Scholarships <span className="text-emerald-600">2026</span></h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Find the best local and international scholarships for Pakistani students. Your gateway to global education.</p>
        </div>

        {/* Search Bar */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search scholarships (e.g. HEC, PEEF, Fulbright)..."
              value={displaySearch}
              onChange={(e) => {
                setDisplaySearch(e.target.value);
                // We keep searchTerm updated for live search, but handleSearch will also be available
                setSearchTerm(e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-16 rounded-2xl border border-slate-200 bg-white pl-12 pr-40 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {displaySearch && (
                <button 
                  onClick={() => { setDisplaySearch(""); setSearchTerm(""); }}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <button 
                onClick={handleSearch}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-all active:scale-95"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {filteredScholarships.length > 0 ? (
            filteredScholarships.map((s, idx) => (
              <motion.div 
                key={s.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl"
              >
                <div className="inline-flex rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600">{s.type}</div>
                <a 
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4"
                >
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{s.name}</h3>
                </a>
                <p className="mt-2 text-slate-600">{s.desc}</p>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Deadline: {s.deadline}
                  </div>
                  <a 
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 text-center"
                  >
                    Apply Now
                  </a>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-slate-500 font-bold">No scholarships found matching "{displaySearch}"</p>
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
