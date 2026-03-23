import React, { useState, useMemo, useEffect } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  CreditCard, 
  Bell, 
  Settings, 
  ChevronRight, 
  Download, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageCircle,
  BookOpen,
  Languages,
  Lock,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Award,
  Table as TableIcon,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const studentData = {
  name: "Ali Ahmad",
  rollNo: "101",
  class: "Class 10-A",
  attendance: { present: 85, absent: 5, late: 2 },
  attendanceHistory: [
    { date: "2026-03-22", status: "Present" },
    { date: "2026-03-21", status: "Absent", alertSent: true },
    { date: "2026-03-20", status: "Present" },
    { date: "2026-03-19", status: "Late" },
    { date: "2026-03-18", status: "Present" },
  ],
  results: [
    { subject: "Mathematics", marks: 85, total: 100, grade: "A" },
    { subject: "English", marks: 78, total: 100, grade: "B+" },
    { subject: "Physics", marks: 92, total: 100, grade: "A+" },
    { subject: "Chemistry", marks: 88, total: 100, grade: "A" },
    { subject: "Computer Science", marks: 95, total: 100, grade: "A+" },
  ],
  fees: [
    { month: "March 2026", amount: 3500, status: "Paid", date: "2026-03-05", voucherId: "V-2026-03-101" },
    { month: "April 2026", amount: 3500, status: "Unpaid", date: "-", voucherId: "V-2026-04-101" },
  ],
  homework: [
    { id: "1", subject: "Mathematics", title: "Algebraic Expressions", description: "Complete exercises 4.1 to 4.3 from the textbook. Focus on quadratic equations and their applications in real-world scenarios.", dueDate: "2026-03-25", status: "Pending" },
    { id: "2", subject: "Physics", title: "Newton's Laws", description: "Write a summary of the three laws of motion with examples. Include diagrams for each law to illustrate the forces acting on objects.", dueDate: "2026-03-26", status: "Completed" },
    { id: "3", subject: "English", title: "Essay Writing", description: "Write a 500-word essay on 'The Impact of Technology on Education'. Ensure proper structure: Introduction, Body, and Conclusion.", dueDate: "2026-03-28", status: "Pending" },
  ],
  notices: [
    { id: "1", title: "Parent-Teacher Meeting", date: "2026-03-30", content: "The monthly PTM is scheduled for next Monday. Please ensure your presence to discuss your child's progress." },
    { id: "2", title: "Spring Break Holidays", date: "2026-04-05", content: "School will remain closed from April 5th to April 12th for Spring Break." },
  ]
};

const COLORS = ['#10b981', '#f43f5e', '#f59e0b'];

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  icon?: any;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, icon: Icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {Icon && <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></div>}
          <span className="font-bold text-slate-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="border-t border-slate-100 p-5 bg-slate-50/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const translations = {
  en: {
    dashboard: "Dashboard",
    attendance: "Attendance",
    results: "Results",
    fees: "Fees",
    homework: "Homework",
    settings: "Settings",
    welcome: "Welcome back,",
    studentInfo: "Student Information",
    rollNo: "Roll No",
    class: "Class",
    present: "Present",
    absent: "Absent",
    late: "Late",
    detailedHistory: "Detailed History",
    alertStatus: "Alert Status",
    whatsappAlert: "WhatsApp Alert Received",
    dueDate: "Due Date",
    status: "Status",
    amount: "Amount",
    month: "Month",
    action: "Action",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    updatePassword: "Update Password",
    notices: "Notices",
    timetable: "Timetable",
    dateSheet: "Date Sheet",
  },
  ur: {
    dashboard: "ڈیش بورڈ",
    attendance: "حاضری",
    results: "نتائج",
    fees: "فیس",
    homework: "ہوم ورک",
    settings: "ترتیبات",
    welcome: "خوش آمدید،",
    studentInfo: "طالب علم کی معلومات",
    rollNo: "رول نمبر",
    class: "کلاس",
    present: "حاضر",
    absent: "غیر حاضر",
    late: "لیٹ",
    detailedHistory: "تفصیلی تاریخ",
    alertStatus: "الرٹ کی صورتحال",
    whatsappAlert: "واٹس ایپ الرٹ موصول ہوا",
    dueDate: "آخری تاریخ",
    status: "صورتحال",
    amount: "رقم",
    month: "مہینہ",
    action: "عمل",
    changePassword: "پاس ورڈ تبدیل کریں",
    currentPassword: "موجودہ پاس ورڈ",
    newPassword: "نیا پاس ورڈ",
    updatePassword: "پاس ورڈ اپ ڈیٹ کریں",
    notices: "نوٹس",
    timetable: "ٹائم ٹیبل",
    dateSheet: "ڈیٹ شیٹ",
  }
};

