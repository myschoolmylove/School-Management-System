import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Trash2, Image as ImageIcon, X, Loader2, Upload, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  category: string;
  createdAt: any;
}

export default function GalleryModule({ schoolId }: { schoolId?: string }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ url: "", caption: "", category: "General" });

  const categories = ["General", "Events", "Sports", "Academic", "Infrastructure"];

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[];
      setItems(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching gallery:", err);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setIsSaving(true);

    try {
      await addDoc(collection(db, "schools", schoolId, "gallery"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      await logAction("Upload Gallery", `Uploaded photo to gallery: ${formData.caption}`, "academic");
      setIsModalOpen(false);
      setFormData({ url: "", caption: "", category: "General" });
    } catch (error) {
      console.error("Error saving photo:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      await deleteDoc(doc(db, "schools", schoolId!, "gallery", id));
      await logAction("Delete Gallery", `Deleted gallery photo ID: ${id}`, "academic");
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">School Gallery</h3>
          <p className="text-sm font-medium text-slate-500">Capture and share school moments with parents and students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Photo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" /></div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 font-bold uppercase tracking-widest">No photos in the gallery yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm transition-all hover:shadow-md">
              <img 
                src={item.url} 
                alt={item.caption} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 p-6 opacity-0 transition-all translate-y-4 group-hover:opacity-100 group-hover:translate-y-0">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">{item.category}</p>
                <p className="text-sm font-bold text-white line-clamp-2">{item.caption}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleDelete(item.id)} className="rounded-lg bg-rose-500/20 p-2 text-rose-500 backdrop-blur-md hover:bg-rose-500 hover:text-white transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <a href={item.url} target="_blank" rel="noreferrer" className="rounded-lg bg-white/20 p-2 text-white backdrop-blur-md hover:bg-white hover:text-slate-900 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Add Photo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Photo URL</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Caption</label>
                <input
                  type="text"
                  required
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  placeholder="Describe the photo..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <button
                disabled={isSaving}
                className="w-full rounded-xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Upload to Gallery"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
