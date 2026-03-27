import React, { useState, useEffect, ChangeEvent } from "react";
import { Plus, Search, Filter, Download, FileText, CheckCircle, Clock, AlertCircle, Trash2, Edit2, MessageCircle, Send, X, Printer, User, School, Loader2, Upload } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, updateDoc, setDoc, addDoc, where, serverTimestamp } from "firebase/firestore";
import { logAction } from "../services/auditService";
import * as XLSX from "xlsx";

interface StudentResult {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  marks: Record<string, number>;
  status: "Draft" | "Published";
  photo?: string;
  attendance?: { present: number; total: number };
  teacher?: string;
  examName: string;
}

export default function SchoolResultsModule({ schoolId, initialTab = "manage" }: { schoolId?: string, initialTab?: "manage" | "entry" }) {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"manage" | "entry">(initialTab);
  const [search, setSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [selectedClass, setSelectedClass] = useState("Class 1");
  const [selectedExam, setSelectedExam] = useState("Monthly Test");
  const [isSaving, setIsSaving] = useState(false);

  const classes = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
  const exams = ["Monthly Test", "Quarterly Exam", "Mid-Term Exam", "Annual Exam"];
  const subjects = ["Math", "English", "Urdu", "Science", "Islamiat", "Social Studies", "Computer"];

  useEffect(() => {
    if (!schoolId) return;
    setIsLoading(true);

    // Fetch Students for the class
    const qStudents = query(
      collection(db, "schools", schoolId, "students"),
      where("class", "==", selectedClass)
    );
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Results for the class/exam
    const qResults = query(
      collection(db, "schools", schoolId, "results"),
      where("class", "==", selectedClass),
      where("examName", "==", selectedExam)
    );
    
    const unsubResults = onSnapshot(qResults, (snapshot) => {
      const resultList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudentResult[];
      setResults(resultList);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching results:", err);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubResults();
    };
  }, [schoolId, selectedClass, selectedExam]);

  const handleMarkChange = async (studentId: string, studentName: string, rollNo: string, subject: string, value: string) => {
    const numValue = parseInt(value) || 0;
    try {
      const existingResult = results.find(r => r.id === studentId || r.rollNo === rollNo);
      
      if (existingResult) {
        const newMarks = { ...existingResult.marks, [subject]: numValue };
        await updateDoc(doc(db, "schools", schoolId!, "results", existingResult.id), {
          marks: newMarks,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new result record
        await setDoc(doc(db, "schools", schoolId!, "results", studentId), {
          name: studentName,
          rollNo: rollNo,
          class: selectedClass,
          examName: selectedExam,
          marks: { [subject]: numValue },
          status: "Draft",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error updating marks:", error);
    }
  };

  const handleBulkUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        for (const row of data) {
          const rollNo = String(row.RollNo || row.roll_no || "");
          if (!rollNo) continue;

          const marks: Record<string, number> = {};
          subjects.forEach(sub => {
            if (row[sub] !== undefined) {
              marks[sub] = parseInt(row[sub]) || 0;
            }
          });

          const existing = results.find(r => r.rollNo === rollNo);
          if (existing) {
            await updateDoc(doc(db, "schools", schoolId, "results", existing.id), {
              marks: { ...existing.marks, ...marks },
              updatedAt: serverTimestamp()
            });
          } else {
            await addDoc(collection(db, "schools", schoolId, "results"), {
              name: row.Name || row.name || "Unknown",
              rollNo,
              class: selectedClass,
              examName: selectedExam,
              marks,
              status: "Draft",
              createdAt: serverTimestamp()
            });
          }
        }
        alert("Marks uploaded successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to upload marks.");
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { RollNo: "101", Name: "Student Name", ...Object.fromEntries(subjects.map(s => [s, 0])) }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks Template");
    XLSX.writeFile(wb, `Marks_Template_${selectedClass}_${selectedExam}.xlsx`);
  };

  const calculateTotal = (marks: Record<string, number>) => Object.values(marks).reduce((a, b) => a + b, 0);
  const calculatePercentage = (marks: Record<string, number>) => {
    const subs = Object.keys(marks).length;
    if (subs === 0) return 0;
    return (calculateTotal(marks) / (subs * 100)) * 100;
  };
  
  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    return "D";
  };

  const filteredResults = results.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Examination & Results</h3>
          <p className="text-sm font-medium text-slate-500">Manage student marks, generate result cards, and publish reports.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1 shrink-0">
            <button
              onClick={() => setActiveTab("manage")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                activeTab === "manage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Manage
            </button>
            <button
              onClick={() => setActiveTab("entry")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                activeTab === "entry" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Marks Entry
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Select Exam</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
          >
            {exams.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Template
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 cursor-pointer">
            <Upload className="h-4 w-4" /> Upload
            <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" />
          </label>
        </div>
      </div>

      {activeTab === "manage" ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700">
              <MessageCircle className="h-4 w-4" /> Send via WhatsApp
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4 text-center">Total</th>
                  <th className="px-6 py-4 text-center">Percentage</th>
                  <th className="px-6 py-4 text-center">Grade</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                    </td>
                  </tr>
                ) : filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No results found for {selectedClass} - {selectedExam}.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((s) => {
                    const total = calculateTotal(s.marks);
                    const percentage = calculatePercentage(s.marks);
                    const maxMarks = Object.keys(s.marks).length * 100;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{s.rollNo}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900">{total}/{maxMarks}</td>
                        <td className="px-6 py-4 text-center text-emerald-600 font-black">{percentage.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                            percentage >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {getGrade(percentage)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedResult(s)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600">
                              <Printer className="h-4 w-4" />
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
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h4 className="font-black text-slate-900 uppercase tracking-widest">Manual Marks Entry</h4>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  {subjects.map(sub => <th key={sub} className="px-4 py-4 text-center">{sub}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={subjects.length + 1} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={subjects.length + 1} className="px-6 py-12 text-center text-slate-500">
                      No students found matching your search in {selectedClass}.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => {
                    const result = results.find(r => r.id === s.id || r.rollNo === s.rollNo);
                    return (
                      <tr key={s.id}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{s.rollNo}</p>
                        </td>
                        {subjects.map(sub => (
                          <td key={sub} className="px-4 py-4">
                            <input 
                              type="number"
                              value={result?.marks?.[sub] ?? ""}
                              onChange={(e) => handleMarkChange(s.id, s.name, s.rollNo, sub, e.target.value)}
                              className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-bold focus:border-emerald-500 focus:outline-none"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result Card Modal (Simplified for brevity, can be expanded like the previous one) */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-10 shadow-2xl">
            <button onClick={() => setSelectedResult(null)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
            <div className="text-center border-b-4 border-emerald-600 pb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Result Card</h2>
              <p className="text-sm font-bold text-slate-500">{selectedExam} - {selectedClass}</p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</p>
                <p className="text-xl font-bold text-slate-900">{selectedResult.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roll Number</p>
                <p className="text-xl font-bold text-slate-900">{selectedResult.rollNo}</p>
              </div>
            </div>
            <table className="mt-8 w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-3 text-center text-xs font-black uppercase tracking-widest">Marks</th>
                  <th className="px-6 py-3 text-center text-xs font-black uppercase tracking-widest">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(selectedResult.marks).map(([sub, marks]) => (
                  <tr key={sub}>
                    <td className="px-6 py-4 font-bold text-slate-700">{sub}</td>
                    <td className="px-6 py-4 text-center font-black text-slate-900">{marks}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{getGrade(marks as number)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-black">
                  <td className="px-6 py-4">Total</td>
                  <td className="px-6 py-4 text-center">{calculateTotal(selectedResult.marks)}</td>
                  <td className="px-6 py-4 text-center text-emerald-600">{calculatePercentage(selectedResult.marks).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-10 flex justify-center gap-4">
              <button onClick={() => window.print()} className="rounded-xl bg-slate-900 px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800">Print</button>
              <button onClick={() => setSelectedResult(null)} className="rounded-xl border border-slate-200 px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
