import React, { useState, useEffect } from "react";
import { Smartphone, MessageCircle, Bell, Clock, CheckCircle, AlertCircle, Send, Settings, Search, Filter, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, addDoc, orderBy, limit } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface WhatsAppAlert {
  id: string;
  type: string;
  recipient: string;
  phone: string;
  status: "Sent" | "Delivered" | "Failed";
  timestamp: string;
}

export default function WhatsAppModule() {
  const [alerts, setAlerts] = useState<WhatsAppAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient: "",
    phone: "",
    type: "Manual Message",
    content: ""
  });

  useEffect(() => {
    const q = query(collection(db, "whatsapp_logs"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WhatsAppAlert[];
      setAlerts(alertList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulate sending via API
      await addDoc(collection(db, "whatsapp_logs"), {
        type: newMessage.type,
        recipient: newMessage.recipient,
        phone: newMessage.phone,
        status: "Sent",
        timestamp: new Date().toISOString()
      });
      
      await logAction("Sent WhatsApp Message", `To: ${newMessage.recipient}`, "whatsapp");
      setIsModalOpen(false);
      setNewMessage({ recipient: "", phone: "", type: "Manual Message", content: "" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const filteredAlerts = alerts.filter(a => 
    a.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm) ||
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">WhatsApp Alerts</h3>
          <p className="text-sm text-slate-500">Automated messaging for attendance, fees, and results.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
            <Settings className="h-4 w-4" /> API Settings
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Send Bulk Message
          </button>
        </div>
      </div>

      {/* Integration Status */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Smartphone className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">API Status</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">WhatsApp API v2.4</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600 w-fit">
            <MessageCircle className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Messages Sent (Today)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{alerts.length}</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-amber-50 p-2 text-amber-600 w-fit">
            <Clock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Scheduled Alerts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">48</p>
        </div>
      </div>

      {/* Alert Rules */}
      <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Automated Rules</h3>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: "Fee Reminder", desc: "Send 3 days before due date", icon: Bell, active: true },
            { title: "Absence Alert", desc: "Send instantly when absent", icon: AlertCircle, active: true },
            { title: "Result Card", desc: "Send when results are published", icon: CheckCircle, active: false },
          ].map((rule) => (
            <div key={rule.title} className="flex items-start gap-4 rounded-xl border border-slate-100 p-4">
              <div className={cn(
                "rounded-lg p-2",
                rule.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
              )}>
                <rule.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{rule.title}</p>
                <p className="text-xs text-slate-500">{rule.desc}</p>
              </div>
              <button className={cn(
                "h-5 w-10 rounded-full transition-colors relative",
                rule.active ? "bg-emerald-500" : "bg-slate-200"
              )}>
                <div className={cn(
                  "absolute top-1 h-3 w-3 rounded-full bg-white transition-all",
                  rule.active ? "right-1" : "left-1"
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Message History */}
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-50 p-6">
          <h3 className="text-lg font-bold text-slate-900">Message History</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No message history found.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{alert.type}</td>
                    <td className="px-6 py-4 text-slate-600">{alert.recipient}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{alert.phone}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        alert.status === "Delivered" ? "bg-emerald-50 text-emerald-600" :
                        alert.status === "Sent" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-emerald-600 hover:underline">Resend</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Message Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Send WhatsApp Message</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={newMessage.recipient}
                  onChange={(e) => setNewMessage({ ...newMessage, recipient: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Ahmad Khan"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newMessage.phone}
                  onChange={(e) => setNewMessage({ ...newMessage, phone: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="+92 300 1234567"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Message Content</label>
                <textarea
                  required
                  rows={4}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Type your message here..."
                />
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
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
