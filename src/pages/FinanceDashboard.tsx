import React, { useState } from "react";
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "../lib/utils";

const transactions = [
  { id: "TX-101", student: "Ali Khan", class: "10th-A", amount: "Rs 12,500", type: "Fee", status: "Paid", date: "2026-03-20" },
  { id: "TX-102", student: "Sara Ahmed", class: "9th-B", amount: "Rs 8,000", type: "Admission", status: "Pending", date: "2026-03-21" },
  { id: "TX-103", student: "Zain Malik", class: "8th-C", amount: "Rs 12,500", type: "Fee", status: "Paid", date: "2026-03-19" },
  { id: "TX-104", student: "Fatima Noor", class: "10th-A", amount: "Rs 2,500", type: "Fine", status: "Overdue", date: "2026-03-15" },
];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-black/5 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-black/5 px-6">
          <CreditCard className="mr-3 h-6 w-6 text-emerald-600" />
          <span className="text-lg font-bold">Finance Dept</span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {[
            { name: "Overview", icon: TrendingUp },
            { name: "Fee Collection", icon: Users },
            { name: "Invoices", icon: FileText },
            { name: "Reports", icon: Download },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === item.name
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
            <p className="text-slate-500">Track fee collections and school expenses.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export Report
            </button>
            <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
              Generate Invoice
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Revenue", value: "Rs 4.2M", trend: "+12%", up: true, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
            { label: "Fees Collected", value: "Rs 3.8M", trend: "+8%", up: true, icon: CheckCircle, color: "text-blue-600 bg-blue-50" },
            { label: "Outstanding", value: "Rs 450K", trend: "-5%", up: false, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Overdue Fees", value: "Rs 120K", trend: "+2%", up: true, icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={cn("rounded-xl p-2", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "flex items-center gap-1 text-xs font-bold",
                  stat.up ? "text-emerald-600" : "text-rose-600"
                )}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.trend}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="mt-8 rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-50 p-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Fee Collections</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50">
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{tx.id}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{tx.student}</td>
                    <td className="px-6 py-4 text-slate-600">{tx.class}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{tx.amount}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        tx.status === "Paid" ? "bg-emerald-50 text-emerald-600" : 
                        tx.status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
