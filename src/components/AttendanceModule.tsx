import React, { useState, useEffect } from "react";
import { Check, X, Search, Filter, MessageCircle, Calendar, Users, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";

const initialStudents = [
  { id: "S001", name: "Ali Ahmad", rollNo: "101", status: "Present" },
  { id: "S002", name: "Saima Bibi", rollNo: "102", status: "Present" },
  { id: "S003", name: "Zubair Ali", rollNo: "103", status: "Absent" },
  { id: "S004", name: "Iqra Khan", rollNo: "104", status: "Present" },
  { id: "S005", name: "Hassan Raza", rollNo: "105", status: "Late" },
];

export default function AttendanceModule({ schoolId }: { schoolId?: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [alertsSent, setAlertsSent] = useState<Record<string, boolean>>({});
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "students"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId || !date) return;
    const q = query(collection(db, "schools", schoolId, "attendance"), where("date", "==", date));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const att = doc.data();
        data[att.studentId] = att.status;
      });
      setAttendance(data);
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
        updatedAt: serverTimestamp(),
        schoolId
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const sendAlert = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    // Simulate WhatsApp API call
    console.log(`Sending WhatsApp alert for ${student.name} to parent...`);
    setAlertsSent(prev => ({ ...prev, [studentId]: true }));
  };

  const sendAllAlerts = () => {
    setIsSending(true);
    const absentees = students.filter(s => attendance[s.id] === "Absent");
    
    setTimeout(() => {
      const newAlerts = { ...alertsSent };
      absentees.forEach(s => {
        newAlerts[s.id] = true;
      });
      setAlertsSent(newAlerts);
      setIsSending(false);
      alert(`${absentees.length} WhatsApp alerts have been sent to parents.`);
    }, 1500);
  };

  const stats = {
    present: students.filter(s => attendance[s.id] === "Present").length,
    absent: students.filter(s => attendance[s.id] === "Absent").length,
    late: students.filter(s => attendance[s.id] === "Late").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Daily Attendance</h3>
          <p className="text-sm text-slate-500">Mark attendance and send automated alerts to parents.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button 
            onClick={sendAllAlerts}
            disabled={isSending || stats.absent === 0}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="h-4 w-4" />
            {isSending ? "Sending..." : "Send Absentee Alerts"}
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
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className={cn("mt-1 text-3xl font-bold", stat.color.split(' ')[0])}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{s.rollNo}</td>
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
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                            attendance[s.id] === btn.label ? btn.color + " text-white shadow-md" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
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
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            Alert Sent
                          </span>
                        ) : (
                          <button 
                            onClick={() => sendAlert(s.id)}
                            className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                          >
                            <AlertCircle className="h-3 w-3" />
                            Send Alert
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
