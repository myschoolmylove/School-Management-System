import React, { useState, useEffect } from "react";
import { LayoutDashboard, Users, CreditCard, Calendar, BookOpen, Settings, Bell, Search, MessageCircle, GraduationCap, Shield, Layers, FileText, UserPlus, Image as ImageIcon, Upload, Plus, XCircle, RefreshCw, Menu, X, History, Package, QrCode, Fingerprint, Smartphone, Clock, Edit2, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import ClassModule from "@/src/components/ClassModule";
import FinanceModule from "@/src/components/FinanceModule";
import SchoolResultsModule from "@/src/components/SchoolResultsModule";
import StudentModule from "@/src/components/StudentModule";
import TeacherModule from "@/src/components/TeacherModule";
import FeeModule from "@/src/components/FeeModule";
import AttendanceModule from "@/src/components/AttendanceModule";
import UserManagementModule from "@/src/components/UserManagementModule";
import AuditLogModule from "@/src/components/AuditLogModule";
import InventoryModule from "@/src/components/InventoryModule";
import IDCardModule from "@/src/components/IDCardModule";
import WhatsAppModule from "@/src/components/WhatsAppModule";
import BiometricModule from "@/src/components/BiometricModule";
import TimetableModule from "@/src/components/TimetableModule";
import GalleryModule from "@/src/components/GalleryModule";
import EventsModule from "@/src/components/EventsModule";
import AdmissionsModule from "@/src/components/AdmissionsModule";
import NoticesModule from "@/src/components/NoticesModule";
import SettingsModule from "@/src/components/SettingsModule";
import AISearchModule from "@/src/components/AISearchModule";
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from "motion/react";

const sidebarItems = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Students", icon: Users },
  { name: "Attendance", icon: Calendar },
  { name: "Teachers", icon: GraduationCap },
  { name: "Classes", icon: Layers },
  { name: "Timetables", icon: Clock },
  { name: "Marks Entry", icon: Edit2 },
  { name: "Results", icon: FileText },
  { name: "Finance", icon: CreditCard },
  { name: "Fees", icon: CreditCard },
  { name: "Inventory", icon: Package },
  { name: "ID Cards", icon: QrCode },
  { name: "WhatsApp", icon: Smartphone },
  { name: "Biometrics", icon: Fingerprint },
  { name: "Audit Logs", icon: History },
  { name: "User Roles", icon: UserPlus },
  { name: "Gallery", icon: ImageIcon },
  { name: "Events", icon: Bell },
  { name: "Admissions", icon: BookOpen },
  { name: "Notices", icon: Bell },
  { name: "AI Search", icon: Sparkles },
  { name: "Settings", icon: Settings },
];

