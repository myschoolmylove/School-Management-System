import { motion } from "motion/react";
import { Search, GraduationCap, School, MessageCircle, BookOpen, Trophy, Bell, Calendar, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/src/lib/utils";

export default function Home() {
  return (
    <div className="flex flex-col relative">
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/923001234567" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 transition-all hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-8 w-8" />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold border-2 border-white">1</span>
      </a>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-24 text-white sm:py-32">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://picsum.photos/seed/education/1920/1080" 
            alt="Education Background" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Empowering Pakistan's <span className="text-emerald-400">Education Ecosystem</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              Your one-stop portal for board results, admissions, scholarships, and professional school management. 
              Connecting students, parents, and schools across Pakistan.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/results"
                className="rounded-full bg-emerald-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Check Results
              </Link>
              <Link
                to="/admissions"
                className="rounded-full bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Admissions
              </Link>
              <Link
                to="/pricing"
                className="rounded-full bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Pricing
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links / Search */}
      <section className="mx-auto -mt-16 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[2.5rem] bg-white p-2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] ring-1 ring-black/5"
        >
          <div className="flex flex-col gap-2 p-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search"
                placeholder="Search board results, schools, or scholarships..."
                className="h-20 w-full rounded-[2rem] border-none bg-slate-50 pl-16 pr-36 text-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[1.5rem] bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95">
                Search
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6 px-10 py-5">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Trending
            </span>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {["Matric", "Inter", "Scholarships", "Admissions"].map((tag) => (
                <button 
                  key={tag}
                  className="whitespace-nowrap rounded-full border border-slate-100 bg-white px-5 py-2 text-xs font-bold text-slate-600 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything You Need in One Place</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              We've built a comprehensive ecosystem to support students and schools at every step.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Board Results",
                desc: "Real-time updates for all Pakistan boards. Get results via WhatsApp instantly.",
                icon: Trophy,
                color: "bg-amber-100 text-amber-600",
              },
              {
                title: "School Management",
                desc: "Finance, teachers, attendance, and results publishing for schools of all sizes.",
                icon: School,
                color: "bg-emerald-100 text-emerald-600",
              },
              {
                title: "Admissions & News",
                desc: "Stay updated with the latest admissions, scholarships, and educational news.",
                icon: Bell,
                color: "bg-blue-100 text-blue-600",
              },
              {
                title: "WhatsApp Integration",
                desc: "Automated alerts, result bots, and fee reminders directly on WhatsApp.",
                icon: MessageCircle,
                color: "bg-green-100 text-green-600",
              },
              {
                title: "Career Guidance",
                desc: "Expert advice on choosing the right path after Matric, Inter, or Graduation.",
                icon: GraduationCap,
                color: "bg-purple-100 text-purple-600",
              },
              {
                title: "Resource Library",
                desc: "Access past papers, notes, and study materials for all classes.",
                icon: BookOpen,
                color: "bg-rose-100 text-rose-600",
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className={cn("inline-flex rounded-xl p-3", feature.color)}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-slate-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* School Gallery & Events */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            {/* Events Calendar */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Upcoming Events</h2>
                  <p className="mt-2 text-slate-600">Stay updated with school activities and holidays.</p>
                </div>
                <Link to="/events" className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:underline">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Annual Sports Day", date: "Apr 15, 2026", type: "Event", school: "City School LHR" },
                  { title: "Eid-ul-Fitr Holidays", date: "Mar 30, 2026", type: "Holiday", school: "All Schools" },
                  { title: "Final Term Exams", date: "May 10, 2026", type: "Exam", school: "Beaconhouse GJR" },
                ].map((event, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <span className="text-xs font-bold uppercase">{event.date.split(' ')[0]}</span>
                      <span className="text-2xl font-bold">{event.date.split(' ')[1].replace(',', '')}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-slate-900">{event.title}</h4>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          event.type === "Holiday" ? "bg-rose-50 text-rose-600" : 
                          event.type === "Exam" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {event.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{event.school}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* School Gallery */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">School Gallery</h2>
                  <p className="mt-2 text-slate-600">Glimpses of academic and co-curricular excellence.</p>
                </div>
                <Link to="/gallery" className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:underline">
                  View Gallery <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/5 bg-slate-200"
                  >
                    <img 
                      src={`https://picsum.photos/seed/school-gallery-${i}/600/450`} 
                      alt="Gallery" 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-4">
                      <p className="text-sm font-bold text-white">Annual Day Celebration</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-emerald-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <MessageCircle className="mx-auto h-16 w-16 opacity-20" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Join Our WhatsApp Channel</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-50">
            Get instant updates on board results, admissions, and scholarships directly on your phone. 
            Free, fast, and reliable.
          </p>
          <div className="mt-10">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-emerald-600 shadow-xl transition-transform hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-6 w-6" />
              Join Channel Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
