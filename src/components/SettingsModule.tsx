import React, { useState, useEffect, FormEvent } from "react";
import { Save, Loader2, MessageCircle, Settings as SettingsIcon, Shield, Bell, Globe, Phone, Mail, MapPin } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { logAction } from "../services/auditService";

export default function SettingsModule({ schoolId }: { schoolId?: string }) {
  const [schoolData, setSchoolData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"General" | "WhatsApp" | "Security">("General");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    whatsappApiKey: "",
    whatsappInstanceId: "",
    whatsappEnabled: false,
    autoAttendanceAlerts: false,
    autoFeeReminders: false,
    autoResultNotifications: false
  });

  useEffect(() => {
    if (!schoolId) return;
    const unsubscribe = onSnapshot(doc(db, "schools", schoolId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSchoolData(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          whatsappApiKey: data.whatsappApiKey || "",
          whatsappInstanceId: data.whatsappInstanceId || "",
          whatsappEnabled: data.whatsappEnabled || false,
          autoAttendanceAlerts: data.autoAttendanceAlerts || false,
          autoFeeReminders: data.autoFeeReminders || false,
          autoResultNotifications: data.autoResultNotifications || false
        });
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);

    try {
      await updateDoc(doc(db, "schools", schoolId), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      await logAction("Update Settings", `Updated school settings: ${activeTab}`, "other");
      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Settings</h3>
        <p className="text-sm font-medium text-slate-500">Configure your school's profile and integration settings.</p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-2">
          {[
            { id: "General", icon: Globe, label: "School Profile" },
            { id: "WhatsApp", icon: MessageCircle, label: "WhatsApp API" },
            { id: "Security", icon: Shield, label: "Security & Privacy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest transition-all",
                activeTab === tab.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {activeTab === "General" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">School Name</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "WhatsApp" && (
              <div className="space-y-8">
                <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-900">WhatsApp API Integration</h4>
                  </div>
                  <p className="text-xs font-medium text-emerald-700 leading-relaxed">
                    Connect your WhatsApp Business API to enable automated notifications for attendance, fee reminders, and result cards.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">API Key</label>
                    <input
                      type="password"
                      value={formData.whatsappApiKey}
                      onChange={(e) => setFormData({ ...formData, whatsappApiKey: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Instance ID</label>
                    <input
                      type="text"
                      value={formData.whatsappInstanceId}
                      onChange={(e) => setFormData({ ...formData, whatsappInstanceId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                      placeholder="e.g. INST-8293"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Automated Alerts</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { id: "whatsappEnabled", label: "Enable WhatsApp Module" },
                      { id: "autoAttendanceAlerts", label: "Auto Absence Alerts" },
                      { id: "autoFeeReminders", label: "Auto Fee Reminders" },
                      { id: "autoResultNotifications", label: "Auto Result Notifications" },
                    ].map((toggle) => (
                      <label key={toggle.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                        <span className="text-xs font-bold text-slate-700">{toggle.label}</span>
                        <input
                          type="checkbox"
                          checked={(formData as any)[toggle.id]}
                          onChange={(e) => setFormData({ ...formData, [toggle.id]: e.target.checked })}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Security" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-rose-50 p-6 border border-rose-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-5 w-5 text-rose-600" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-rose-900">Security Preferences</h4>
                  </div>
                  <p className="text-xs font-medium text-rose-700 leading-relaxed">
                    Manage how data is accessed and stored within your school's instance.
                  </p>
                </div>
                {/* Add more security settings here if needed */}
                <p className="text-sm font-bold text-slate-500 text-center py-10 italic">Additional security controls coming soon.</p>
              </div>
            )}

            <div className="flex justify-end pt-8 border-t border-slate-50">
              <button
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50 shadow-lg"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
