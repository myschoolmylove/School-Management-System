import { Search, Trophy, Calendar, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Results() {
  const boards = [
    { name: 'BISE Lahore', date: 'Jul 15, 2026', status: 'Announced', type: 'Matric' },
    { name: 'BISE Gujranwala', date: 'Jul 20, 2026', status: 'Expected', type: 'Matric' },
    { name: 'BISE Multan', date: 'Aug 10, 2026', status: 'Expected', type: 'Inter' },
    { name: 'BISE Rawalpindi', date: 'Jul 15, 2026', status: 'Announced', type: 'Matric' },
    { name: 'BISE Karachi', date: 'Aug 25, 2026', status: 'Expected', type: 'Inter' },
    { name: 'MDCAT 2026', date: 'Sep 15, 2026', status: 'Upcoming', type: 'Medical' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">Board Results <span className="text-emerald-600">2026</span></h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Check your Matric, Inter, MDCAT, and NTS results instantly. Enter your roll number below to get started.</p>
        </div>

        {/* Search Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Enter Roll Number (e.g. 123456)"
              className="h-20 w-full rounded-[2rem] border-none bg-white pl-16 pr-44 text-xl text-slate-900 shadow-xl shadow-slate-200/50 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[1.5rem] bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95">
              Check Now
            </button>
          </div>
          <div className="mt-4 flex justify-center gap-4 text-sm font-medium text-slate-500">
            <span>Popular:</span>
            <button className="text-emerald-600 hover:underline">BISE Lahore</button>
            <button className="text-emerald-600 hover:underline">MDCAT</button>
            <button className="text-emerald-600 hover:underline">BISE GJR</button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board, idx) => (
            <motion.div 
              key={board.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Trophy className="h-6 w-6" />
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                  board.status === 'Announced' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {board.status}
                </span>
              </div>
              <h3 className="mt-6 text-2xl font-bold text-slate-900">{board.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">{board.type} Annual Examination</p>
              
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{board.date}</span>
              </div>

              <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 group-hover:shadow-lg">
                View Result <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
