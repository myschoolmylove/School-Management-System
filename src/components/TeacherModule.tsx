import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Search, Filter, UserPlus, Edit2, Trash2, GraduationCap, CheckCircle, XCircle, CreditCard, DollarSign, X, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp, setDoc } from "firebase/firestore";
import { logAction } from "../services/auditService";
import { getSecondaryAuth } from "../lib/authUtils";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  salary: number;
  status: "Active" | "Inactive";
  experience: string;
  email: string;
  phone: string;
  assignedClasses: string[];
  assignedSubjects: string[];
  schoolId: string;
}

export default function TeacherModule({ schoolId }: { schoolId?: string }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    salary: 0,
    status: "Active" as const,
    experience: "",
    email: "",
    phone: "",
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[],
  });

  useEffect(() => {
    if (!schoolId) return;

    const q = query(collection(db, "schools", schoolId, "teachers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teacherList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Teacher[];
      setTeachers(teacherList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setLoading(true);

    try {
      if (editingTeacher) {
        await updateDoc(doc(db, "schools", schoolId, "teachers", editingTeacher.id), {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        await logAction("Updated Teacher", `${formData.name} (ID: ${editingTeacher.id})`, "academic");
      } else {
        // Create Auth user for teacher
        const secondaryAuth = getSecondaryAuth();
        const sanitizedUsername = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const virtualEmail = formData.email || `${sanitizedUsername}@${schoolId}.teacher.com`;
        
        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, virtualEmail, "Teacher@123");
          const uid = userCredential.user.uid;

          await setDoc(doc(db, "users", uid), {
            name: formData.name,
            email: virtualEmail,
            role: "teacher",
            schoolId,
            status: "active",
            createdAt: new Date().toISOString()
          });

          await signOut(secondaryAuth);

          const docRef = await addDoc(collection(db, "schools", schoolId, "teachers"), {
            ...formData,
            email: virtualEmail,
            schoolId,
            authUid: uid,
            createdAt: serverTimestamp(),
          });

          await logAction("Added Teacher", `${formData.name} (ID: ${docRef.id})`, "other");
        } catch (authErr: any) {
          console.error("Auth error:", authErr);
          if (authErr.code === "auth/email-already-in-use") {
             const docRef = await addDoc(collection(db, "schools", schoolId, "teachers"), {
              ...formData,
              email: virtualEmail,
              schoolId,
              createdAt: serverTimestamp(),
            });
            await logAction("Added Teacher (Existing Auth)", `${formData.name} (ID: ${docRef.id})`, "other");
          } else {
            throw authErr;
          }
        }
      }
      setIsModalOpen(false);
      setEditingTeacher(null);
      setFormData({
        name: "",
        subject: "",
        salary: 0,
        status: "Active",
        experience: "",
        email: "",
        phone: "",
        assignedClasses: [],
        assignedSubjects: [],
      });
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      alert(error.message || "Error saving teacher. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!schoolId) return;
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, "schools", schoolId, "teachers", id));
        await logAction("Deleted Teacher", name, "other");
      } catch (error) {
        console.error("Error deleting teacher:", error);
      }
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const totalSalary = teachers.reduce((acc, t) => acc + (t.status === "Active" ? t.salary : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Teacher Management</h3>
          <p className="text-sm text-slate-500">Manage staff profiles, subjects, and salary processing.</p>
        </div>
        <button 
          onClick={() => {
            setEditingTeacher(null);
            setFormData({
              name: "",
              subject: "",
              salary: 0,
              status: "Active",
              experience: "",
              email: "",
              phone: "",
              assignedClasses: [],
              assignedSubjects: [],
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Total Staff", value: teachers.length.toString(), icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
          { label: "Monthly Payroll", value: `Rs ${totalSalary.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
          { label: "Active Teachers", value: teachers.filter(t => t.status === "Active").length.toString(), icon: CheckCircle, color: "text-amber-600 bg-amber-50" },
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
                <th className="px-6 py-4">Primary Subject</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4">Monthly Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No teachers found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
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
                        <button 
                          onClick={() => {
                            setEditingTeacher(t);
                            setFormData({
                              name: t.name,
                              subject: t.subject,
                              salary: t.salary,
                              status: t.status,
                              experience: t.experience,
                              email: t.email || "",
                              phone: t.phone || "",
                              assignedClasses: t.assignedClasses || [],
                              assignedSubjects: t.assignedSubjects || [],
                            });
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id, t.name)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingTeacher ? "Edit Teacher" : "Add New Teacher"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Primary Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Experience</label>
                  <input
                    type="text"
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. 5 Years"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Email (for login)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Assigned Classes</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Playgroup", "Nursery", "Prep", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        const newClasses = formData.assignedClasses.includes(cls)
                          ? formData.assignedClasses.filter(c => c !== cls)
                          : [...formData.assignedClasses, cls];
                        setFormData({ ...formData, assignedClasses: newClasses });
                      }}
                      className={cn(
                        "rounded-lg px-3 py-1 text-xs font-bold transition-all",
                        formData.assignedClasses.includes(cls)
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Assigned Subjects (Comma separated)</label>
                <input
                  type="text"
                  value={formData.assignedSubjects.join(", ")}
                  onChange={(e) => setFormData({ ...formData, assignedSubjects: e.target.value.split(",").map(s => s.trim()).filter(s => s) })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Math, English, Science"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : editingTeacher ? (
                    "Update Teacher"
                  ) : (
                    "Add Teacher"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
