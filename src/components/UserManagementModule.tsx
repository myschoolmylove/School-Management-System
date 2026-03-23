import React, { useState, useEffect } from "react";
import { UserPlus, Shield, Mail, Trash2, RefreshCw, Plus, X, Lock } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { logAction } from "../services/auditService";

const roles = ["admin", "registrar", "librarian", "finance", "teacher", "parent"];

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  schoolId: string;
  username?: string;
}

export default function UserManagementModule({ schoolId }: { schoolId?: string }) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
    role: "registrar",
    isUsername: false
  });

  useEffect(() => {
    if (!schoolId) return;
    const q = query(
      collection(db, "users"),
      where("schoolId", "==", schoolId),
      where("role", "in", roles)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffUser[];
      setUsers(userList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    try {
      // For Parent/Teacher, we might use a username instead of email
      let loginEmail = newStaff.email.trim();
      if (newStaff.isUsername && (newStaff.role === "parent" || newStaff.role === "teacher")) {
        const sanitizedUsername = loginEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
        loginEmail = `${sanitizedUsername}@${schoolId}.${newStaff.role}.com`;
      }

      // Note: In a real production app, creating users for others should be done via Cloud Functions
      // to avoid signing out the current admin. For this demo, we'll use a simplified approach
      // or assume the admin is creating these accounts.
      
      // For now, we'll just add the profile to Firestore. 
      // In a real scenario, the admin would use a dedicated "Create User" function.
      const tempId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "users", tempId), {
        name: newStaff.name,
        email: loginEmail,
        username: newStaff.isUsername ? newStaff.email : null,
        role: newStaff.role,
        schoolId,
        status: "active",
        createdAt: new Date().toISOString()
      });

      await logAction(
        "Created User Account",
        `User: ${newStaff.name}, Role: ${newStaff.role}`,
        "other"
      );

      setIsModalOpen(false);
      setNewStaff({ name: "", email: "", password: "", role: "registrar", isUsername: false });
      alert(`${newStaff.role.charAt(0).toUpperCase() + newStaff.role.slice(1)} added successfully!`);
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user.");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}'s account?`)) {
      try {
        await deleteDoc(doc(db, "users", id));
        await logAction("Deleted Staff Account", `User: ${name}`, "other");
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">User Management</h3>
          <p className="text-sm text-slate-500">Manage staff accounts and granular permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
        {roles.map((role) => (
          <div key={role} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2">
                <Shield className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold capitalize text-slate-900">{role}</p>
                <p className="text-xs text-slate-500">
                  {users.filter(u => u.role === role).length} Active
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No staff accounts found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold capitalize text-slate-600">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {user.status || "active"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-600" title="Reset Password">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-rose-600" 
                        title="Delete Account"
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

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Add Staff Member</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">
                    {newStaff.isUsername ? "Username / Mobile" : "Email Address"}
                  </label>
                  {(newStaff.role === "parent" || newStaff.role === "teacher") && (
                    <button
                      type="button"
                      onClick={() => setNewStaff({ ...newStaff, isUsername: !newStaff.isUsername })}
                      className="text-[10px] font-bold uppercase text-emerald-600 hover:underline"
                    >
                      Use {newStaff.isUsername ? "Email" : "Username"}
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={newStaff.isUsername ? "text" : "email"}
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder={newStaff.isUsername ? "e.g. 03001234567" : "staff@school.com"}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Initial Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {roles.map(r => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
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
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
