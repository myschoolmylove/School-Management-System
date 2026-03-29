import { motion } from "motion/react";
import { GraduationCap, School, MessageCircle, BookOpen, Trophy, Bell, Calendar, Image as ImageIcon, ArrowRight, MapPin, Sparkles } from "lucide-react";
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

      {/* Hero Section - Split Layout */}
      <section className="relative min-h-[90vh] flex flex-col lg:flex-row overflow-hidden bg-white">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold tracking-widest uppercase mb-8">
              <Sparkles className="h-3 w-3" />
              Pakistan's #1 Education Portal
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 leading-[0.9] mb-8">
              Empowering <br />
              <span className="text-emerald-500 italic font-serif font-normal">Future</span> <br />
              Generations.
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-10 text-balance">
              Your comprehensive gateway for board results, admissions, scholarships, and professional school management. 
              Connecting millions of students across Pakistan.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/results"
                className="group relative inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition-all hover:bg-slate-800 hover:scale-105 active:scale-95"
              >
                Check Results
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/admissions"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-900 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                Explore Admissions
              </Link>
            </div>
            
            <div className="mt-16 flex items-center gap-8 pt-8 border-t border-slate-100">
              <div>
                <div className="text-2xl font-bold text-slate-900">500+</div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Schools</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">1M+</div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">24/7</div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Support</div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="flex-1 relative min-h-[400px] lg:min-h-0 bg-slate-100 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <img 
              src="https://picsum.photos/seed/pakistan-edu/1200/1600" 
              alt="Education in Pakistan" 
              className="h-full w-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent lg:from-white lg:via-transparent" />
          </motion.div>
          
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 glass-morphism p-6 rounded-3xl shadow-2xl hidden lg:block"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Latest Result</div>
                <div className="text-xs text-slate-500">BISE Lahore Inter Part 2</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 left-20 glass-morphism p-6 rounded-3xl shadow-2xl hidden lg:block"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Admissions Open</div>
                <div className="text-xs text-slate-500">LUMS Fall 2026</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Universities Section - Refined Grid */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4 font-serif italic">Premier Institutions</h2>
              <p className="text-lg text-slate-500">Explore the most renowned educational institutions in Pakistan, from historic colleges to modern research universities.</p>
            </div>
            <Link
              to="/admissions"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 group"
            >
              View all institutions
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "LUMS", location: "Lahore", type: "University", image: "https://picsum.photos/seed/lums-campus/800/1000", desc: "Excellence in business and social sciences." },
              { name: "NUST", location: "Islamabad", type: "University", image: "https://picsum.photos/seed/nust-campus/800/1000", desc: "Pakistan's leading engineering university." },
              { name: "IBA", location: "Karachi", type: "University", image: "https://picsum.photos/seed/iba-campus/800/1000", desc: "Premier business school in the heart of Karachi." },
            ].map((uni, idx) => (
              <motion.div
                key={uni.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] mb-6 shadow-sm group-hover:shadow-2xl transition-all duration-500">
                  <img 
                    src={uni.image} 
                    alt={uni.name} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <p className="text-white/80 text-sm mb-2">{uni.desc}</p>
                    <Link to={`/admissions?q=${uni.name}`} className="text-white font-bold flex items-center gap-2">
                      Apply Now <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="absolute top-6 left-6">
                    <span className="glass-morphism px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                      {uni.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{uni.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin className="h-3 w-3" />
                    {uni.location}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
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
