import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FileSpreadsheet,
  School,
  Users,
  Menu,
  X,
  LogOut
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
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth as firebaseAuth } from "../firebase";

const COLORS = ['#10b981', '#f43f5e', '#f59e0b'];

// PDF Styles
const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  studentInfo: { marginVertical: 20, padding: 15, backgroundColor: '#f8fafc', borderRadius: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase' },
  infoValue: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  table: { marginTop: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 8, borderBottom: 1, borderBottomColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottom: 1, borderBottomColor: '#f1f5f9' },
  col1: { flex: 2, fontSize: 10 },
  col2: { flex: 1, fontSize: 10, textAlign: 'center' },
  col3: { flex: 1, fontSize: 10, textAlign: 'center' },
  col4: { flex: 1, fontSize: 10, textAlign: 'center' },
  footer: { marginTop: 40, textAlign: 'center', fontSize: 10, color: '#94a3b8' }
});

const ResultPDF = ({ student, results, term }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Academic Report Card</Text>
        <Text style={styles.subtitle}>{term} Examination Results</Text>
      </View>
      
      <View style={styles.studentInfo}>
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{student.name}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>Roll Number</Text>
            <Text style={styles.infoValue}>{student.rollNo}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.infoLabel}>Class</Text>
            <Text style={styles.infoValue}>{student.class} - {student.section}</Text>
          </View>
          <View>
            <Text style={styles.infoLabel}>Date Generated</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Subject</Text>
          <Text style={styles.col2}>Marks</Text>
          <Text style={styles.col3}>Total</Text>
          <Text style={styles.col4}>Grade</Text>
        </View>
        {results.map((r: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{r.subject}</Text>
            <Text style={styles.col2}>{r.marks}</Text>
            <Text style={styles.col3}>{r.total}</Text>
            <Text style={styles.col4}>{r.grade}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>This is a computer-generated document and does not require a signature.</Text>
      </View>
    </Page>
  </Document>
);

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
    logout: "Logout",
    selectChild: "Select Child",
    keepTrack: "Keep track of your child's academic progress and school activities.",
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
    logout: "لاگ آؤٹ",
    selectChild: "بچہ منتخب کریں",
    keepTrack: "اپنے بچے کی تعلیمی پیشرفت پر نظر رکھیں",
  },
};

