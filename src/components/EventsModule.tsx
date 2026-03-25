import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, X, Loader2, Clock, MapPin, Edit2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: "Academic" | "Sports" | "Cultural" | "Holiday";
}

export default function EventsModule({ schoolId }: { schoolId?: string }) {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    location: "School Campus",
    category: "Academic" as SchoolEvent["category"]
  });

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SchoolEvent[];
      setEvents(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);

    try {
      const data = { ...formData, updatedAt: serverTimestamp() };
      if (editingEvent) {
        await updateDoc(doc(db, "schools", schoolId, "events", editingEvent.id), data);
        await logAction("Update Event", `Updated event: ${formData.title}`, "academic");
      } else {
        await addDoc(collection(db, "schools", schoolId, "events"), { ...data, createdAt: serverTimestamp() });
        await logAction("Add Event", `Added new event: ${formData.title}`, "academic");
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      setFormData({ title: "", description: "", date: new Date().toISOString().split('T')[0], time: "09:00", location: "School Campus", category: "Academic" });
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, "schools", schoolId!, "events", id));
      await logAction("Delete Event", `Deleted event ID: ${id}`, "academic");
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">School Events</h3>
          <p className="text-sm font-medium text-slate-500">Plan and manage upcoming school activities and holidays.</p>
        </div>
        <button 
          onClick={() => {
            setEditingEvent(null);
            setFormData({ title: "", description: "", date: new Date().toISOString().split('T')[0], time: "09:00", location: "School Campus", category: "Academic" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" /></div>
        ) : events.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 font-bold uppercase tracking-widest">No upcoming events.</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="group relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingEvent(event);
                      setFormData({ title: event.title, description: event.description, date: event.date, time: event.time, location: event.location, category: event.category });
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(event.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{event.title}</h4>
              <p className="text-sm text-slate-600 line-clamp-2 mb-6 font-medium">{event.description}</p>
              <div className="space-y-2 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{event.date} @ {event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{event.location}</span>
                </div>
              </div>
              <div className="mt-4">
                <span className={cn(
                  "rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                  event.category === "Academic" ? "bg-blue-50 text-blue-600" :
                  event.category === "Sports" ? "bg-emerald-50 text-emerald-600" :
                  event.category === "Cultural" ? "bg-purple-50 text-purple-600" : "bg-rose-50 text-rose-600"
                )}>
                  {event.category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingEvent ? "Edit Event" : "Create Event"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                />
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Time</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    {["Academic", "Sports", "Cultural", "Holiday"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <button
                disabled={isSaving}
                className="w-full rounded-xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : editingEvent ? "Update Event" : "Create Event"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
