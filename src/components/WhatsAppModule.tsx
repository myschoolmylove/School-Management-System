import React, { useState, useEffect } from "react";
import { Smartphone, MessageCircle, Bell, Clock, CheckCircle, AlertCircle, Send, Settings, Search, Filter, X, Bot, Zap, ExternalLink, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, addDoc, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface WhatsAppAlert {
  id: string;
  type: string;
  recipient: string;
  phone: string;
  status: "Sent" | "Delivered" | "Failed";
  timestamp: any;
}

export default function WhatsAppModule() {
  const [alerts, setAlerts] = useState<WhatsAppAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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

  const sendViaAPI = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: newMessage.phone.replace(/\D/g, ""),
          message: newMessage.content
        })
      });
      
      const result = await response.json();
      
      await addDoc(collection(db, "whatsapp_logs"), {
        type: newMessage.type,
        recipient: newMessage.recipient,
        phone: newMessage.phone,
        status: result.success ? "Sent" : "Failed",
        timestamp: serverTimestamp(),
        apiResponse: result
      });

      await logAction("Sent WhatsApp API Message", `To: ${newMessage.recipient}`, "whatsapp");
      setIsModalOpen(false);
      setNewMessage({ recipient: "", phone: "", type: "Manual Message", content: "" });
    } catch (error) {
      console.error("Error sending API message:", error);
      alert("Failed to send via API. Try WhatsApp Web instead.");
    } finally {
      setIsSending(false);
    }
  };

  const sendViaWhatsAppWeb = () => {
    const cleanPhone = newMessage.phone.replace(/\D/g, "");
    const encodedMsg = encodeURIComponent(newMessage.content);
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
    window.open(url, "_blank");
    
    // Still log it
    addDoc(collection(db, "whatsapp_logs"), {
      type: "WhatsApp Web",
      recipient: newMessage.recipient,
      phone: newMessage.phone,
      status: "Sent",
      timestamp: serverTimestamp()
    });
    
    logAction("Sent WhatsApp Web Message", `To: ${newMessage.recipient}`, "whatsapp");
    setIsModalOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    // Default to API if configured, otherwise show choice or just use API
    await sendViaAPI();
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
      {/* API Status & Guide */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">WhatsApp API Status</h3>
              <p className="text-sm text-slate-500">
                {process.env.WHATSAPP_API_TOKEN ? "✅ API Connected" : "⚠️ API in Simulation Mode"}
              </p>
            </div>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-100"
            >
              <Info className="h-4 w-4" />
              Setup Guide
            </button>
          </div>
          {!process.env.WHATSAPP_API_TOKEN && (
            <p className="mt-4 text-xs text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              Credentials missing in AI Studio settings.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Messages Sent (API)</p>
              <p className="text-2xl font-bold text-slate-900">{alerts.filter(a => a.status === "Sent").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">WhatsApp API Setup Guide</h3>
              <button onClick={() => setIsGuideOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <div className="mt-6 space-y-6 overflow-y-auto max-h-[60vh] pr-2">
              <section>
                <h4 className="font-bold text-slate-900">1. Create Meta Developer Account</h4>
                <p className="text-sm text-slate-500">Go to <a href="https://developers.facebook.com" target="_blank" className="text-emerald-600 underline">Meta for Developers</a> and create an account.</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900">2. Create a WhatsApp App</h4>
                <p className="text-sm text-slate-500">Create a new app, select "Other" &rarr; "Business" and add the "WhatsApp" product.</p>
              </section>

              <section>
                <h4 className="font-bold text-slate-900">3. Get Credentials</h4>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-500 space-y-1">
                  <li><strong>Phone Number ID:</strong> Found in WhatsApp &rarr; Getting Started.</li>
                  <li><strong>API Token:</strong> Generate a Permanent Access Token in System Users.</li>
                  <li><strong>Verify Token:</strong> Any string you choose (e.g., "my_school_bot").</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-slate-900">4. Configure Webhook</h4>
                <p className="text-sm text-slate-500">In WhatsApp &rarr; Configuration, set the Webhook URL to:</p>
                <code className="mt-2 block rounded-lg bg-slate-100 p-3 text-xs text-slate-700 break-all">
                  {window.location.origin}/api/whatsapp/webhook
                </code>
                <p className="mt-2 text-xs text-slate-400 italic">Note: Use the "Shared App URL" for production.</p>
              </section>

              <section className="rounded-xl bg-amber-50 p-4 border border-amber-100">
                <h4 className="font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Important
                </h4>
                <p className="mt-1 text-sm text-amber-800">
                  Once you have these keys, add them to the <strong>Settings</strong> menu in AI Studio.
                </p>
              </section>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Bot Simulator */}
      <div className="rounded-2xl border border-black/5 bg-slate-900 p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-500 p-3">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">WhatsApp AI Bot</h3>
              <p className="text-sm text-slate-400">Automated responses for parents (Results, Fees, Attendance).</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
            <Zap className="h-3 w-3" />
            AI ACTIVE
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Bot Commands</p>
            {[
              { cmd: "RESULT [RollNo]", desc: "Instantly sends latest exam result" },
              { cmd: "FEE [RollNo]", desc: "Sends current month's fee status" },
              { cmd: "ATTENDANCE [RollNo]", desc: "Sends attendance summary for current month" },
            ].map((command) => (
              <div key={command.cmd} className="flex items-center justify-between rounded-xl bg-white/5 p-4 border border-white/10">
                <div>
                  <code className="text-emerald-400 font-bold">{command.cmd}</code>
                  <p className="text-xs text-slate-400 mt-1">{command.desc}</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Edit</button>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Live Activity</p>
            <div className="space-y-4">
              {[
                { user: "+92 300 1234567", msg: "RESULT 101", time: "2m ago" },
                { user: "+92 301 7654321", msg: "FEE 101", time: "5m ago" },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-emerald-500" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-300">{log.user}</p>
                    <p className="text-slate-500 italic">"{log.msg}"</p>
                  </div>
                  <span className="text-[10px] text-slate-600">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
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
                      {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleString() : new Date(alert.timestamp).toLocaleString()}
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

              <div className="mt-8 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={sendViaWhatsAppWeb}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <ExternalLink className="h-4 w-4" /> WhatsApp Web
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {isSending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Send via API
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
