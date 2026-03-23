import { useState } from "react";
import { Plus, Search, Filter, UserPlus, Edit2, Trash2, MoreVertical, GraduationCap, CheckCircle, XCircle, CreditCard, DollarSign } from "lucide-react";
import { cn } from "../lib/utils";

const initialTeachers = [
  { id: "T001", name: "Sir Ahmad", subject: "Math", salary: 45000, status: "Active", experience: "5 Years" },
  { id: "T002", name: "Miss Saima", subject: "English", salary: 42000, status: "Active", experience: "3 Years" },
  { id: "T003", name: "Sir Iqbal", subject: "Physics", salary: 55000, status: "Active", experience: "8 Years" },
  { id: "T004", name: "Miss Iqra", subject: "Biology", salary: 38000, status: "Inactive", experience: "2 Years" },
];

export default function TeacherModule() {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [search, setSearch] = useState("");

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Teacher Management</h3>
          <p className="text-sm text-slate-500">Manage staff profiles, subjects, and salary processing.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          <UserPlus className="h-4 w-4" />
          Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Total Staff", value: "48", icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
          { label: "Monthly Payroll", value: "Rs 1.8M", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
          { label: "Pending Salaries", value: "Rs 0", icon: CreditCard, color: "text-amber-600 bg-amber-50" },
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
        <div className="flex items-center justify-between border-b border-slate-50 p-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50">
            <Filter className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4">Monthly Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredTeachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-500">ID: {t.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{t.subject}</td>
                  <td className="px-6 py-4 text-slate-600">{t.experience}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">Rs. {t.salary.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {t.status === "Active" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      )}
                      <span className={cn(
                        "font-medium",
                        t.status === "Active" ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {t.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
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