export default function ParentPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "ur">("en");
  const { profile, logout, loading: authLoading } = useAuth();
  const baseT = translations[lang];
  const t = {
    ...baseT,
    selectChild: profile?.role === 'student' ? (lang === 'en' ? 'My Profile' : 'میرا پروفائل') : baseT.selectChild,
    keepTrack: profile?.role === 'student' ? (lang === 'en' ? 'Keep track of your academic progress and school activities.' : 'اپنی تعلیمی پیشرفت اور اسکول کی سرگرمیوں پر نظر رکھیں') : baseT.keepTrack,
  };

  const sidebarItems = [
    { name: "Overview", label: t.dashboard, icon: LayoutDashboard },
    { name: "Attendance", label: t.attendance, icon: Calendar },
    { name: "Homework", label: t.homework, icon: BookOpen },
    { name: "Results", label: t.results, icon: FileText },
    { name: "Timetable", label: t.timetable, icon: TableIcon },
    { name: "Date Sheet", label: t.dateSheet, icon: FileSpreadsheet },
    { name: "Fees", label: t.fees, icon: CreditCard },
    { name: "Settings", label: t.settings, icon: Settings },
  ];

  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [dateSheetData, setDateSheetData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [homeworkData, setHomeworkData] = useState<any[]>([]);
  const [resultData, setResultData] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTerm, setActiveTerm] = useState("Final Term");
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const selectedChild = children[selectedChildIndex];
  const currentStudent = selectedChild;

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      navigate("/login");
      return;
    }
    if (!profile?.schoolId || (profile.role !== 'parent' && profile.role !== 'student') || !profile.uid) {
      setIsLoading(false);
      return;
    }

    // Fetch children linked to this parent or the student themselves
    let qChildren;
    if (profile.role === 'parent') {
      qChildren = query(
        collection(db, "schools", profile.schoolId, "students"),
        where("parentUid", "==", profile.uid)
      );
    } else {
      // For student role, fetch the student document associated with this user
      // We assume the student document has a field 'uid' or we match by rollNo/username
      qChildren = query(
        collection(db, "schools", profile.schoolId, "students"),
        where("rollNo", "==", profile.username || profile.email.split('@')[0])
      );
    }

    const unsubChildren = onSnapshot(qChildren, (snapshot) => {
      const childList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching children:", error);
      setIsLoading(false);
    });

    // Fetch school-wide notices
    const qNotices = query(
      collection(db, "schools", profile.schoolId, "events"),
      where("type", "in", ["Notice", "Event", "Holiday"])
    );
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching notices:", error);
    });

    return () => {
      unsubChildren();
      unsubNotices();
    };
  }, [profile]);

  useEffect(() => {
    if (!profile?.schoolId || children.length === 0) return;

    const childNames = children.map(c => c.name.toLowerCase());
    const unsubscribeAudit = onSnapshot(query(collection(db, "audit_logs"), where("schoolId", "==", profile.schoolId)), (snapshot) => {
      const logs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((log: any) => {
          if (log.schoolId !== profile.schoolId) return false;
          // Filter logs that mention any of the children's names or roll numbers
          const details = log.details?.toLowerCase() || "";
          const action = log.action?.toLowerCase() || "";
          return childNames.some(name => details.includes(name) || action.includes(name));
        })
        .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
        .slice(0, 5);
      setRecentActivity(logs);
    }, (err) => {
      console.error("Error fetching audit logs:", err);
    });

    return () => unsubscribeAudit();
  }, [profile?.schoolId, children]);

  useEffect(() => {
    if (!selectedChild || !profile?.schoolId) return;

    // Fetch Timetable for the student's class
    const qTimetable = query(
      collection(db, "schools", profile.schoolId, "timetables"),
      where("classId", "==", selectedChild.class)
    );
    const unsubTimetable = onSnapshot(qTimetable, (snapshot) => {
      setTimetableData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching timetable:", error);
    });

    // Fetch Date Sheet for the student's class
    const qDateSheet = query(
      collection(db, "schools", profile.schoolId, "datesheets"),
      where("classId", "==", selectedChild.class)
    );
    const unsubDateSheet = onSnapshot(qDateSheet, (snapshot) => {
      setDateSheetData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching datesheet:", error);
    });

    return () => {
      unsubTimetable();
      unsubDateSheet();
    };
  }, [selectedChild, profile?.schoolId]);

  useEffect(() => {
    if (!selectedChild || !profile?.schoolId) return;

    // Fetch Attendance
    const qAttendance = query(
      collection(db, "schools", profile.schoolId, "attendance"),
      where("studentId", "==", selectedChild.id)
    );
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      setAttendanceData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Fees
    const qFees = query(
      collection(db, "schools", profile.schoolId, "fees"),
      where("studentId", "==", selectedChild.id)
    );
    const unsubFees = onSnapshot(qFees, (snapshot) => {
      setFeeData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Homework
    const qHomework = query(
      collection(db, "schools", profile.schoolId, "homework"),
      where("classId", "==", selectedChild.class)
    );
    const unsubHomework = onSnapshot(qHomework, (snapshot) => {
      setHomeworkData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Results
    const qResults = query(
      collection(db, "schools", profile.schoolId, "results"),
      where("studentId", "==", selectedChild.id)
    );
    const unsubResults = onSnapshot(qResults, (snapshot) => {
      setResultData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAttendance();
      unsubFees();
      unsubHomework();
      unsubResults();
    };
  }, [selectedChild, profile?.schoolId]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseAuth.currentUser || !firebaseAuth.currentUser.email) return;
    
    setIsUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseAuth.currentUser.email, passwordForm.current);
      await reauthenticateWithCredential(firebaseAuth.currentUser, credential);
      await updatePassword(firebaseAuth.currentUser, passwordForm.new);
      alert("Password updated successfully!");
      setPasswordForm({ current: "", new: "" });
    } catch (error: any) {
      console.error("Error updating password:", error);
      alert(error.message || "Failed to update password. Please check your current password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
        <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6">
          <div className="rounded-full bg-slate-100 p-6">
            <GraduationCap className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">No Children Linked</h3>
          <p className="mt-2 max-w-md text-slate-500">
            We couldn't find any students linked to your account. 
            Please contact the school administration to ensure your account is correctly linked to your child's record.
          </p>
          <div className="mt-8 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-400">
            <p>Your UID: <span className="font-mono font-medium text-slate-600">{profile?.uid}</span></p>
            <p>Your Username: <span className="font-mono font-medium text-slate-600">{profile?.username || "Not set"}</span></p>
            <p>School ID: <span className="font-mono font-medium text-slate-600">{profile?.schoolId}</span></p>
          </div>
        </div>
      );
    }

    // Mock results if not present in DB yet, or use real ones if we had a results collection
    const results = resultData.length > 0 ? resultData.filter(r => r.term === activeTerm) : [
      { subject: "Mathematics", marks: 0, total: 100, grade: "N/A" },
      { subject: "English", marks: 0, total: 100, grade: "N/A" },
    ];

    const resultsChartData = results.map((r: any) => ({
      subject: (r.subject || "Unknown").split(' ')[0],
      marks: r.marks || 0
    }));

    const attendanceStats = {
      present: attendanceData.filter(a => a.status === "Present").length,
      absent: attendanceData.filter(a => a.status === "Absent").length,
      late: attendanceData.filter(a => a.status === "Late").length,
      total: attendanceData.length
    };

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
                  {recentActivity.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">No recent activity found.</p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600">
                          <History className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-900">{activity.action}</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {activity.timestamp?.toDate ? activity.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{activity.details}</p>
                        </div>
                      </div>
                    ))
                  )}
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
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `2026-03-${day.toString().padStart(2, '0')}`;
                    const record = attendanceData.find(a => a.date === dateStr);
                    
                    return (
                      <motion.div 
                        key={i} 
                        whileHover={{ scale: 1.05 }}
                        className={cn(
                          "flex h-14 flex-col items-center justify-center rounded-xl text-sm font-bold transition-all border border-transparent",
                          !record ? "bg-slate-50 text-slate-300" : 
                          record.status === "Absent" ? "bg-rose-50 text-rose-600 border-rose-100" : 
                          record.status === "Late" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}
                      >
                        <span>{day}</span>
                        <span className="text-[8px] opacity-60">
                          {!record ? "N/A" : record.status.substring(0, 3).toUpperCase()}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Monthly Stats</h3>
                  <div className="mt-6 space-y-4">
                    {[
                      { label: "Total Records", value: attendanceStats.total, color: "slate" },
                      { label: "Present", value: attendanceStats.present, color: "emerald" },
                      { label: "Absent", value: attendanceStats.absent, color: "rose" },
                      { label: "Late", value: attendanceStats.late, color: "amber" }
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
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${attendanceStats.total > 0 ? (attendanceStats.present / attendanceStats.total) * 100 : 0}%` }} />
                    </div>
                    <p className="mt-2 text-right text-sm font-black text-emerald-600">
                      {attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0}%
                    </p>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {attendanceData.sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
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
                        <td className="px-6 py-4 text-slate-500 font-medium">{record.checkIn || "-"}</td>
                      </tr>
                    ))}
                    {attendanceData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
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
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">{homeworkData.length} Tasks Total</span>
              </div>
            </div>

            <div className="grid gap-6">
              {homeworkData.map((task) => (
                <Accordion 
                  key={task.id} 
                  title={task.title} 
                  icon={BookOpen}
                  defaultOpen={false}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-blue-600">{task.subject}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{task.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {t.dueDate}: {task.dueDate}
                      </div>
                    </div>
                  </div>
                </Accordion>
              ))}
              {homeworkData.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  No homework assigned for this class.
                </div>
              )}
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
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-900">Marks Distribution</h3>
                    <select 
                      value={activeTerm}
                      onChange={(e) => setActiveTerm(e.target.value)}
                      className="rounded-lg border-none bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="First Term">First Term</option>
                      <option value="Mid Term">Mid Term</option>
                      <option value="Final Term">Final Term</option>
                    </select>
                  </div>
                  <PDFDownloadLink 
                    document={<ResultPDF student={selectedChild} results={results} term={activeTerm} />} 
                    fileName={`${selectedChild.name}_${activeTerm}_Results.pdf`}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all"
                  >
                    {({ loading }) => (
                      <>
                        <Download className="h-4 w-4" />
                        {loading ? 'Preparing...' : 'Export PDF'}
                      </>
                    )}
                  </PDFDownloadLink>
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
                    <span className="text-4xl font-black text-slate-900">
                      {results.length > 0 ? (results.reduce((acc: number, curr: any) => acc + curr.marks, 0) / results.reduce((acc: number, curr: any) => acc + curr.total, 0) * 100 > 80 ? "A" : "B") : "N/A"}
                    </span>
                    <div className="absolute -bottom-2 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest">
                      {results.length > 0 ? "Good" : "No Data"}
                    </div>
                  </div>
                  <div className="mt-12 w-full space-y-4">
                    {[
                      { label: "Percentage", value: results.length > 0 ? `${Math.round(results.reduce((acc: number, curr: any) => acc + curr.marks, 0) / results.reduce((acc: number, curr: any) => acc + curr.total, 0) * 100)}%` : "0%" },
                      { label: "Total Marks", value: `${results.reduce((acc: number, curr: any) => acc + curr.marks, 0)} / ${results.reduce((acc: number, curr: any) => acc + curr.total, 0)}` }
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
                    {results.map((result: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
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
                        <td className="px-6 py-4 text-slate-500 italic">{result.remarks || "Good performance"}</td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                          No results found for {activeTerm}.
                        </td>
                      </tr>
                    )}
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
                      <span className="rounded-lg bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        {feeData.some(f => f.status === "Unpaid") ? "Arrears Pending" : "No Arrears"}
                      </span>
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
                        {feeData.map((fee) => (
                          <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
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
                            <td className="px-6 py-4 text-slate-500 font-medium">{fee.date || "-"}</td>
                            <td className="px-6 py-4 text-right">
                              <button className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
                                <Printer className="h-3.5 w-3.5" />
                                Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                        {feeData.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                              No fee records found.
                            </td>
                          </tr>
                        )}
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
                      <h4 className="mt-1 text-2xl font-black">
                        Rs. {feeData.filter(f => f.status === "Unpaid").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                      </h4>
                      <p className="mt-1 text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        {feeData.some(f => f.status === "Unpaid") ? "Action Required" : "All Clear"}
                      </p>
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
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.currentPassword}</label>
                  <input 
                    type="password" 
                    required
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t.newPassword}</label>
                  <input 
                    type="password" 
                    required
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isUpdatingPassword}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isUpdatingPassword ? "Updating..." : t.updatePassword}
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
    <div className={cn(
      "flex min-h-screen bg-slate-50",
      lang === "ur" ? "flex-row-reverse text-right" : "flex-row"
    )} dir={lang === "ur" ? "rtl" : "ltr"}>
      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: lang === "ur" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: lang === "ur" ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 z-50 flex w-72 flex-col bg-slate-900 text-white shadow-2xl lg:hidden",
                lang === "ur" ? "right-0" : "left-0"
              )}
            >
              <div className="flex h-24 items-center justify-between px-8 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                    <School className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-black uppercase tracking-widest">Parent Portal</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="mt-8 overflow-y-auto space-y-2 px-4">
                {sidebarItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveTab(item.name);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all",
                      activeTab === item.name 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
                <button 
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all mt-8"
                >
                  <Lock className="h-5 w-5" />
                  {lang === "ur" ? "لاگ آؤٹ" : "Logout"}
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className={cn(
        "hidden w-72 flex-col bg-slate-900 text-white lg:flex",
        lang === "ur" ? "border-l border-white/5" : "border-r border-white/5"
      )}>
        <div className="flex h-24 items-center gap-3 px-8 border-b border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <School className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-black uppercase tracking-widest">Parent Portal</span>
        </div>

        <nav className="mt-8 space-y-2 px-4">
          {sidebarItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all",
                activeTab === item.name 
                  ? "bg-emerald-50 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all mt-8"
          >
            <Lock className="h-5 w-5" />
            {lang === "ur" ? "لاگ آؤٹ" : "Logout"}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                {t.welcome} {profile?.name}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {lang === "ur" ? "اپنے بچے کی تعلیمی پیشرفت پر نظر رکھیں" : "Keep track of your child's academic progress and school activities."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button 
              onClick={() => setLang(lang === "en" ? "ur" : "en")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <Languages className="h-4 w-4 text-emerald-500" />
              {lang === "en" ? "اردو" : "English"}
            </button>

            {/* Child Selector */}
            {children.length > 1 && (
              <div className="relative">
                <select 
                  value={selectedChildIndex}
                  onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
                  className="appearance-none rounded-xl border border-slate-200 bg-white px-10 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                >
                  {children.map((child, idx) => (
                    <option key={child.id} value={idx}>{child.name}</option>
                  ))}
                </select>
                <Users className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
                  lang === "ur" ? "right-3" : "left-3"
                )} />
                <ChevronDown className={cn(
                  "absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
                  lang === "ur" ? "left-3" : "right-3"
                )} />
              </div>
            )}
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}
