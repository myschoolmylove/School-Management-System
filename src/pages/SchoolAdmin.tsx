import React, { useState, useEffect } from "react";
import { LayoutDashboard, Users, CreditCard, Calendar, BookOpen, Settings, Bell, Search, MessageCircle, GraduationCap, Shield, Layers, FileText, UserPlus, Image as ImageIcon, Upload, Plus, XCircle, RefreshCw, Menu, History, Package, QrCode, Fingerprint, Smartphone, Clock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
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
import * as XLSX from 'xlsx';

const sidebarItems = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Students", icon: Users },
  { name: "Attendance", icon: Calendar },
  { name: "Teachers", icon: GraduationCap },
  { name: "Classes", icon: Layers },
  { name: "Timetables", icon: Clock },
  { name: "Marks Entry", icon: FileText },
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
  { name: "Settings", icon: Settings },
];

export default function SchoolAdmin() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [schoolStatus, setSchoolStatus] = useState<string>("Active");
  const [schoolData, setSchoolData] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
    });

    if (profile?.schoolId) {
      const unsubscribeSchool = onSnapshot(doc(db, "schools", profile.schoolId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSchoolData(data);
          setSchoolStatus(data.status);
        }
      });

      const unsubscribeStudents = onSnapshot(collection(db, "schools", profile.schoolId, "students"), (snapshot) => {
        setStudentCount(snapshot.size);
      });

      return () => {
        unsubscribeAuth();
        unsubscribeSchool();
        unsubscribeStudents();
      };
    }
    return () => unsubscribeAuth();
  }, [profile?.schoolId]);

  const currentPlan = schoolData?.plan || "Free";
  const isFreeTier = currentPlan === "Free";
  const studentLimit = currentPlan === "Free" ? 50 : currentPlan === "Standard" ? 300 : 600;
  const monthlyBill = studentCount * (currentPlan === "Standard" ? 50 : currentPlan === "Professional" ? 40 : 0);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        console.log("Uploaded Marks Data:", data);
        alert("Marks uploaded successfully from Excel!");
      };
      reader.readAsBinaryString(file);
    }
  };

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
                { label: "Fee Collected", value: "Rs 4.2M", change: "+8%", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
                { label: "Active Teachers", value: "48", change: "0%", icon: GraduationCap, color: "text-purple-600 bg-purple-50" },
                { label: "WhatsApp Alerts", value: "842", change: "+24%", icon: MessageCircle, color: "text-green-600 bg-green-50" },
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
                  {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-lg bg-emerald-500" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-4 flex justify-between text-xs font-medium text-slate-400">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Recent Notices</h3>
                <div className="mt-6 space-y-4">
                  {[
                    { title: "Summer Vacation", date: "2 hours ago", type: "Holiday" },
                    { title: "Parent Teacher Meeting", date: "Yesterday", type: "Event" },
                    { title: "Fee Reminder Sent", date: "2 days ago", type: "Finance" },
                  ].map((notice) => (
                    <div key={notice.title} className="flex items-start gap-3 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{notice.title}</p>
                        <p className="text-xs text-slate-500">{notice.date} • {notice.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-6 w-full rounded-lg bg-slate-50 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">View All Notices</button>
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
        return <SchoolResultsModule schoolId={profile?.schoolId} />;
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
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Marks Entry</h3>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <Upload className="h-4 w-4" />
                  Upload Excel
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                </label>
                <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                  <Plus className="h-4 w-4" />
                  Add Manual Entry
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Roll No</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Marks</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {[
                    { name: "Ali Ahmad", rollNo: "101", subject: "Mathematics", marks: 85, total: 100 },
                    { name: "Sara Khan", rollNo: "102", subject: "Mathematics", marks: 92, total: 100 },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4 text-slate-600">{row.rollNo}</td>
                      <td className="px-6 py-4 text-slate-600">{row.subject}</td>
                      <td className="px-6 py-4">
                        <input type="number" defaultValue={row.marks} className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center focus:border-emerald-500 focus:outline-none" />
                      </td>
                      <td className="px-6 py-4 text-slate-600">{row.total}</td>
                      <td className="px-6 py-4">
                        <button className="text-emerald-600 hover:underline">Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "Gallery":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">School Gallery</h3>
              <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Add Photos
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-black/5 bg-slate-100">
                  <img src={`https://picsum.photos/seed/school${i}/400/400`} alt="Gallery" className="h-full w-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <button className="rounded-full bg-white p-2 text-slate-900 shadow-lg">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "Events":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Events Calendar</h3>
              <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Add Event
              </button>
            </div>
            <div className="space-y-4">
              {[
                { title: "Annual Sports Day", date: "2026-04-15", type: "Event", desc: "Inter-school sports competition." },
                { title: "Eid-ul-Fitr Holidays", date: "2026-03-30", type: "Holiday", desc: "School will remain closed for 3 days." },
                { title: "Final Term Exams", date: "2026-05-10", type: "Exam", desc: "Annual examinations for all classes." },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl font-bold">{new Date(event.date).getDate()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-slate-900">{event.title}</h4>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        event.type === "Holiday" ? "bg-rose-50 text-rose-600" : 
                        event.type === "Exam" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {event.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{event.desc}</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case "Settings":
        return (
          <div className="max-w-2xl space-y-8">
            <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">School Profile</h3>
              <div className="mt-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    Change Logo
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">School Name</label>
                    <input type="text" defaultValue={schoolData?.name || ""} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Principal Name</label>
                    <input type="text" defaultValue={schoolData?.principal || ""} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <textarea className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" rows={3} defaultValue="123 Education Road, Lahore, Pakistan" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Notification Settings</h3>
              <div className="mt-6 space-y-4">
                {[
                  { label: "WhatsApp Attendance Alerts", desc: "Send automatic alerts to parents when students arrive/leave." },
                  { label: "Fee Reminders", desc: "Send monthly fee reminders to parents." },
                  { label: "Exam Result Alerts", desc: "Notify parents when results are published." },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <button className="h-6 w-11 rounded-full bg-emerald-600 transition-colors relative">
                      <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button className="w-full rounded-xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-800 transition-all">
                Save All Changes
              </button>
            </div>
          </div>
        );
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
      {/* Sidebar */}
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
              <p className="mt-2 text-[10px] font-bold text-emerald-400">
                Est. Bill: Rs. {monthlyBill.toLocaleString()}
              </p>
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
      <main className="flex-1">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white px-8">
          <h2 className="text-xl font-bold text-slate-900">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
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
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
