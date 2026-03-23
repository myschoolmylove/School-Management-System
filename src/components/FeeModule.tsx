import { useState } from "react";
import { Plus, Search, Filter, Download, FileText, CheckCircle, Clock, AlertCircle, Trash2, Edit2, MessageCircle, Send, CreditCard, Printer } from "lucide-react";
import { cn } from "../lib/utils";

const initialVouchers = [
  { id: "V001", studentName: "Ali Ahmad", class: "Class 10", section: "A", amount: 3500, dueDate: "2026-04-10", status: "Unpaid" },
  { id: "V002", studentName: "Saima Khan", class: "Class 10", section: "A", amount: 3500, dueDate: "2026-04-10", status: "Paid" },
  { id: "V003", studentName: "Zubair Ali", class: "Class 9", section: "B", amount: 3200, dueDate: "2026-04-10", status: "Unpaid" },
];

export default function FeeModule() {
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [activeTab, setActiveTab] = useState<"vouchers" | "collection">("vouchers");

  return (
    <div className="space-y-8">
      {/* Module Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: "vouchers", label: "Fee Vouchers" },
          { id: "collection", label: "Collection History" },
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Total Expected", value: "Rs 4.2M", icon: CreditCard, color: "text-blue-600 bg-blue-50" },
          { label: "Total Collected", value: "Rs 2.8M", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
          { label: "Total Pending", value: "Rs 1.4M", icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={cn("rounded-xl p-2", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-50 p-6 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-slate-900">Fee Vouchers Management</h3>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <Printer className="h-4 w-4" />
              Bulk Print Vouchers
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <MessageCircle className="h-4 w-4" />
              Send Fee Reminders
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{v.studentName}</td>
                  <td className="px-6 py-4 text-slate-600">{v.class} - {v.section}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">Rs. {v.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">{v.dueDate}</td>
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
                      <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50">
                        <Printer className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
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
