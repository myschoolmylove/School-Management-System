import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Download, Calendar, DollarSign, Wallet, TrendingUp, TrendingDown, Trash2, Edit2, Loader2, X } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

export default function FinanceModule({ schoolId }: { schoolId?: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"ledger" | "income-exp" | "balance-sheet" | "budgeting" | "assets">("ledger");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "income" as "income" | "expense",
    category: "Fee",
    date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    income: ["Fee", "Admission", "Donation", "Grant", "Other"],
    expense: ["Salary", "Utilities", "Supplies", "Maintenance", "Rent", "Marketing", "Other"]
  };

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "finance"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching finance data:", err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        updatedAt: serverTimestamp()
      };

      if (editingTransaction) {
        await updateDoc(doc(db, "schools", schoolId, "finance", editingTransaction.id), data);
        await logAction("Update Finance", `Updated ${formData.type} entry: ${formData.description}`, "finance");
      } else {
        await addDoc(collection(db, "schools", schoolId, "finance"), {
          ...data,
          createdAt: serverTimestamp()
        });
        await logAction("Add Finance", `Added ${formData.type} entry: ${formData.description}`, "finance");
      }
      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormData({ description: "", amount: "", type: "income", category: "Fee", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error saving transaction:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await deleteDoc(doc(db, "schools", schoolId!, "finance", id));
      await logAction("Delete Finance", `Deleted finance entry ID: ${id}`, "finance");
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-8">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Net Profit/Loss", value: netProfit, icon: Wallet, color: "text-blue-600 bg-blue-50" },
          { label: "Total Income", value: totalIncome, icon: ArrowUpRight, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Expenses", value: totalExpense, icon: ArrowDownRight, color: "text-rose-600 bg-rose-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={cn("rounded-xl p-3", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Rs. {stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Module Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: "ledger", label: "General Ledger" },
          { id: "income-exp", label: "Income & Expenditure" },
          { id: "balance-sheet", label: "Balance Sheet" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "pb-4 text-sm font-bold transition-all",
              activeSubTab === tab.id ? "border-b-2 border-emerald-600 text-emerald-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "ledger" && (
        <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-50 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-900">Financial Ledger</h3>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {(["all", "income", "expense"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all",
                      filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingTransaction(null);
                  setFormData({ description: "", amount: "", type: "income", category: "Fee", date: new Date().toISOString().split('T')[0] });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> Add Entry
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" /></td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500">No transactions found.</td></tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600">{t.date}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{t.description}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{t.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                          t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {t.type === "income" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {t.type}
                        </div>
                      </td>
                      <td className={cn("px-6 py-4 text-right font-bold", t.type === "income" ? "text-emerald-600" : "text-rose-600")}>
                        {t.type === "income" ? "+" : "-"} Rs. {t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingTransaction(t);
                              setFormData({ description: t.description, amount: t.amount.toString(), type: t.type, category: t.category, date: t.date });
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="p-1 text-slate-400 hover:text-rose-600">
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
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingTransaction ? "Edit Entry" : "Add New Entry"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Type</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {["income", "expense"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type as any, category: categories[type as keyof typeof categories][0] })}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                        formData.type === type ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Monthly Fee Collection"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {categories[formData.type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                disabled={isSaving}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : editingTransaction ? "Update Entry" : "Save Entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
