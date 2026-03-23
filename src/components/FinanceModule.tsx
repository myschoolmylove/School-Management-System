import { useState } from "react";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Download, Calendar, DollarSign, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Transaction, TransactionType } from "../types";
import { cn } from "../lib/utils";

const initialTransactions: Transaction[] = [
  { id: "1", date: "2026-03-20", description: "Fee Collection - Class 5A", amount: 45000, type: "income", category: "Fee" },
  { id: "2", date: "2026-03-19", description: "Teacher Salary - Mr. Ahmad", amount: 35000, type: "expense", category: "Salary" },
  { id: "3", date: "2026-03-18", description: "Electricity Bill - Feb", amount: 12000, type: "expense", category: "Utilities" },
  { id: "4", date: "2026-03-17", description: "New Admission - Play Group", amount: 15000, type: "income", category: "Admission" },
  { id: "5", date: "2026-03-16", description: "Stationery Purchase", amount: 5000, type: "expense", category: "Supplies" },
];

export default function FinanceModule() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [activeSubTab, setActiveSubTab] = useState<"ledger" | "income-exp" | "balance-sheet" | "budgeting" | "assets">("ledger");
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [search, setSearch] = useState("");

  const budgets = [
    { category: "Salaries", planned: 1800000, actual: 1750000 },
    { category: "Utilities", planned: 50000, actual: 55000 },
    { category: "Maintenance", planned: 30000, actual: 12000 },
    { category: "Marketing", planned: 100000, actual: 85000 },
  ];

  const assets = [
    { name: "Main Building", value: 25000000, type: "Fixed" },
    { name: "School Bus (2)", value: 8000000, type: "Fixed" },
    { name: "Computer Lab (20 PCs)", value: 1500000, type: "Fixed" },
    { name: "Furniture", value: 2000000, type: "Fixed" },
  ];

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Grouped data for Income & Exp
  const incomeByCategory = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Net Profit/Loss", value: netProfit, icon: Wallet, color: "text-blue-600 bg-blue-50", trend: TrendingUp },
          { label: "Total Income", value: totalIncome, icon: ArrowUpRight, color: "text-emerald-600 bg-emerald-50", trend: TrendingUp },
          { label: "Total Expenses", value: totalExpense, icon: ArrowDownRight, color: "text-rose-600 bg-rose-50", trend: TrendingDown },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={cn("rounded-xl p-3", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <stat.trend className={cn("h-4 w-4", stat.value < 0 ? "text-rose-500" : "text-emerald-500")} />
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
          { id: "budgeting", label: "Budgeting" },
          { id: "assets", label: "Asset Management" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "pb-4 text-sm font-bold transition-all",
              activeSubTab === tab.id
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-400 hover:text-slate-600"
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
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Add Entry
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600">{t.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{t.description}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {t.category}
                      </span>
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
                    <td className={cn(
                      "px-6 py-4 text-right font-bold",
                      t.type === "income" ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {t.type === "income" ? "+" : "-"} Rs. {t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "income-exp" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Income Section */}
          <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Income Statement</h3>
              <span className="text-sm font-bold text-emerald-600">Total: Rs. {totalIncome.toLocaleString()}</span>
            </div>
            <div className="mt-6 space-y-4">
              {Object.entries(incomeByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{category}</span>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-emerald-500" style={{ width: `${totalIncome > 0 ? ((amount as number) / totalIncome) * 100 : 0}%` }} />
                    </div>
                    <span className="w-24 text-right text-sm font-bold text-slate-900">Rs. {amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expenditure Section */}
          <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Expenditure Statement</h3>
              <span className="text-sm font-bold text-rose-600">Total: Rs. {totalExpense.toLocaleString()}</span>
            </div>
            <div className="mt-6 space-y-4">
              {Object.entries(expenseByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{category}</span>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-rose-500" style={{ width: `${totalExpense > 0 ? ((amount as number) / totalExpense) * 100 : 0}%` }} />
                    </div>
                    <span className="w-24 text-right text-sm font-bold text-slate-900">Rs. {amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "balance-sheet" && (
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Balance Sheet</h3>
              <p className="text-sm text-slate-500">As of {new Date().toLocaleDateString()}</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Assets */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Assets</h4>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Cash in Hand</span>
                  <span className="font-bold text-slate-900">Rs. {(netProfit * 0.2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Bank Balance</span>
                  <span className="font-bold text-slate-900">Rs. {(netProfit * 0.8).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Accounts Receivable (Fees)</span>
                  <span className="font-bold text-slate-900">Rs. 150,000</span>
                </div>
                <div className="flex justify-between pt-4">
                  <span className="font-bold text-slate-900">Total Assets</span>
                  <span className="text-lg font-bold text-emerald-600">Rs. {(netProfit + 150000).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Liabilities & Equity</h4>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Accounts Payable</span>
                  <span className="font-bold text-slate-900">Rs. 25,000</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Retained Earnings</span>
                  <span className="font-bold text-slate-900">Rs. {netProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-600">Initial Capital</span>
                  <span className="font-bold text-slate-900">Rs. 125,000</span>
                </div>
                <div className="flex justify-between pt-4">
                  <span className="font-bold text-slate-900">Total Liabilities & Equity</span>
                  <span className="text-lg font-bold text-blue-600">Rs. {(netProfit + 150000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "budgeting" && (
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <h3 className="text-xl font-bold text-slate-900">Budget vs Actual</h3>
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Create New Budget</button>
          </div>
          <div className="mt-8 space-y-6">
            {budgets.map((b) => (
              <div key={b.category} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-900">{b.category}</span>
                  <span className={cn(
                    b.actual > b.planned ? "text-rose-600" : "text-emerald-600"
                  )}>
                    Rs. {b.actual.toLocaleString()} / {b.planned.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      b.actual > b.planned ? "bg-rose-500" : "bg-emerald-500"
                    )} 
                    style={{ width: `${Math.min((b.actual / b.planned) * 100, 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400">
                  <span>Usage: {((b.actual / b.planned) * 100).toFixed(1)}%</span>
                  <span>Remaining: Rs. {Math.max(b.planned - b.actual, 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "assets" && (
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <h3 className="text-xl font-bold text-slate-900">Fixed Assets Register</h3>
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Add Asset</button>
          </div>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Asset Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Current Value</th>
                  <th className="px-6 py-4 text-right">Depreciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {assets.map((a) => (
                  <tr key={a.name}>
                    <td className="px-6 py-4 font-bold text-slate-900">{a.name}</td>
                    <td className="px-6 py-4 text-slate-600">{a.type}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">Rs. {a.value.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-rose-600">-5% Annual</td>
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
