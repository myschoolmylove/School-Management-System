import React, { useState, useEffect } from "react";
import { Check, X, Search, Filter, MessageCircle, Calendar, Users, AlertCircle, Clock, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { logAction } from "../services/auditService";

export default function AttendanceModule({ schoolId }: { schoolId?: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState("Class 1");
  const [alertsSent, setAlertsSent] = useState<Record<string, boolean>>({});
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const classes = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    const q = query(
      collection(db, "schools", schoolId, "students"),
      where("class", "==", selectedClass)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId, selectedClass]);

  useEffect(() => {
    if (!schoolId || !date) return;
    const q = query(
      collection(db, "schools", schoolId, "attendance"), 
      where("date", "==", date)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const att = doc.data();
        data[att.studentId] = att.status;
      });
      setAttendance(data);
    }, (err) => {
      console.error("Error fetching attendance:", err);
    });
    return () => unsubscribe();
  }, [schoolId, date]);

  const toggleStatus = async (studentId: string, status: string) => {
    if (!schoolId) return;
    try {
      const attendanceId = `${date}_${studentId}`;
      await setDoc(doc(db, "schools", schoolId, "attendance", attendanceId), {
        studentId,
        date,
        status,
        class: selectedClass,
        updatedAt: serverTimestamp(),
        schoolId
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const sendAlert = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !schoolId) return;
    
    // Simulate WhatsApp API call
    console.log(`Sending WhatsApp alert for ${student.name} to parent...`);
    setAlertsSent(prev => ({ ...prev, [studentId]: true }));
    await logAction("Attendance Alert", `Sent absence alert for ${student.name}`, "academic");
  };

  const sendAllAlerts = async () => {
    if (!schoolId) return;
    setIsSending(true);
    const absentees = students.filter(s => attendance[s.id] === "Absent");
    
    for (const s of absentees) {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 200));
      setAlertsSent(prev => ({ ...prev, [s.id]: true }));
    }
    
    await logAction("Bulk Attendance Alert", `Sent ${absentees.length} absence alerts`, "academic");
    setIsSending(false);
    alert(`${absentees.length} WhatsApp alerts have been sent to parents.`);
  };

  const stats = {
    present: students.filter(s => attendance[s.id] === "Present").length,
    absent: students.filter(s => attendance[s.id] === "Absent").length,
    late: students.filter(s => attendance[s.id] === "Late").length,
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Daily Attendance</h3>
          <p className="text-sm font-medium text-slate-500">Mark attendance manually. No biometrics required.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none"
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={sendAllAlerts}
            disabled={isSending || stats.absent === 0}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" />
            {isSending ? "Sending..." : "Send Alerts"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Present", value: stats.present, color: "text-emerald-600 bg-emerald-50" },
          { label: "Absent", value: stats.absent, color: "text-rose-600 bg-rose-50" },
          { label: "Late", value: stats.late, color: "text-amber-600 bg-amber-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className={cn("mt-1 text-3xl font-black", stat.color.split(' ')[0])}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">WhatsApp Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" /></td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">No students found matching your search.</td></tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-black uppercase">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-black text-slate-900 uppercase tracking-tight">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-500 font-mono text-xs">{s.rollNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {[
                          { label: "Present", color: "bg-emerald-500", icon: Check },
                          { label: "Absent", color: "bg-rose-500", icon: X },
                          { label: "Late", color: "bg-amber-500", icon: Clock },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            onClick={() => toggleStatus(s.id, btn.label)}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                              attendance[s.id] === btn.label ? btn.color + " text-white shadow-lg scale-110" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                            )}
                            title={btn.label}
                          >
                            <btn.icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {attendance[s.id] === "Absent" && (
                        <div className="flex flex-col items-end gap-1">
                          {alertsSent[s.id] ? (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                              <CheckCircle className="h-3 w-3" />
                              Sent
                            </span>
                          ) : (
                            <button 
                              onClick={() => sendAlert(s.id)}
                              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Send Alert
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
