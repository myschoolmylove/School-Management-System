import React, { useState, useEffect, useRef, FormEvent } from "react";
import { Plus, Search, Filter, Download, FileText, CheckCircle, Clock, AlertCircle, Trash2, Edit2, MessageCircle, Send, CreditCard, Printer, X, Loader2, User, School } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, where, orderBy } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface FeeVoucher {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  class: string;
  section: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Unpaid";
  month: string;
  year: string;
}

export default function FeeModule({ schoolId }: { schoolId?: string }) {
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vouchers" | "collection">("vouchers");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<FeeVoucher | null>(null);
  const voucherRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    studentId: "",
    amount: "",
    dueDate: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString()
  });

  useEffect(() => {
    if (!schoolId) return;
    
    // Fetch Vouchers
    const vQuery = query(collection(db, "schools", schoolId, "vouchers"), orderBy("createdAt", "desc"));
    const vUnsubscribe = onSnapshot(vQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeeVoucher[];
      setVouchers(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching vouchers:", err);
      setIsLoading(false);
    });

    // Fetch Students for selection
    const sQuery = query(collection(db, "schools", schoolId, "students"));
    const sUnsubscribe = onSnapshot(sQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(list);
    });

    return () => {
      vUnsubscribe();
      sUnsubscribe();
    };
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);

    try {
      const student = students.find(s => s.id === formData.studentId);
      if (!student) throw new Error("Student not found");

      await addDoc(collection(db, "schools", schoolId, "vouchers"), {
        studentId: student.id,
        studentName: student.name,
        rollNo: student.rollNo,
        class: student.class,
        section: student.section || "",
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        month: formData.month,
        year: formData.year,
        status: "Unpaid",
        createdAt: serverTimestamp()
      });

      await logAction("Generate Voucher", `Generated voucher for ${student.name} - ${formData.month} ${formData.year}`, "finance");
      setIsModalOpen(false);
      setFormData({ ...formData, studentId: "", amount: "" });
    } catch (error) {
      console.error("Error generating voucher:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const markAsPaid = async (id: string) => {
    if (!schoolId) return;
    try {
      await updateDoc(doc(db, "schools", schoolId, "vouchers", id), {
        status: "Paid",
        paidAt: serverTimestamp()
      });
      await logAction("Mark Paid", `Marked voucher ${id} as paid`, "finance");
    } catch (error) {
      console.error("Error marking as paid:", error);
    }
  };

  const handlePrint = (voucher: FeeVoucher) => {
    setSelectedVoucher(voucher);
    setTimeout(() => {
      const printContent = document.getElementById('printable-voucher');
      if (!printContent) return;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Fee Voucher - ${voucher.studentName}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body { margin: 0; padding: 20px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body class="p-8">
              ${printContent.innerHTML}
              <script>
                window.onload = () => {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }, 100);
  };

  const totalExpected = vouchers.reduce((acc, v) => acc + v.amount, 0);
  const totalCollected = vouchers.filter(v => v.status === "Paid").reduce((acc, v) => acc + v.amount, 0);
  const totalPending = totalExpected - totalCollected;

  const filteredVouchers = vouchers.filter(v => 
    v.studentName.toLowerCase().includes(search.toLowerCase()) ||
    v.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Total Expected", value: totalExpected, icon: CreditCard, color: "text-blue-600 bg-blue-50" },
          { label: "Total Collected", value: totalCollected, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Pending", value: totalPending, icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={cn("rounded-xl p-2", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Rs. {stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-50 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center flex-1">
            <h3 className="text-lg font-bold text-slate-900 shrink-0">Fee Management</h3>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student or roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" /> Generate Voucher
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Month/Year</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" /></td></tr>
              ) : filteredVouchers.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No matching vouchers found.</td></tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{v.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{v.class} - {v.section}</td>
                    <td className="px-6 py-4 text-slate-600">{v.month} {v.year}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">Rs. {v.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                        v.status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {v.status === "Unpaid" && (
                          <button 
                            onClick={() => markAsPaid(v.id)}
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrint(v)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                        >
                          <Printer className="h-4 w-4" />
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

      {/* Generate Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Generate Fee Voucher</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Select Student</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Choose Student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNo}) - {s.class}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                disabled={isSaving}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Generate Voucher"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Printable Voucher */}
      <div id="printable-voucher" className="hidden">
        {selectedVoucher && (
          <div className="max-w-2xl mx-auto border-4 border-slate-900 p-10 rounded-3xl bg-white shadow-2xl">
            <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-8">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">City School</h1>
                <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Fee Voucher - Student Copy</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Voucher ID</p>
                <p className="text-xl font-bold text-slate-900">{selectedVoucher.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mt-10">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</p>
                  <p className="text-xl font-bold text-slate-900">{selectedVoucher.studentName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Roll Number</p>
                  <p className="text-xl font-bold text-slate-900">{selectedVoucher.rollNo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class & Section</p>
                  <p className="text-xl font-bold text-slate-900">{selectedVoucher.class} - {selectedVoucher.section}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fee Month</p>
                  <p className="text-xl font-bold text-slate-900">{selectedVoucher.month} {selectedVoucher.year}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</p>
                  <p className="text-xl font-bold text-rose-600">{selectedVoucher.dueDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                  <p className={cn("text-xl font-black uppercase", selectedVoucher.status === "Paid" ? "text-emerald-600" : "text-rose-600")}>
                    {selectedVoucher.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-slate-50 rounded-2xl p-8 border-2 border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-600 uppercase tracking-widest">Total Payable Amount</span>
                <span className="text-3xl font-black text-slate-900">Rs. {selectedVoucher.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-10 pt-10 border-t border-slate-100">
              <div className="text-center">
                <div className="h-px bg-slate-300 w-full mb-2"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Signature</p>
              </div>
              <div className="text-center">
                <div className="h-px bg-slate-300 w-full mb-2"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bank/Cashier Stamp</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