export default function SchoolAdmin() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [schoolStatus, setSchoolStatus] = useState<string>("Active");
  const [schoolData, setSchoolData] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [totalFeesCollected, setTotalFeesCollected] = useState(0);
  const [whatsappAlertsCount, setWhatsappAlertsCount] = useState(0);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [feeTrend, setFeeTrend] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
        return;
      }
      
      // Admin check
      if (profile && profile.role !== "admin" && profile.role !== "super") {
        alert("Unauthorized access. Admin only.");
        navigate("/");
        return;
      }
    });

    if (profile?.schoolId) {
      const schoolId = profile.schoolId;

      const unsubscribeSchool = onSnapshot(doc(db, "schools", schoolId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSchoolData(data);
          setSchoolStatus(data.status);
        }
      }, (err) => {
        console.error("Error fetching school data:", err);
      });

      const unsubscribeStudents = onSnapshot(collection(db, "schools", schoolId, "students"), (snapshot) => {
        setStudentCount(snapshot.size);
      }, (err) => {
        console.error("Error fetching student count:", err);
      });

      const unsubscribeTeachers = onSnapshot(collection(db, "schools", schoolId, "teachers"), (snapshot) => {
        setTeacherCount(snapshot.size);
      }, (err) => {
        console.error("Error fetching teacher count:", err);
      });

      const unsubscribeFees = onSnapshot(collection(db, "schools", schoolId, "vouchers"), (snapshot) => {
        let total = 0;
        const dailyTrend = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.status === "Paid") {
            const amount = Number(data.amount) || 0;
            total += amount;

            // Trend calculation (last 7 days)
            if (data.updatedAt) {
              const paidDate = data.updatedAt.toDate();
              const diffDays = Math.floor((now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays < 7) {
                dailyTrend[6 - diffDays] += amount;
              }
            }
          }
        });
        setTotalFeesCollected(total);
        setFeeTrend(dailyTrend);
      }, (err) => {
        console.error("Error fetching fees:", err);
      });

      const unsubscribeNotices = onSnapshot(collection(db, "schools", schoolId, "notices"), (snapshot) => {
        const notices = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
          .slice(0, 3);
        setRecentNotices(notices);
      }, (err) => {
        console.error("Error fetching notices:", err);
      });

      // Fetch WhatsApp alerts from audit logs
      const unsubscribeAudit = onSnapshot(collection(db, "audit_logs"), (snapshot) => {
        const count = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.schoolId === schoolId && data.action?.toLowerCase().includes("whatsapp");
        }).length;
        setWhatsappAlertsCount(count);
      }, (err) => {
        console.error("Error fetching audit logs:", err);
      });

      return () => {
        unsubscribeAuth();
        unsubscribeSchool();
        unsubscribeStudents();
        unsubscribeTeachers();
        unsubscribeFees();
        unsubscribeNotices();
        unsubscribeAudit();
      };
    }
    return () => unsubscribeAuth();
  }, [profile?.schoolId]);

  const currentPlan = schoolData?.plan || "Free";
  const isFreeTier = currentPlan === "Free";
  const studentLimit = currentPlan === "Free" ? 50 : currentPlan === "Standard" ? 300 : 600;
  
  const discount = schoolData?.discount || 0;
  const baseRate = currentPlan === "Standard" ? 50 : currentPlan === "Professional" ? 40 : 0;
  const discountedRate = baseRate * (1 - discount / 100);
  const calculatedBill = studentCount * discountedRate;
  const monthlyPrice = schoolData?.monthlyPrice || calculatedBill;

  const refreshUserPassword = (userName: string, role: string) => {
    alert(`Password for ${role} ${userName} has been refreshed to default: ${role}@123`);
  };

  const renderContent = () => {
    if (schoolStatus === "Suspended") {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-rose-50 p-6">
            <XCircle className="h-16 w-16 text-rose-500" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900 uppercase tracking-widest">Access Suspended</h2>
          <p className="mt-4 max-w-md text-slate-500 font-medium">
            Your school's access to the platform has been suspended. This usually happens due to unpaid subscription fees or license expiry.
          </p>
          <button className="mt-8 rounded-xl bg-slate-900 px-8 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-slate-800">
            Contact Support
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "Overview":
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Students", value: studentCount.toLocaleString(), change: "+12%", icon: Users, color: "text-blue-600 bg-blue-50" },
                { label: "Fee Collected", value: `Rs ${(totalFeesCollected / 1000000).toFixed(1)}M`, change: "+8%", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
                { label: "Active Teachers", value: teacherCount.toString(), change: "0%", icon: GraduationCap, color: "text-purple-600 bg-purple-50" },
                { label: "WhatsApp Alerts", value: whatsappAlertsCount.toString(), change: "+24%", icon: MessageCircle, color: "text-green-600 bg-green-50" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className={cn("rounded-xl p-2", stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{stat.change}</span>
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity & Finance Chart Placeholder */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="col-span-1 rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-bold text-slate-900">Fee Collection Trend</h3>
                <div className="mt-8 flex h-64 items-end gap-4">
                  {feeTrend.map((amount, i) => {
                    const max = Math.max(...feeTrend, 1);
                    const h = (amount / max) * 100;
                    return (
                      <div key={i} className="flex-1 rounded-t-lg bg-emerald-500 transition-all duration-500" style={{ height: `${Math.max(h, 5)}%` }} title={`Rs ${amount}`} />
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-between text-xs font-medium text-slate-400">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Recent Notices</h3>
                <div className="mt-6 space-y-4">
                  {recentNotices.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No recent notices</p>
                  ) : (
                    recentNotices.map((notice) => (
                      <div key={notice.id} className="flex items-start gap-3 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{notice.title}</p>
                          <p className="text-xs text-slate-500">
                            {notice.date?.toDate ? notice.date.toDate().toLocaleDateString() : 'Just now'} • {notice.category || 'General'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab("Notices")}
                  className="mt-6 w-full rounded-lg bg-slate-50 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  View All Notices
                </button>
              </div>
            </div>
          </div>
        );
      case "Teachers":
        return <TeacherModule schoolId={profile?.schoolId} />;
      case "Students":
        return <StudentModule schoolId={profile?.schoolId} />;
      case "Attendance":
        return <AttendanceModule schoolId={profile?.schoolId} />;
      case "Classes":
        return <ClassModule schoolId={profile?.schoolId} />;
      case "Timetables":
        return <TimetableModule schoolId={profile?.schoolId} />;
      case "Finance":
        return <FinanceModule schoolId={profile?.schoolId} />;
      case "Results":
        return <SchoolResultsModule schoolId={profile?.schoolId} initialTab="manage" />;
      case "Fees":
        return <FeeModule schoolId={profile?.schoolId} />;
      case "User Roles":
        return <UserManagementModule schoolId={profile?.schoolId} />;
      case "Audit Logs":
        return <AuditLogModule schoolId={profile?.schoolId} />;
      case "Inventory":
        return <InventoryModule schoolId={profile?.schoolId} />;
      case "ID Cards":
        return <IDCardModule schoolId={profile?.schoolId} />;
      case "WhatsApp":
        return <WhatsAppModule schoolId={profile?.schoolId} />;
      case "Biometrics":
        return <BiometricModule schoolId={profile?.schoolId} />;
      case "Marks Entry":
        return <SchoolResultsModule schoolId={profile?.schoolId} initialTab="entry" />;
      case "Gallery":
        return <GalleryModule schoolId={profile?.schoolId} />;
      case "Events":
        return <EventsModule schoolId={profile?.schoolId} />;
      case "Admissions":
        return <AdmissionsModule schoolId={profile?.schoolId} />;
      case "Notices":
        return <NoticesModule schoolId={profile?.schoolId} />;
      case "AI Search":
        return <AISearchModule />;
      case "Settings":
        return <SettingsModule schoolId={profile?.schoolId} />;
      default:
        return (
          <div className="flex h-[60vh] flex-col items-center justify-center text-center">
            <div className="rounded-full bg-slate-100 p-6">
              {(() => {
                const Icon = sidebarItems.find(i => i.name === activeTab)?.icon || LayoutDashboard;
                return <Icon className="h-12 w-12 text-slate-400" />;
              })()}
            </div>
            <h3 className="mt-6 text-xl font-bold text-slate-900">{activeTab} Module</h3>
            <p className="mt-2 max-w-xs text-slate-500">This module is part of the Standard and Premium plans. Upgrade to access full features.</p>
            <button className="mt-8 rounded-full bg-emerald-600 px-8 py-3 font-semibold text-white shadow-lg hover:bg-emerald-700">Upgrade Plan</button>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
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
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-black/5 px-6">
                <span className="text-lg font-bold text-slate-900">Admin Panel</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto space-y-1 px-4 py-4">
                {sidebarItems.map((item) => {
                  const isLocked = (() => {
                    if (currentPlan === "Free") {
                      return ["Finance", "Fees", "Inventory", "Biometrics", "Audit Logs", "Admissions", "Events", "User Roles", "Settings"].includes(item.name);
                    }
                    if (currentPlan === "Standard") {
                      return ["Finance", "Inventory", "Biometrics", "Audit Logs"].includes(item.name);
                    }
                    return false;
                  })();
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (!isLocked) {
                          setActiveTab(item.name);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        activeTab === item.name
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        isLocked && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </div>
                      {isLocked && <Shield className="h-4 w-4 text-slate-400" />}
                    </button>
                  );
                })}
              </nav>
              
              <div className="border-t border-black/5 p-4">
                <div className="flex items-center gap-3 rounded-lg bg-slate-900 p-3 text-white">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold">
                    {profile?.name?.[0] || "A"}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{profile?.name || "Admin"}</p>
                    <p className="truncate text-xs text-slate-400">{schoolData?.name || "School"}</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-black/5 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-black/5 px-6">
          <span className="text-lg font-bold text-slate-900">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-4">
          {sidebarItems.map((item) => {
            const isLocked = (() => {
              if (currentPlan === "Free") {
                return ["Finance", "Fees", "Inventory", "Biometrics", "Audit Logs", "Admissions", "Events", "User Roles", "Settings"].includes(item.name);
              }
              if (currentPlan === "Standard") {
                return ["Finance", "Inventory", "Biometrics", "Audit Logs"].includes(item.name);
              }
              return false;
            })();
            return (
              <button
                key={item.name}
                onClick={() => !isLocked && setActiveTab(item.name)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === item.name
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  isLocked && "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
                {isLocked && <Shield className="h-4 w-4 text-slate-400" />}
              </button>
            );
          })}
        </nav>
        
        {/* Plan Status */}
        <div className="border-t border-black/5 p-4">
          <div className={cn(
            "rounded-xl p-4",
            isFreeTier ? "bg-slate-100" : "bg-emerald-900 text-white"
          )}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Current Plan</p>
            <p className="mt-1 text-sm font-bold">{currentPlan} Plan</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
              <div 
                className={cn("h-full", isFreeTier ? "bg-slate-400" : "bg-emerald-400")} 
                style={{ width: `${Math.min((studentCount / studentLimit) * 100, 100)}%` }} 
              />
            </div>
            <p className="mt-2 text-[10px] font-medium opacity-80">
              {studentCount} / {currentPlan === "Enterprise" ? "Unlimited" : studentLimit} Students
            </p>
            {currentPlan !== "Free" && currentPlan !== "Enterprise" && (
              <div className="mt-2 space-y-1">
                {schoolData?.monthlyPrice ? (
                  <p className="text-[10px] font-bold text-emerald-400">
                    Decided Price: Rs. {schoolData.monthlyPrice.toLocaleString()} / month
                  </p>
                ) : (
                  <>
                    <p className="text-[10px] font-bold text-emerald-400">
                      Rate: Rs. {discountedRate.toFixed(2)} / student
                    </p>
                    <p className="text-[10px] font-bold text-emerald-400">
                      Est. Bill: Rs. {calculatedBill.toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-black/5 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-900 p-3 text-white">
            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold">
              {profile?.name?.[0] || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{profile?.name || "Admin"}</p>
              <p className="truncate text-xs text-slate-400">{schoolData?.name || "School"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students, fees..."
                className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
