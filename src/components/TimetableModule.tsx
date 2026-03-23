import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Download,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { cn } from "../lib/utils";
import { logAction } from "../services/auditService";

interface TimetableEntry {
  id?: string;
  classId: string;
  day: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
}

interface DateSheetEntry {
  id?: string;
  classId: string;
  examName: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
}

export default function TimetableModule({ schoolId }: { schoolId?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<"Timetable" | "DateSheet">("Timetable");
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [dateSheets, setDateSheets] = useState<DateSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState<any>({
    classId: "",
    day: "Monday",
    subject: "",
    teacher: "",
    startTime: "",
    endTime: "",
    examName: "Final Term 2026",
    date: ""
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

  useEffect(() => {
    if (!schoolId) return;
    const qTimetable = query(collection(db, "schools", schoolId, "timetables"));
    const unsubscribeTimetable = onSnapshot(qTimetable, (snapshot) => {
      setTimetables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry)));
    });

    const qDateSheet = query(collection(db, "schools", schoolId, "datesheets"));
    const unsubscribeDateSheet = onSnapshot(qDateSheet, (snapshot) => {
      setDateSheets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DateSheetEntry)));
      setLoading(false);
    });

    return () => {
      unsubscribeTimetable();
      unsubscribeDateSheet();
    };
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setLoading(true);
    try {
      const collectionName = activeSubTab === "Timetable" ? "timetables" : "datesheets";
      await addDoc(collection(db, "schools", schoolId, collectionName), {
        ...formData,
        schoolId,
        createdAt: serverTimestamp()
      });
      
      await logAction(
        "Created Academic Entry",
        `Created ${activeSubTab} entry for ${formData.classId} - ${formData.subject}`,
        "academic"
      );
      
      setShowForm(false);
      setFormData({
        classId: "",
        day: "Monday",
        subject: "",
        teacher: "",
        startTime: "",
        endTime: "",
        examName: "Final Term 2026",
        date: ""
      });
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!schoolId) return;
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const collectionName = activeSubTab === "Timetable" ? "timetables" : "datesheets";
      await deleteDoc(doc(db, "schools", schoolId, collectionName, id));
      await logAction("Deleted Academic Entry", `Deleted ${activeSubTab} entry`, "academic");
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900">Academic Schedules</h3>
          <p className="text-sm font-medium text-slate-500">Manage school timetables and examination date sheets</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveSubTab("Timetable")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
              activeSubTab === "Timetable" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Timetable
          </button>
          <button
            onClick={() => setActiveSubTab("DateSheet")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
              activeSubTab === "DateSheet" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Date Sheet
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeSubTab.toLowerCase()}...`}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Add {activeSubTab}
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-6">
          {activeSubTab === "Timetable" ? (
            classes.map(cls => {
              const classEntries = timetables.filter(t => t.classId === cls);
              if (classEntries.length === 0) return null;
              return (
                <div key={cls} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest">{cls} Timetable</h4>
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
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {days.map(day => {
                          const dayEntries = classEntries.filter(e => e.day === day);
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
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDelete(entry.id!)}
                                  className="text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            classes.map(cls => {
              const classEntries = dateSheets.filter(t => t.classId === cls);
              if (classEntries.length === 0) return null;
              return (
                <div key={cls} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest">{cls} Date Sheet</h4>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Final Term 2026</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Subject</th>
                          <th className="px-6 py-3">Time</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {classEntries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-black text-slate-900">
                              {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">{entry.subject}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                              {entry.startTime} - {entry.endTime}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDelete(entry.id!)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Add {activeSubTab} Entry</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Class</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {activeSubTab === "Timetable" ? (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Day</label>
                    <select
                      required
                      value={formData.day}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {activeSubTab === "Timetable" && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Teacher</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mr. Zahid"
                      value={formData.teacher}
                      onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">End Time</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
