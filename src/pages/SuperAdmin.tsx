import React, { useState, useEffect } from "react";
import { Shield, Users, CreditCard, CheckCircle, XCircle, Search, Filter, MoreVertical, Settings, LayoutDashboard, School, RefreshCw, Plus, X, FileText, GraduationCap, Menu, Copy, ExternalLink, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, setDoc, onSnapshot, orderBy, limit, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, onAuthStateChanged, getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { initializeApp, getApp, getApps } from "firebase/app";
import firebaseConfig from "../../firebase-applet-config.json";

const getSecondaryAuth = () => {
  const secondaryAppName = "SecondaryApp";
  const app = getApps().find(a => a.name === secondaryAppName) || initializeApp(firebaseConfig, secondaryAppName);
  return getAuth(app);
};

const initialSchools = [
  { id: "1", name: "City School LHR", principal: "Ahmad", students: 1240, plan: "Pro", status: "Active", expiry: "2026-12-31" },
  { id: "2", name: "Beaconhouse GJR", principal: "Saima", students: 850, plan: "Pro", status: "Active", expiry: "2026-11-15" },
  { id: "3", name: "Govt High School", principal: "Iqbal", students: 45, plan: "Free", status: "Active", expiry: "N/A" },
  { id: "4", name: "Allied School FSD", principal: "Zubair", students: 600, plan: "Pro", status: "Pending", expiry: "2026-03-25" },
];

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [createdSchoolData, setCreatedSchoolData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditLicenseModalOpen, setIsEditLicenseModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: "",
    principal: "",
    email: "",
    password: "",
    plan: "Free" as "Free" | "Standard" | "Professional" | "Enterprise",
    monthlyPrice: 0
  });

  const [systemConfig, setSystemConfig] = useState({
    basePrice: 30,
    maintenanceMode: false
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      
      // Super Admin check
      if (user.email !== "ernestvdavid@gmail.com") {
        alert("Unauthorized access. Super Admin only.");
        window.location.href = "/";
        return;
      }
      
      const unsubscribeSchools = onSnapshot(collection(db, "schools"), (snapshot) => {
        setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (err) => {
        console.error("Error fetching schools:", err);
        setLoading(false);
      });

      const unsubscribeUsers = onSnapshot(query(collection(db, "users"), where("role", "==", "super")), (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Error fetching users:", err);
      });

      const unsubscribeConfig = onSnapshot(doc(db, "system_config", "settings"), (docSnap) => {
        if (docSnap.exists()) {
          setSystemConfig(docSnap.data() as any);
        } else {
          // Initialize config if it doesn't exist
          setDoc(doc(db, "system_config", "settings"), { basePrice: 30, maintenanceMode: false });
        }
      }, (err) => {
        console.error("Error fetching system config:", err);
      });

      return () => {
        unsubscribeSchools();
        unsubscribeUsers();
        unsubscribeConfig();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const handleSaveSystemSettings = async () => {
    setIsLoading(true);
    try {
      await setDoc(doc(db, "system_config", "settings"), systemConfig);
      alert("System settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [publicAdmissions, setPublicAdmissions] = useState<any[]>([]);
  const [publicApplications, setPublicApplications] = useState<any[]>([]);
  const [publicResults, setPublicResults] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "Public Admissions") {
      const qAdm = query(collection(db, "public_admissions"), orderBy("deadline", "desc"));
      const unsubscribeAdm = onSnapshot(qAdm, (snapshot) => {
        setPublicAdmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Error fetching public admissions:", err);
      });

      const qApp = query(collection(db, "public_applications"), orderBy("createdAt", "desc"));
      const unsubscribeApp = onSnapshot(qApp, (snapshot) => {
        setPublicApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Error fetching public applications:", err);
      });

      const qRes = query(collection(db, "public_results"), limit(50));
      const unsubscribeRes = onSnapshot(qRes, (snapshot) => {
        setPublicResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Error fetching public results:", err);
      });

      return () => {
        unsubscribeAdm();
        unsubscribeApp();
        unsubscribeRes();
      };
    }
  }, [activeTab]);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Create the school document
      const schoolRef = await addDoc(collection(db, "schools"), {
        name: newSchool.name,
        principal: newSchool.principal,
        email: newSchool.email,
        plan: newSchool.plan,
        monthlyPrice: newSchool.monthlyPrice,
        status: "Active",
        students: 0,
        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      // 2. Create the school admin user in Auth using secondary app
      const secondaryAuth = getSecondaryAuth();
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newSchool.email, newSchool.password);
      const uid = userCredential.user.uid;

      // 3. Create the user profile in Firestore
      await setDoc(doc(db, "users", uid), {
        uid,
        email: newSchool.email,
        name: newSchool.principal,
        role: "school",
        schoolId: schoolRef.id,
        createdAt: new Date().toISOString()
      });

      // 4. Sign out the secondary app to avoid session issues
      await signOut(secondaryAuth);

      const schoolData = { ...newSchool, id: schoolRef.id };
      setCreatedSchoolData(schoolData);
      setIsAddModalOpen(false);
      setIsWelcomeModalOpen(true);
      setNewSchool({ name: "", principal: "", email: "", password: "", plan: "Free", monthlyPrice: 0 });
    } catch (err: any) {
      console.error(err);
      alert("Failed to add school: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const approveSchool = (id: string) => {
    setSchools(prev => prev.map(s => 
      s.id === id ? { ...s, status: "Active", plan: "Pro" } : s
    ));
  };

  const refreshPassword = (schoolName: string) => {
    alert(`Password for ${schoolName} has been refreshed to default: School@123`);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
    try {
      await updateDoc(doc(db, "schools", id), { status: newStatus });
      setSchools(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      alert(`School status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const handleUpdateExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "schools", editingSchool.id), {
        expiry: editingSchool.expiry,
        plan: editingSchool.plan,
        discount: editingSchool.discount || 0,
        monthlyPrice: editingSchool.monthlyPrice || 0
      });
      setIsEditLicenseModalOpen(false);
      setEditingSchool(null);
      alert("License expiry updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update expiry date");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-white shadow-2xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
                <div className="flex items-center">
                  <Shield className="mr-3 h-6 w-6 text-emerald-400" />
                  <span className="text-lg font-bold">Super Admin</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto space-y-1 px-4 py-6">
                {[
                  { name: "Dashboard", icon: LayoutDashboard },
                  { name: "Schools", icon: School },
                  { name: "Licensing", icon: CreditCard },
                  { name: "Public Admissions", icon: GraduationCap },
                  { name: "Users", icon: Users },
                  { name: "Audit Logs", icon: FileText },
                  { name: "Settings", icon: Settings },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveTab(item.name);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      activeTab === item.name
                        ? "bg-emerald-600 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-black/5 bg-slate-900 text-white lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Shield className="mr-3 h-6 w-6 text-emerald-400" />
          <span className="text-lg font-bold">Super Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {[
            { name: "Dashboard", icon: LayoutDashboard },
            { name: "Schools", icon: School },
            { name: "Licensing", icon: CreditCard },
            { name: "Public Admissions", icon: GraduationCap },
            { name: "Users", icon: Users },
            { name: "Audit Logs", icon: FileText },
            { name: "Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === item.name
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <header className="flex h-16 items-center justify-between border-b border-black/5 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{activeTab} Management</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 sm:text-sm"
            >
              <span className="hidden sm:inline">Add New School</span>
              <Plus className="h-4 w-4 sm:hidden" />
            </button>
          </div>
        </header>

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Register New School</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
                <form onSubmit={handleAddSchool} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">School Name</label>
                    <input 
                      type="text" 
                      required
                      value={newSchool.name}
                      onChange={e => setNewSchool({...newSchool, name: e.target.value})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. City School LHR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Principal Name</label>
                    <input 
                      type="text" 
                      required
                      value={newSchool.principal}
                      onChange={e => setNewSchool({...newSchool, principal: e.target.value})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Admin Email (Google Email Recommended)</label>
                    <input 
                      type="email" 
                      required
                      value={newSchool.email}
                      onChange={e => setNewSchool({...newSchool, email: e.target.value})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. principal@school.com"
                    />
                    <p className="mt-1 text-[10px] text-slate-400 italic">If this is a Google account, the admin can sign in instantly using Google Login.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Initial Password</label>
                    <input 
                      type="password" 
                      required
                      value={newSchool.password}
                      onChange={e => setNewSchool({...newSchool, password: e.target.value})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. School@123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">License Plan</label>
                    <select 
                      value={newSchool.plan}
                      onChange={e => setNewSchool({...newSchool, plan: e.target.value as any})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Free">Free (50 Students)</option>
                      <option value="Standard">Standard (Rs. 50 - 300 Students)</option>
                      <option value="Professional">Professional (Rs. 40 - Above 300 Students)</option>
                      <option value="Enterprise">Enterprise (Contact Sales)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Monthly Price (Rs.)</label>
                    <input 
                      type="number" 
                      required
                      value={newSchool.monthlyPrice}
                      onChange={e => setNewSchool({...newSchool, monthlyPrice: Number(e.target.value)})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  {newSchool.plan === "Enterprise" ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-600 mb-3">For larger schools, please contact our sales team.</p>
                      <button 
                        type="button"
                        onClick={() => setIsContactModalOpen(true)}
                        className="w-full rounded-xl border border-emerald-600 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50"
                      >
                        Contact Sales
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="submit"
                      className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-all"
                    >
                      Register School & Create Admin
                    </button>
                  )}
                </form>
            </div>
          </div>
        )}

        {/* Welcome Kit Modal */}
        {isWelcomeModalOpen && createdSchoolData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="bg-emerald-600 p-6 text-center text-white">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold">School Registered!</h3>
                <p className="mt-1 text-emerald-100">Welcome Kit for {createdSchoolData.name}</p>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div className="rounded-2xl bg-slate-50 p-6 space-y-4 border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Login URL</p>
                      <p className="mt-1 text-sm font-medium text-emerald-600 break-all">{window.location.origin}/login</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Email</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{createdSchoolData.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Initial Password</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{createdSchoolData.password}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const text = `Welcome to our School Management System!\n\nYour school "${createdSchoolData.name}" has been registered.\n\nLogin URL: ${window.location.origin}/login\nEmail: ${createdSchoolData.email}\nPassword: ${createdSchoolData.password}\n\nYou can also sign in instantly using your Google account if this is a Google email.\n\nBest regards,\nSuper Admin`;
                        navigator.clipboard.writeText(text);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800"
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {isCopied ? "Copied to Clipboard" : "Copy Welcome Message"}
                    </button>

                    <a 
                      href={`mailto:${createdSchoolData.email}?subject=Welcome to School Management System&body=Hello ${createdSchoolData.principal},%0D%0A%0D%0AYour school "${createdSchoolData.name}" has been registered on our platform.%0D%0A%0D%0ALogin URL: ${window.location.origin}/login%0D%0AEmail: ${createdSchoolData.email}%0D%0APassword: ${createdSchoolData.password}%0D%0A%0D%0AYou can also sign in instantly using your Google account if this is a Google email.%0D%0A%0D%0ABest regards,%0D%0ASuper Admin`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Send via Email Client
                    </a>

                    <button 
                      onClick={() => setIsWelcomeModalOpen(false)}
                      className="w-full py-2 text-sm font-medium text-slate-400 hover:text-slate-600"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="p-8">
          {activeTab === "Dashboard" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Schools", value: schools.length.toString(), change: "+4", icon: School, color: "text-blue-600 bg-blue-50" },
                  { label: "Total Students", value: schools.reduce((acc, s) => acc + s.students, 0).toLocaleString(), change: "+1.2k", icon: Users, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Active Licenses", value: schools.filter(s => s.status === "Active").length.toString(), change: "+2", icon: CheckCircle, color: "text-purple-600 bg-purple-50" },
                  { label: "Monthly Revenue", value: "Rs 1.2M", change: "+15%", icon: CreditCard, color: "text-orange-600 bg-orange-50" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className={cn("rounded-xl p-2", stat.color)}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{stat.change}</span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="col-span-2 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Recent School Signups</h3>
                  <div className="mt-6 space-y-4">
                    {schools.slice(0, 5).map((school) => (
                      <div key={school.id} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                            {school.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{school.name}</p>
                            <p className="text-xs text-slate-500">{school.principal} • {school.plan} Plan</p>
                          </div>
                        </div>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          school.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                        )}>
                          {school.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">System Alerts</h3>
                  <div className="mt-6 space-y-4">
                    {[
                      { title: "License Expiry", desc: "4 schools expiring in 7 days", type: "warning" },
                      { title: "Server Load", desc: "Normal - 24% capacity", type: "info" },
                      { title: "Pending Approvals", desc: "2 new schools waiting", type: "action" },
                    ].map((alert, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-900">{alert.title}</p>
                        <p className="text-xs text-slate-500">{alert.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Schools" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  { label: "Total Schools", value: schools.length.toString(), icon: School, color: "text-blue-600 bg-blue-50" },
                  { label: "Active Licenses", value: schools.filter(s => s.status === "Active").length.toString(), icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Monthly Revenue", value: "Rs 1.2M", icon: CreditCard, color: "text-purple-600 bg-purple-50" },
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

              {/* School Table */}
              <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-50 p-6">
                  <h3 className="text-lg font-bold text-slate-900">Registered Schools</h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search schools..."
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
                        <th className="px-6 py-4">School Name</th>
                        <th className="px-6 py-4">Principal</th>
                        <th className="px-6 py-4">Students</th>
                        <th className="px-6 py-4">Plan</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Expiry</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {schools.map((school) => (
                        <tr key={school.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{school.name}</div>
                            <div className="text-xs text-slate-500">ID: {school.id}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{school.principal}</td>
                          <td className="px-6 py-4 font-medium text-slate-900">{school.students}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                              school.plan === "Pro" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                            )}>
                              {school.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {school.status === "Pending" ? (
                                <button 
                                  onClick={() => approveSchool(school.id)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  <span className="font-medium text-emerald-600">{school.status}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{school.expiry}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => navigate(`/admin?schoolId=${school.id}`)}
                                className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-600"
                                title="Open School Dashboard"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleStatus(school.id, school.status)}
                                className={cn(
                                  "rounded-lg border border-slate-200 p-2 transition-colors",
                                  school.status === "Active" ? "text-slate-400 hover:bg-slate-50 hover:text-rose-600" : "text-emerald-600 hover:bg-emerald-50"
                                )}
                                title={school.status === "Active" ? "Suspend School" : "Activate School"}
                              >
                                {school.status === "Active" ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </button>
                              <button 
                                onClick={() => refreshPassword(school.name)}
                                className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-emerald-600"
                                title="Refresh Password"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <MoreVertical className="h-5 w-5" />
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
          )}

          {activeTab === "Licensing" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-50 p-6">
                  <h3 className="text-lg font-bold text-slate-900">License Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-6 py-4">School</th>
                        <th className="px-6 py-4">Current Plan</th>
                        <th className="px-6 py-4">Expiry Date</th>
                        <th className="px-6 py-4">Billing Cycle</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {schools.map((school) => (
                        <tr key={school.id}>
                          <td className="px-6 py-4 font-bold text-slate-900">{school.name}</td>
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                              {school.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{school.expiry}</td>
                          <td className="px-6 py-4 text-slate-600">Annual</td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {school.plan === "Free" ? "Rs. 0" : 
                             school.plan === "Standard" ? "Rs. 50 / student" : 
                             school.plan === "Professional" ? "Rs. 40 / student" : 
                             "Custom"}
                            {school.discount > 0 && (
                              <span className="ml-2 text-xs font-normal text-rose-500">
                                (-{school.discount}%)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                setEditingSchool(school);
                                setIsEditLicenseModalOpen(true);
                              }}
                              className="text-emerald-600 hover:underline font-bold"
                            >
                              Renew/Upgrade
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Public Admissions" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Public Admission Notices</h3>
                <button 
                  onClick={async () => {
                    const title = window.prompt("Enter Admission Title:");
                    if (!title) return;
                    const type = window.prompt("Enter Type (School/College/University):", "School");
                    const location = window.prompt("Enter Location:", "Lahore");
                    const deadline = window.prompt("Enter Deadline (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                    const desc = window.prompt("Enter Description:");
                    
                    try {
                      await addDoc(collection(db, "public_admissions"), {
                        title, type, location, deadline, desc,
                        createdAt: new Date().toISOString()
                      });
                      alert("Admission notice added!");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to add admission notice");
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Admission Notice
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publicAdmissions.map((adm) => (
                  <div key={adm.id} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-600">
                        {adm.type}
                      </span>
                      <button 
                        onClick={async () => {
                          if (window.confirm("Delete this admission notice?")) {
                            await updateDoc(doc(db, "public_admissions", adm.id), { status: 'deleted' }); // Or actually delete
                            // For simplicity in this demo, let's just delete
                            // await deleteDoc(doc(db, "public_admissions", adm.id));
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-900">{adm.title}</h4>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{adm.desc}</p>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>{adm.location}</span>
                      <span className="text-rose-600">Deadline: {adm.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Public Applications</h3>
                <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Parent</th>
                          <th className="px-6 py-4">Contact</th>
                          <th className="px-6 py-4">Admission</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {publicApplications.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No applications received yet.</td>
                          </tr>
                        ) : publicApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{app.studentName}</div>
                              <div className="text-xs text-slate-500">{app.class}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{app.parentName}</td>
                            <td className="px-6 py-4">
                              <div className="text-slate-900 font-medium">{app.phone}</div>
                              <div className="text-xs text-slate-500">{app.email}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{app.admissionTitle}</td>
                            <td className="px-6 py-4">
                              <select 
                                value={app.status}
                                onChange={async (e) => {
                                  await updateDoc(doc(db, "public_applications", app.id), { status: e.target.value });
                                }}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              >
                                <option value="Received">Received</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Closed">Closed</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : new Date(app.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Public Board Results</h3>
                  <button 
                    onClick={async () => {
                      const rollNo = window.prompt("Enter Roll Number:");
                      if (!rollNo) return;
                      const studentName = window.prompt("Enter Student Name:");
                      const board = window.prompt("Enter Board (e.g. BISE Lahore):", "BISE Lahore");
                      const year = window.prompt("Enter Year (e.g. 2026):", "2026");
                      const session = window.prompt("Enter Session (Annual/Supplementary):", "Annual");
                      const marks = Number(window.prompt("Enter Marks:", "0"));
                      const totalMarks = Number(window.prompt("Enter Total Marks:", "1100"));
                      const grade = window.prompt("Enter Grade (e.g. A+):", "A");
                      
                      try {
                        await addDoc(collection(db, "public_results"), {
                          rollNo, studentName, board, year, session, marks, totalMarks, grade,
                          status: marks >= (totalMarks * 0.33) ? "Pass" : "Fail",
                          createdAt: new Date().toISOString()
                        });
                        alert("Result added!");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to add result");
                      }
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Result
                  </button>
                </div>
                <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Roll No</th>
                          <th className="px-6 py-4">Student Name</th>
                          <th className="px-6 py-4">Board / Year</th>
                          <th className="px-6 py-4">Marks</th>
                          <th className="px-6 py-4">Grade</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-sm">
                        {publicResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No results found.</td>
                          </tr>
                        ) : publicResults.map((res) => (
                          <tr key={res.id}>
                            <td className="px-6 py-4 font-bold text-slate-900">{res.rollNo}</td>
                            <td className="px-6 py-4 text-slate-600">{res.studentName}</td>
                            <td className="px-6 py-4 text-slate-600">
                              <div className="font-bold">{res.board}</div>
                              <div className="text-xs">{res.year} ({res.session})</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{res.marks}/{res.totalMarks}</td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">{res.grade}</span>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={async () => {
                                  if (window.confirm("Delete this result?")) {
                                    await deleteDoc(doc(db, "public_results", res.id));
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Super Admin Users</h3>
                <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                  Invite New Admin
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                  <div key={user.email} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                        {user.name?.[0] || user.email?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name || "Unnamed User"}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                      <span className="text-xs font-bold text-slate-400 uppercase">{user.role} Admin</span>
                      <span className="text-xs font-bold text-emerald-600">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Audit Logs" && (
            <div className="p-8">
              <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Details</th>
                        <th className="px-6 py-4">Module</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No logs found.</td>
                        </tr>
                      ) : auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-slate-500">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{log.action}</td>
                          <td className="px-6 py-4 text-slate-600">{log.details}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                              log.module === "admission" ? "bg-emerald-50 text-emerald-600" :
                              log.module === "whatsapp" ? "bg-blue-50 text-blue-600" :
                              "bg-slate-50 text-slate-600"
                            )}>
                              {log.module}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="max-w-2xl space-y-8">
              <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">System Configuration</h3>
                <div className="mt-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Base Price Per Student (Monthly)</label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-slate-400 font-bold">Rs.</span>
                      <input 
                        type="number" 
                        value={systemConfig.basePrice} 
                        onChange={(e) => setSystemConfig({...systemConfig, basePrice: parseInt(e.target.value)})}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Maintenance Mode</label>
                    <p className="text-xs text-slate-500 mb-2">When enabled, only Super Admins can log in. All other users will see a maintenance message.</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button 
                        onClick={() => setSystemConfig({...systemConfig, maintenanceMode: !systemConfig.maintenanceMode})}
                        className={cn(
                          "h-6 w-11 rounded-full transition-colors relative",
                          systemConfig.maintenanceMode ? "bg-emerald-600" : "bg-slate-200"
                        )}
                      >
                        <span className={cn(
                          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                          systemConfig.maintenanceMode ? "left-6" : "left-1"
                        )} />
                      </button>
                      <span className="text-sm text-slate-500">Enable maintenance mode for all schools</span>
                    </div>
                  </div>
                  <div className="pt-6">
                    <button 
                      onClick={handleSaveSystemSettings}
                      disabled={isLoading}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : "Save System Settings"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">System Maintenance</h3>
                <p className="mt-2 text-sm text-slate-500">Synchronize parent accounts and link them to students based on usernames.</p>
                <div className="mt-6 flex flex-col gap-4">
                  <button 
                    onClick={async () => {
                      if (!window.confirm("This will scan all students and ensure parent accounts are correctly linked. Continue?")) return;
                      setIsLoading(true);
                      try {
                        const schoolsSnap = await getDocs(collection(db, "schools"));
                        let totalFixed = 0;
                        const secondaryAuth = getSecondaryAuth();

                        for (const schoolDoc of schoolsSnap.docs) {
                          const schoolId = schoolDoc.id;
                          const studentsSnap = await getDocs(collection(db, "schools", schoolId, "students"));
                          
                          for (const studentDoc of studentsSnap.docs) {
                            const studentData = studentDoc.data();
                            const parentUsername = studentData.parentUsername || studentData.rollNo;
                            
                            if (parentUsername) {
                              const sanitizedUsername = parentUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');
                              const virtualEmail = `${sanitizedUsername}@${schoolId}.parent.com`;
                              
                              let parentUid = studentData.parentUid || "";
                              
                              // Check if parent account exists in Firestore
                              const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", virtualEmail)));
                              
                              if (usersSnap.empty) {
                                // Create parent account
                                try {
                                  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, virtualEmail, "Parent@123");
                                  parentUid = userCredential.user.uid;
                                  
                                  await setDoc(doc(db, "users", parentUid), {
                                    uid: parentUid,
                                    name: `${studentData.name}'s Parent`,
                                    email: virtualEmail,
                                    username: parentUsername,
                                    role: "parent",
                                    schoolId,
                                    studentId: studentDoc.id,
                                    status: "active",
                                    createdAt: new Date().toISOString()
                                  });
                                  totalFixed++;
                                } catch (authErr: any) {
                                  if (authErr.code === "auth/email-already-in-use") {
                                    // Should have been found in usersSnap, but maybe role was wrong?
                                    // We'll skip for now or log
                                  }
                                }
                              } else {
                                parentUid = usersSnap.docs[0].id;
                                // Update studentId if missing
                                if (!usersSnap.docs[0].data().studentId) {
                                  await updateDoc(doc(db, "users", parentUid), { studentId: studentDoc.id });
                                  totalFixed++;
                                }
                              }

                              // Update student doc if parentUid is missing or different
                              if (studentData.parentUid !== parentUid) {
                                await updateDoc(studentDoc.ref, { parentUid });
                                totalFixed++;
                              }
                            }
                          }
                        }
                        await signOut(secondaryAuth);
                        alert(`Maintenance complete! Synchronized ${totalFixed} records.`);
                      } catch (err) {
                        console.error(err);
                        alert("Maintenance failed: " + (err instanceof Error ? err.message : "Unknown error"));
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-600 px-6 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    {isLoading ? "Synchronizing..." : "Fix Parent Accounts & Links"}
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    <RefreshCw className="h-4 w-4" />
                    Generate Full Backup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit License Modal */}
        <AnimatePresence>
          {isEditLicenseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Edit License Expiry</h3>
                  <button onClick={() => setIsEditLicenseModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleUpdateExpiry} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">School Name</label>
                    <input 
                      type="text" 
                      disabled
                      value={editingSchool?.name || ""} 
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">License Plan</label>
                    <select 
                      value={editingSchool?.plan || "Free"}
                      onChange={(e) => setEditingSchool({...editingSchool, plan: e.target.value})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="Free">Free (50 Students)</option>
                      <option value="Standard">Standard (Rs. 50 - 300 Students)</option>
                      <option value="Professional">Professional (Rs. 40 - Above 300 Students)</option>
                      <option value="Enterprise">Enterprise (Contact Sales)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Discount (%) - <span className="text-slate-400 italic">Internal Only</span></label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={editingSchool?.discount || 0} 
                      onChange={(e) => setEditingSchool({...editingSchool, discount: parseInt(e.target.value) || 0})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Monthly Price (Rs.)</label>
                    <input 
                      type="number" 
                      value={editingSchool?.monthlyPrice || 0} 
                      onChange={(e) => setEditingSchool({...editingSchool, monthlyPrice: Number(e.target.value)})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Expiry Date</label>
                    <input 
                      type="date" 
                      required
                      value={editingSchool?.expiry || ""} 
                      onChange={(e) => setEditingSchool({...editingSchool, expiry: e.target.value})}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditLicenseModalOpen(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : "Update License"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Contact Sales Modal */}
        <AnimatePresence>
          {isContactModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Contact Sales</h3>
                  <button onClick={() => setIsContactModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Please send an email with your school details to our sales team.
                  </p>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Recipient</p>
                    <p className="text-sm font-medium text-slate-900">ernestvdavid@gmail.com</p>
                  </div>
                  <a 
                    href="mailto:ernestvdavid@gmail.com?subject=Enterprise License Inquiry&body=Hello, I would like to inquire about an Enterprise license for my school."
                    className="block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700 transition-all"
                  >
                    Open Email Client
                  </a>
                  <button 
                    onClick={() => setIsContactModalOpen(false)}
                    className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
