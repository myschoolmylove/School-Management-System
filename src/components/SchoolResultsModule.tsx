import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, FileText, CheckCircle, Clock, AlertCircle, Trash2, Edit2, MessageCircle, Send, X, Printer, User, School } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, updateDoc, setDoc, addDoc } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface StudentResult {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  marks: Record<string, number>;
  status: "Draft" | "Published";
  photo?: string;
  attendance: { present: number; total: number };
  teacher: string;
}

export default function SchoolResultsModule() {
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"manage" | "entry">("manage");
  const [search, setSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);

  useEffect(() => {
    const q = query(collection(db, "results"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resultList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentResult[];
      setStudents(resultList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleMarkChange = async (id: string, subject: string, value: string) => {
    const numValue = parseInt(value) || 0;
    try {
      const student = students.find(s => s.id === id);
      if (!student) return;

      const newMarks = { ...student.marks, [subject]: numValue };
      await updateDoc(doc(db, "results", id), {
        marks: newMarks
      });
      
      await logAction("Updated Marks", `${student.name} - ${subject}: ${numValue}`, "academic");
    } catch (error) {
      console.error("Error updating marks:", error);
    }
  };

  const handlePublish = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, "results", id), {
        status: "Published"
      });
      await logAction("Published Result", name, "academic");
    } catch (error) {
      console.error("Error publishing result:", error);
    }
  };

  const calculateTotal = (marks: Record<string, number>) => Object.values(marks).reduce((a, b) => a + b, 0);
  const calculatePercentage = (marks: Record<string, number>) => {
    const subjects = Object.keys(marks).length;
    if (subjects === 0) return 0;
    return (calculateTotal(marks) / (subjects * 100)) * 100;
  };
  
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    return "D";
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Module Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: "manage", label: "Manage Results" },
          { id: "entry", label: "Marks Entry Form" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 text-sm font-bold transition-all",
              activeTab === tab.id
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "manage" && (
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-50 p-6 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-bold text-slate-900">Results Management</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <MessageCircle className="h-4 w-4" />
                Send Results via WhatsApp
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Total Marks</th>
                  <th className="px-6 py-4">Percentage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const total = calculateTotal(s.marks);
                    const percentage = calculatePercentage(s.marks);
                    const maxMarks = Object.keys(s.marks).length * 100;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 text-slate-600">{s.class} - {s.section}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{total}/{maxMarks}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">{percentage.toFixed(1)}%</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                            s.status === "Published" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedResult(s)}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                              title="View Result Card"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {s.status === "Draft" && (
                              <button 
                                onClick={() => handlePublish(s.id, s.name)}
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" 
                                title="Publish"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Send via WhatsApp">
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result Card Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl no-scrollbar">
            <button 
              onClick={() => setSelectedResult(null)}
              className="absolute right-6 top-6 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-10" id="result-card">
              {/* School Header */}
              <div className="flex items-center justify-between border-b-4 border-emerald-600 pb-8">
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <School className="h-12 w-12" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">City School LHR</h2>
                    <p className="text-sm font-bold text-slate-500">Excellence in Education Since 1995</p>
                    <p className="text-xs text-slate-400">Lahore, Pakistan • 042-1234567 • info@cityschool.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block rounded-xl bg-emerald-50 px-4 py-2 text-emerald-600">
                    <p className="text-[10px] font-black uppercase tracking-widest">Academic Session</p>
                    <p className="text-lg font-bold">2025 - 2026</p>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="mt-8 flex items-start gap-10 rounded-3xl bg-slate-50 p-8">
                <div className="h-40 w-40 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg">
                  {selectedResult.photo ? (
                    <img 
                      src={selectedResult.photo} 
                      alt={selectedResult.name} 
                      className="h-full w-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <User className="h-16 w-16" />
                    </div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</p>
                    <p className="text-xl font-bold text-slate-900">{selectedResult.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roll Number</p>
                    <p className="text-xl font-bold text-slate-900">{selectedResult.rollNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class & Section</p>
                    <p className="text-xl font-bold text-slate-900">{selectedResult.class} - {selectedResult.section}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance</p>
                    <p className="text-xl font-bold text-slate-900">
                      {selectedResult.attendance?.present || 0} / {selectedResult.attendance?.total || 200} 
                      <span className="ml-2 text-sm text-emerald-600">
                        ({(((selectedResult.attendance?.present || 0) / (selectedResult.attendance?.total || 200)) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Marks Table */}
              <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest">Subject</th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-center">Total</th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-center">Obtained</th>
                      <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(selectedResult.marks).map(([subject, marks]) => (
                      <tr key={subject} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 font-bold capitalize text-slate-900">{subject}</td>
                        <td className="px-8 py-4 text-center font-medium text-slate-500">100</td>
                        <td className="px-8 py-4 text-center font-black text-slate-900">{marks}</td>
                        <td className="px-8 py-4 text-center">
                          <span className={cn(
                            "inline-block rounded-lg px-3 py-1 text-xs font-black",
                            (marks as number) >= 80 ? "bg-emerald-50 text-emerald-600" :
                            (marks as number) >= 60 ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {getGrade(marks as number)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900 text-white">
                      <td className="px-8 py-6 text-lg font-black uppercase tracking-widest">Grand Total</td>
                      <td className="px-8 py-6 text-center text-lg font-bold">{Object.keys(selectedResult.marks).length * 100}</td>
                      <td className="px-8 py-6 text-center text-2xl font-black">{calculateTotal(selectedResult.marks)}</td>
                      <td className="px-8 py-6 text-center text-2xl font-black text-emerald-400">
                        {calculatePercentage(selectedResult.marks).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer Info */}
              <div className="mt-10 grid grid-cols-2 gap-10">
                <div className="rounded-3xl border border-slate-100 p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Teacher Remarks</p>
                  <p className="mt-4 text-slate-700 italic font-medium">
                    "Excellent performance in all subjects. Very consistent and disciplined. Keep it up!"
                  </p>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedResult.teacher || "Class Incharge"}</p>
                      <p className="text-xs text-slate-500">Verified Result</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-3xl bg-emerald-600 p-8 text-white">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80">Final Grade</p>
                  <p className="mt-2 text-7xl font-black">{getGrade(calculatePercentage(selectedResult.marks))}</p>
                  <p className="mt-4 text-sm font-bold uppercase tracking-widest">Promoted to Next Class</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-16 flex justify-between px-10">
                <div className="text-center">
                  <div className="mb-2 h-px w-48 bg-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Class Teacher</p>
                </div>
                <div className="text-center">
                  <div className="mb-2 h-px w-48 bg-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Principal Signature</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 flex justify-center gap-4 border-t border-slate-100 bg-white/80 p-6 backdrop-blur-md">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-black uppercase tracking-widest text-white hover:bg-slate-800"
              >
                <Printer className="h-5 w-5" /> Print Result
              </button>
              <button className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                <Download className="h-5 w-5" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "entry" && (
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Marks Entry Form</h3>
              <p className="text-sm text-slate-500">Batch Entry Mode</p>
            </div>
            <button className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white">Save All Changes</button>
          </div>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  {students.length > 0 && Object.keys(students[0].marks).map(subject => (
                    <th key={subject} className="px-6 py-4 capitalize">{subject} (Max 100)</th>
                  ))}
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
                    </td>
                  </tr>
                ) : students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                    {Object.entries(s.marks).map(([subject, marks]) => (
                      <td key={subject} className="px-6 py-4">
                        <input
                          type="number"
                          value={marks}
                          onChange={(e) => handleMarkChange(s.id, subject, e.target.value)}
                          className="w-20 rounded-lg border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Add remark..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
