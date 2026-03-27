import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Search, Filter, Download, Trash2, Edit2, UserPlus, CheckCircle, Clock, AlertCircle, X, Loader2, DollarSign, GraduationCap, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface Admission {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  class: string;
  status: "Pending" | "Approved" | "Rejected";
  feeStatus: "Paid" | "Unpaid";
  date: string;
}

export default function AdmissionsModule({ schoolId }: { schoolId?: string }) {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    class: "Class 1",
    status: "Pending" as Admission["status"],
    feeStatus: "Unpaid" as Admission["feeStatus"],
    date: new Date().toISOString().split('T')[0]
  });

  const classes = ["Playgroup", "Nursery", "Prep", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "admissions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Admission[];
      setAdmissions(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching admissions:", err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);

    try {
      await addDoc(collection(db, "schools", schoolId, "admissions"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      await logAction("New Admission", `New admission entry for ${formData.studentName}`, "admission");
      setIsModalOpen(false);
      setFormData({ studentName: "", parentName: "", phone: "", class: "Class 1", status: "Pending", feeStatus: "Unpaid", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error saving admission:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Admission["status"]) => {
    if (!schoolId) return;
    try {
      await updateDoc(doc(db, "schools", schoolId, "admissions", id), { status });
      await logAction("Update Admission Status", `Updated admission ${id} to ${status}`, "admission");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const updateFeeStatus = async (id: string, feeStatus: Admission["feeStatus"]) => {
    if (!schoolId) return;
    try {
      await updateDoc(doc(db, "schools", schoolId, "admissions", id), { feeStatus });
      await logAction("Update Admission Fee", `Updated admission ${id} fee to ${feeStatus}`, "admission");
    } catch (error) {
      console.error("Error updating fee status:", error);
    }
  };

  const filteredAdmissions = admissions.filter(a => 
    a.studentName.toLowerCase().includes(search.toLowerCase()) ||
    a.parentName.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search)
  );

  return (
    <div className="space-y-8">
      {/* FCCU Admission Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Featured Institution
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                  <GraduationCap className="h-8 w-8 text-slate-900" />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-4xl">FCCU Admissions 2026</h2>
                  <p className="text-emerald-400 font-mono text-xs font-bold tracking-widest">FORMAN CHRISTIAN COLLEGE UNIVERSITY</p>
                </div>
              </div>
              <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
                Experience a world-class liberal arts education at one of South Asia's most prestigious institutions. 
                Admissions are now open for Undergraduate, Intermediate, and Postgraduate programs. 
                Legacy of excellence since 1864.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a 
              href="https://www.fccollege.edu.pk/admissions/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95"
            >
              Apply Online <ExternalLink className="h-4 w-4" />
            </a>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-8 py-4 text-sm font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/10">
              View Programs
            </button>
          </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute right-10 bottom-10 opacity-5">
          <GraduationCap className="h-64 w-64 text-white" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Admissions Management</h3>
          <p className="text-sm font-medium text-slate-500">Track and manage new student registrations and admissions.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search admissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={async () => {
              if (!schoolId) return;
              const seedData = [
                { studentName: "Ahmad Ali", parentName: "Ali Ahmad", phone: "03001234567", class: "Class 1", status: "Pending", feeStatus: "Unpaid", date: new Date().toISOString().split('T')[0] },
                { studentName: "Sara Khan", parentName: "Khan Muhammad", phone: "03007654321", class: "Class 2", status: "Approved", feeStatus: "Paid", date: new Date().toISOString().split('T')[0] },
                { studentName: "Zainab Bibi", parentName: "Muhammad Zain", phone: "03119876543", class: "Class 1", status: "Pending", feeStatus: "Unpaid", date: new Date().toISOString().split('T')[0] }
              ];
              for (const data of seedData) {
                await addDoc(collection(db, "schools", schoolId, "admissions"), { ...data, createdAt: serverTimestamp() });
              }
              alert("Seed data added!");
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
          >
            Seed Data
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" /> New Registration
          </button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Total Applications", value: admissions.length, icon: UserPlus, color: "text-blue-600 bg-blue-50" },
          { label: "Pending Review", value: admissions.filter(a => a.status === "Pending").length, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Approved", value: admissions.filter(a => a.status === "Approved").length, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
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
                <th className="px-6 py-4">Parent / Phone</th>
                <th className="px-6 py-4 text-center">Class</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Fee</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" /></td></tr>
              ) : filteredAdmissions.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No matching admission applications found.</td></tr>
              ) : (
                filteredAdmissions.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900 uppercase tracking-tight">{a.studentName}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">{a.parentName}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">{a.class}</td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as any)}
                        className={cn(
                          "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider focus:outline-none",
                          a.status === "Approved" ? "bg-emerald-50 text-emerald-600" :
                          a.status === "Rejected" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                        )}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => updateFeeStatus(a.id, a.feeStatus === "Paid" ? "Unpaid" : "Paid")}
                        className={cn(
                          "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                          a.feeStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}
                      >
                        {a.feeStatus}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteDoc(doc(db, "schools", schoolId!, "admissions", a.id))} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Registration</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Student Name</label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Class for Admission</label>
                <select
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                >
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                disabled={isSaving}
                className="w-full rounded-xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Submit Application"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