export default function ParentPortal() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [lang, setLang] = useState<"en" | "ur">("en");
  const { profile } = useAuth();
  const t = translations[lang];

  const sidebarItems = [
    { name: "Overview", label: t.dashboard, icon: LayoutDashboard },
    { name: "Results", label: t.results, icon: FileText },
    { name: "Timetable", label: t.timetable, icon: TableIcon },
    { name: "Date Sheet", label: t.dateSheet, icon: FileSpreadsheet },
    { name: "Settings", label: t.settings, icon: Settings },
  ];

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [dateSheetData, setDateSheetData] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedChild = children[selectedChildIndex];
  const currentStudent = selectedChild;

  useEffect(() => {
    if (!profile?.schoolId || profile.role !== 'parent') return;

    // Fetch children linked to this parent
    // We use parentUsername or parentUid. Since we implemented virtual emails based on username,
    // the profile.username or profile.name should match.
    const parentId = profile.username || profile.name;
    const qChildren = query(
      collection(db, "schools", profile.schoolId, "students"),
      where("parentUsername", "==", parentId)
    );

    const unsubChildren = onSnapshot(qChildren, (snapshot) => {
      const childList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childList);
      setIsLoading(false);
    });

    // Fetch school-wide notices
    const qNotices = query(
      collection(db, "schools", profile.schoolId, "events"),
      where("type", "in", ["Notice", "Event", "Holiday"])
    );
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubChildren();
      unsubNotices();
    };
  }, [profile]);

  useEffect(() => {
    if (!selectedChild || !profile?.schoolId) return;

    // Fetch Timetable for the student's class
    const qTimetable = query(
      collection(db, "schools", profile.schoolId, "timetables"),
      where("classId", "==", selectedChild.class)
    );
    const unsubTimetable = onSnapshot(qTimetable, (snapshot) => {
      setTimetableData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Date Sheet for the student's class
    const qDateSheet = query(
      collection(db, "schools", profile.schoolId, "datesheets"),
      where("classId", "==", selectedChild.class)
    );
    const unsubDateSheet = onSnapshot(qDateSheet, (snapshot) => {
      setDateSheetData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTimetable();
      unsubDateSheet();
    };
  }, [selectedChild, profile?.schoolId]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      );
    }

    if (children.length === 0) {
      return (
        <div className="flex h-[60vh] flex-col items-center justify-center text-center">
          <div className="rounded-full bg-slate-100 p-6">
            <GraduationCap className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">No Children Linked</h3>
          <p className="mt-2 max-w-xs text-slate-500">Please contact the school administration to link your children to your account.</p>
        </div>
      );
    }

    // Mock results if not present in DB yet, or use real ones if we had a results collection
    const results = currentStudent.results || [
      { subject: "Mathematics", marks: 0, total: 100, grade: "N/A" },
      { subject: "English", marks: 0, total: 100, grade: "N/A" },
    ];

    const resultsChartData = results.map((r: any) => ({
      subject: r.subject.split(' ')[0],
      marks: r.marks
    }));

    switch (activeTab) {
      case "Overview":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: t.results, value: currentStudent.grade || "A Grade", icon: Award, color: "blue", trend: "Top 10% of class" },
                { label: "Notices", value: `${notices.length} New`, icon: Bell, color: "purple", trend: "Check latest updates" },
                { label: "Class", value: currentStudent.class, icon: GraduationCap, color: "emerald", trend: `Section ${currentStudent.section}` }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                      stat.color === "emerald" ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" :
                      stat.color === "blue" ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100" :
                      stat.color === "amber" ? "bg-amber-50 text-amber-600 group-hover:bg-amber-100" :
                      "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                    )}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    {stat.trend}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Performance Chart */}
              <div className="lg:col-span-3 rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Academic Performance</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" /> Marks
                    </span>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resultsChartData}>
                      <defs>
                        <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="marks" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMarks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Notices */}
              <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">School Notices</h3>
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-4">
                  {notices.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">No new notices from school.</p>
                  ) : notices.map((notice) => (
                    <div key={notice.id} className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{notice.title}</h4>
                          <p className="mt-1 text-xs text-slate-500">{notice.date}</p>
                        </div>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      </div>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">{notice.content || notice.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                <div className="mt-6 space-y-6">
                  {[
                    { title: "Result Published", desc: "Latest results are now available", icon: FileText, color: "purple", time: "Recently" },
                    { title: "Timetable Updated", desc: "New class schedule is active", icon: TableIcon, color: "blue", time: "Recently" }
                  ].map((activity, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        activity.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                        activity.color === "blue" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      )}>
                        <activity.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900">{activity.title}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{activity.time}</span>
                        </div>
                        <p className="text-xs text-slate-500">{activity.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case "Attendance":
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Attendance Calendar</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase">{t.present}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase">{t.absent}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 pb-2">{day}</div>
                  ))}
                  {Array.from({ length: 31 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        "flex h-14 flex-col items-center justify-center rounded-xl text-sm font-bold transition-all border border-transparent",
                        i % 7 === 6 ? "bg-slate-50 text-slate-300" : 
                        i % 10 === 0 ? "bg-rose-50 text-rose-600 border-rose-100" : 
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}
                    >
                      <span>{i + 1}</span>
                      <span className="text-[8px] opacity-60">{i % 7 === 6 ? "OFF" : i % 10 === 0 ? "ABS" : "PRE"}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Monthly Stats</h3>
                  <div className="mt-6 space-y-4">
                    {[
                      { label: "Working Days", value: "24", color: "slate" },
                      { label: "Present", value: "22", color: "emerald" },
                      { label: "Absent", value: "1", color: "rose" },
                      { label: "Late", value: "1", color: "amber" }
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                        <span className={cn(
                          "text-sm font-black",
                          stat.color === "emerald" ? "text-emerald-600" :
                          stat.color === "rose" ? "text-rose-600" :
                          stat.color === "amber" ? "text-amber-600" : "text-slate-900"
                        )}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Attendance Rate</p>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                    </div>
                    <p className="mt-2 text-right text-sm font-black text-emerald-600">92%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h3 className="text-lg font-bold text-slate-900">{t.detailedHistory}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Check-in</th>
                      <th className="px-6 py-4">{t.alertStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {studentData.attendanceHistory.map((record) => (
                      <tr key={record.date} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{record.date}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                            record.status === "Present" ? "bg-emerald-50 text-emerald-600" :
                            record.status === "Absent" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {record.status === "Present" && <CheckCircle className="h-3 w-3" />}
                            {record.status === "Absent" && <XCircle className="h-3 w-3" />}
                            {record.status === "Late" && <Clock className="h-3 w-3" />}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{record.status === "Present" ? "07:45 AM" : "-"}</td>
                        <td className="px-6 py-4">
                          {record.alertSent && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded-lg w-fit">
                              <MessageCircle className="h-3 w-3" />
                              {t.whatsappAlert}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );
      case "Homework":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Assigned Homework</h3>
              <div className="flex gap-2">
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">3 Tasks Total</span>
              </div>
            </div>

            <div className="grid gap-6">
              {studentData.homework.map((task) => (
                <Accordion 
                  key={task.id} 
                  title={task.title} 
                  icon={BookOpen}
                  defaultOpen={task.id === "1"}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-600">{task.subject}</span>
                      <span className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        task.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{task.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {t.dueDate}: {task.dueDate}
                      </div>
                      <button className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all">
                        Mark as Done
                      </button>
                    </div>
                  </div>
                </Accordion>
              ))}
            </div>
          </motion.div>
        );
      case "Results":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Marks Distribution</h3>
                  <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all">
                    <Download className="h-4 w-4" />
                    Export PDF
                  </button>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resultsChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="marks" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Grade Summary</h3>
                <div className="mt-8 flex flex-col items-center">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-emerald-500 shadow-lg shadow-emerald-100">
                    <span className="text-4xl font-black text-slate-900">{currentStudent.grade || "A"}</span>
                    <div className="absolute -bottom-2 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest">Excellent</div>
                  </div>
                  <div className="mt-12 w-full space-y-4">
                    {[
                      { label: "Percentage", value: currentStudent.percentage || "88.2%" },
                      { label: "Class Rank", value: currentStudent.rank || "4th" },
                      { label: "GPA", value: currentStudent.gpa || "3.8" }
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                        <span className="text-sm font-black text-slate-900">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Marks Obtained</th>
                      <th className="px-6 py-4">Total Marks</th>
                      <th className="px-6 py-4">Grade</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {results.map((result: any) => (
                      <tr key={result.subject} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{result.subject}</td>
                        <td className="px-6 py-4 font-black text-emerald-600">{result.marks}</td>
                        <td className="px-6 py-4 text-slate-400 font-bold">{result.total}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                            result.grade?.startsWith('A') ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {result.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic">Good performance</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );
      case "Timetable":
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-black text-slate-900 uppercase tracking-widest">{currentStudent.class} {t.timetable}</h4>
                <button className="text-slate-400 hover:text-slate-600">
                  <Download className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Day</th>
                      <th className="px-6 py-3">Subject</th>
                      <th className="px-6 py-3">Teacher</th>
                      <th className="px-6 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => {
                      const dayEntries = timetableData.filter(e => e.day === day);
                      if (dayEntries.length === 0) return null;
                      return dayEntries.map((entry, idx) => (
                        <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors">
                          {idx === 0 && (
                            <td className="px-6 py-4 font-black text-slate-900 bg-slate-50/30" rowSpan={dayEntries.length}>
                              {day}
                            </td>
                          )}
                          <td className="px-6 py-4 font-bold text-slate-700">{entry.subject}</td>
                          <td className="px-6 py-4 text-slate-500">{entry.teacher}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">
                            {entry.startTime} - {entry.endTime}
                          </td>
                        </tr>
                      ));
                    })}
                    {timetableData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                          No timetable entries found for this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );
      case "Date Sheet":
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-black text-slate-900 uppercase tracking-widest">{currentStudent.class} {t.dateSheet}</h4>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Examination Schedule</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Subject</th>
                      <th className="px-6 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {dateSheetData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-900">
                          {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">{entry.subject}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {entry.startTime} - {entry.endTime}
                        </td>
                      </tr>
                    ))}
                    {dateSheetData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">
                          No date sheet entries found for this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        );
      case "Fees":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="text-lg font-bold text-slate-900">Fee History</h3>
                    <div className="flex gap-2">
                      <span className="rounded-lg bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">No Arrears</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-6 py-4">{t.month}</th>
                          <th className="px-6 py-4">{t.amount}</th>
                          <th className="px-6 py-4">{t.status}</th>
                          <th className="px-6 py-4">Payment Date</th>
                          <th className="px-6 py-4 text-right">{t.action}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {studentData.fees.map((fee) => (
                          <tr key={fee.month} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{fee.month}</td>
                            <td className="px-6 py-4 font-black text-slate-900">Rs. {fee.amount}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                                fee.status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                              )}>
                                {fee.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">{fee.date}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
                                <Printer className="h-3.5 w-3.5" />
                                Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-black/5 bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
                  <h3 className="text-lg font-bold">Quick Pay</h3>
                  <p className="mt-2 text-xs text-slate-400">Pay your child's school fees securely online.</p>
                  <div className="mt-8 space-y-4">
                    <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Due Amount</p>
                      <h4 className="mt-1 text-2xl font-black">Rs. 3,500</h4>
                      <p className="mt-1 text-[10px] font-bold text-rose-400 uppercase tracking-widest">Due by April 10, 2026</p>
                    </div>
                    <button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/20">
                      Pay Now
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Payment Methods</h3>
                  <div className="mt-6 space-y-3">
                    {['Visa / Mastercard', 'JazzCash', 'EasyPaisa', 'Bank Transfer'].map((method, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-bold text-slate-600">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        {method}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case "Settings":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl space-y-6"
          >
            <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t.changePassword}</h3>
                  <p className="text-sm text-slate-500">Update your account password for security</p>
                </div>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.currentPassword}</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.newPassword}</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                  {t.updatePassword}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Languages className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Language Settings</h3>
                  <p className="text-sm text-slate-500">Choose your preferred language</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setLang("en")}
                  className={cn(
                    "flex-1 rounded-2xl border-2 p-6 text-center transition-all",
                    lang === "en" ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <span className="block font-black uppercase tracking-widest text-sm">English</span>
                </button>
                <button 
                  onClick={() => setLang("ur")}
                  className={cn(
                    "flex-1 rounded-2xl border-2 p-6 text-center transition-all font-urdu",
                    lang === "ur" ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <span className="block font-black text-2xl">اردو</span>
                </button>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex min-h-screen bg-slate-50", lang === "ur" && "font-urdu text-right")} dir={lang === "ur" ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-50 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">{t.dashboard}</span>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                activeTab === item.name
                  ? "bg-emerald-50 text-emerald-600 shadow-sm"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-50 p-4">
          {children.length > 1 && (
            <div className="mb-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Child</label>
              <select 
                value={selectedChildIndex}
                onChange={(e) => setSelectedChildIndex(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold focus:outline-none"
              >
                {children.map((child, idx) => (
                  <option key={child.id} value={idx}>{child.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold">
              {currentStudent?.name?.[0] || "S"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold">{currentStudent?.name || "Student"}</p>
              <p className="text-xs text-slate-400">{currentStudent?.rollNo || "N/A"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">{sidebarItems.find(i => i.name === activeTab)?.label}</h2>
            <div className="h-6 w-px bg-slate-200" />
            <p className="text-sm font-medium text-slate-500">{currentStudent?.class} - {currentStudent?.section}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full border border-slate-200 p-2 text-slate-400 hover:bg-slate-50">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>
          </div>
        </header>

        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
