import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Search, Filter, Download, Trash2, Edit2, Bell, MessageCircle, Send, X, Loader2, Calendar, Volume2, VolumeX } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: "General" | "Exam" | "Holiday" | "Fee" | "Event";
  target: "All" | "Students" | "Teachers" | "Parents";
  status: "Draft" | "Published";
}

export default function NoticesModule({ schoolId }: { schoolId?: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General" as Notice["category"],
    target: "All" as Notice["target"],
    status: "Published" as Notice["status"],
    date: new Date().toISOString().split('T')[0]
  });

  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

  const speak = (id: string, text: string) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(null);
    setIsSpeaking(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "notices"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notice[];
      setNotices(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching notices:", err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);

    try {
      const data = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editingNotice) {
        await updateDoc(doc(db, "schools", schoolId, "notices", editingNotice.id), data);
        await logAction("Update Notice", `Updated notice: ${formData.title}`, "academic");
      } else {
        await addDoc(collection(db, "schools", schoolId, "notices"), {
          ...data,
          createdAt: serverTimestamp()
        });
        await logAction("Add Notice", `Added new notice: ${formData.title}`, "academic");
      }
      setIsModalOpen(false);
      setEditingNotice(null);
      setFormData({ title: "", content: "", category: "General", target: "All", status: "Published", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error("Error saving notice:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await deleteDoc(doc(db, "schools", schoolId!, "notices", id));
      await logAction("Delete Notice", `Deleted notice ID: ${id}`, "academic");
    } catch (error) {
      console.error("Error deleting notice:", error);
    }
  };

  const sendViaWhatsApp = async (notice: Notice) => {
    if (!schoolId) return;
    alert(`Sending notice "${notice.title}" to ${notice.target} via WhatsApp...`);
    await logAction("Send Notice", `Sent notice via WhatsApp: ${notice.title}`, "academic");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Notice Board</h3>
          <p className="text-sm font-medium text-slate-500">Manage school announcements and notifications.</p>
        </div>
        <button 
          onClick={() => {
            setEditingNotice(null);
            setFormData({ title: "", content: "", category: "General", target: "All", status: "Published", date: new Date().toISOString().split('T')[0] });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Notice
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" /></div>
        ) : notices.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 font-bold uppercase tracking-widest">No notices posted yet.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <span className={cn(
                  "rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                  notice.category === "General" ? "bg-blue-50 text-blue-600" :
                  notice.category === "Exam" ? "bg-rose-50 text-rose-600" :
                  notice.category === "Holiday" ? "bg-amber-50 text-amber-600" :
                  notice.category === "Fee" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                )}>
                  {notice.category}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => speak(notice.id, `${notice.title}. ${notice.content}`)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isSpeaking === notice.id ? "bg-emerald-100 text-emerald-600" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                    title="Listen to notice"
                  >
                    {isSpeaking === notice.id ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingNotice(notice);
                      setFormData({ title: notice.title, content: notice.content, category: notice.category, target: notice.target, status: notice.status, date: notice.date });
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(notice.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{notice.title}</h4>
              <p className="text-sm text-slate-600 line-clamp-3 mb-6 font-medium">{notice.content}</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{notice.date}</span>
                </div>
                <button 
                  onClick={() => sendViaWhatsApp(notice)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingNotice ? "Edit Notice" : "Post New Notice"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notice Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Mid-Term Examination Schedule"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notice Content</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  placeholder="Type the full notice content here..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    {["General", "Exam", "Holiday", "Fee", "Event"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Target Audience</label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    {["All", "Students", "Teachers", "Parents"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <button
                disabled={isSaving}
                className="w-full rounded-xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : editingNotice ? "Update Notice" : "Post Notice"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
