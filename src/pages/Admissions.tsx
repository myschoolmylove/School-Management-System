import { Search, Bell, Calendar, ArrowRight, MapPin, GraduationCap } from "lucide-react";
import { motion } from "motion/react";

export default function Admissions() {
  const admissions = [
    { 
      title: "University of the Punjab - Fall Admissions 2026", 
      date: "Aug 15, 2026", 
      type: "University", 
      location: "Lahore",
      desc: "Applications are invited for undergraduate and postgraduate programs in Engineering, Arts, and Sciences."
    },
    { 
      title: "Beaconhouse School System - Early Years 2026", 
      date: "Apr 30, 2026", 
      type: "School", 
      location: "National",
      desc: "Open house for Playgroup to Class 1. Experience our world-class learning environment."
    },
    { 
      title: "Government College University (GCU) - Intermediate", 
      date: "Jul 10, 2026", 
      type: "College", 
      location: "Lahore",
      desc: "Admissions open for Pre-Medical, Pre-Engineering, and ICS programs for the session 2026-28."
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">Admissions <span className="text-emerald-600">2026</span></h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">Find the best educational opportunities across Pakistan. Latest notices from top schools, colleges, and universities.</p>
        </div>

        <div className="mt-16 flex flex-col gap-8">
          {admissions.map((item, idx) => (
            <motion.div
              key={idx}
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
                    Deadline: {item.date}
                  </div>
                </div>
              </div>
              <button className="rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-800 hover:scale-105 active:scale-95">
                Apply Now
              </button>
            </motion.div>
          ))}
        </div>

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
