import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  Settings, 
  Bell, 
  Search, 
  CheckCircle, 
  Clock, 
  Plus, 
  Upload, 
  GraduationCap,
  Calendar,
  Menu,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import AttendanceModule from "../components/AttendanceModule";
import * as XLSX from 'xlsx';
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [studentCount, setStudentCount] = useState(0);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.schoolId) return;

    // Fetch students for teacher's class if assigned
    const teacherClass = profile.classId || "";
    if (teacherClass) {
      const qStudents = query(
        collection(db, "schools", profile.schoolId, "students"),
        where("class", "==", teacherClass)
      );
      const unsubStudents = onSnapshot(qStudents, (snapshot) => {
        setStudentCount(snapshot.size);
      });

      const qHomework = query(
        collection(db, "schools", profile.schoolId, "homework"),
        where("classId", "==", teacherClass)
      );
      const unsubHomework = onSnapshot(qHomework, (snapshot) => {
        setHomeworkCount(snapshot.size);
        setHomework(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const qTimetable = query(
        collection(db, "schools", profile.schoolId, "timetables"),
        where("classId", "==", teacherClass)
      );
      const unsubTimetable = onSnapshot(qTimetable, (snapshot) => {
        // Filter for today's schedule if possible, or just show all for the class
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = days[new Date().getDay()];
        const todaySchedule = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((s: any) => s.day === today)
          .sort((a: any, b: any) => a.startTime?.localeCompare(b.startTime));
        setSchedule(todaySchedule);
      });

      return () => {
        unsubStudents();
        unsubHomework();
        unsubTimetable();
      };
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.schoolId) return;
    const qNotices = query(
      collection(db, "schools", profile.schoolId, "events"),
      where("type", "==", "Notice")
    );
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 5));
    });
    return () => unsubNotices();
  }, [profile]);

  const sidebarItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Attendance", icon: Calendar },
    { name: "Homework", icon: BookOpen },
    { name: "Marks Entry", icon: FileText },
    { name: "Notices", icon: Bell },
    { name: "Settings", icon: Settings },
  ];

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
        console.log("Teacher Uploaded Marks:", data);
        alert("Marks uploaded successfully!");
      };
      reader.readAsBinaryString(file);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "My Students", value: studentCount.toString(), icon: Users, color: "text-blue-600 bg-blue-50" },
                { label: "Pending Homework", value: homeworkCount.toString(), icon: BookOpen, color: "text-amber-600 bg-amber-50" },
                { label: "Attendance Today", value: "98%", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className={cn("inline-flex rounded-xl p-2", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Today's Schedule ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})</h3>
              <div className="mt-6 space-y-4">
                {schedule.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No classes scheduled for today.</p>
                ) : schedule.map((slot, i) => (
                  <div key={i} className="flex items-center gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex h-12 w-32 flex-col items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-bold">{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{slot.subject}</p>
                      <p className="text-xs text-slate-500">{slot.classId} - {slot.section || 'All'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "Attendance":
        return <AttendanceModule schoolId={profile?.schoolId} />;
      case "Homework":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Assignments</h3>
              <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                New Assignment
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {homework.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-slate-400">No assignments found for your class.</div>
              ) : homework.map((hw, i) => (
                <div key={i} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{hw.title}</h4>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">{hw.classId}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{hw.description}</p>
                  <p className="mt-2 text-xs font-bold text-slate-400 uppercase">Due Date: {hw.dueDate}</p>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-lg bg-slate-50 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Edit</button>
                    <button className="flex-1 rounded-lg bg-rose-50 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "Marks Entry":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Marks Entry</h3>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                Upload Excel
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
              </label>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Marks</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {[
                    { name: "Ali Ahmad", subject: "Mathematics", marks: 85 },
                    { name: "Sara Khan", subject: "Mathematics", marks: 92 },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4 text-slate-600">{row.subject}</td>
                      <td className="px-6 py-4">
                        <input type="number" defaultValue={row.marks} className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center focus:border-emerald-500 focus:outline-none" />
                      </td>
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
      case "Settings":
        return (
          <div className="max-w-md space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Account Settings</h3>
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-slate-900">Change Password</h4>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Password</label>
                  <input type="password" placeholder="••••••••" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">New Password</label>
                  <input type="password" placeholder="••••••••" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
                <button className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="flex h-64 items-center justify-center text-slate-400">Module under development</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex h-20 items-center gap-3 border-b border-slate-50 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Teacher Panel</span>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
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
              {item.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
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
