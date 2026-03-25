import React, { useState, useEffect, FormEvent } from "react";
import { Plus, Search, Filter, Download, Trash2, Edit2, Package, Archive, AlertTriangle, CheckCircle, X, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface Asset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: "New" | "Good" | "Fair" | "Poor";
  location: string;
  purchaseDate: string;
  value: number;
}

export default function InventoryModule({ schoolId }: { schoolId?: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "Furniture",
    quantity: "1",
    condition: "New" as "New" | "Good" | "Fair" | "Poor",
    location: "Main Building",
    purchaseDate: new Date().toISOString().split('T')[0],
    value: ""
  });

  const categories = ["Furniture", "Electronics", "Sports", "Lab Equipment", "Books", "Vehicles", "Other"];
  const conditions = ["New", "Good", "Fair", "Poor"];

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "inventory"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Asset[];
      setAssets(list);
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
        quantity: parseInt(formData.quantity),
        value: parseFloat(formData.value),
        updatedAt: serverTimestamp()
      };

      if (editingAsset) {
        await updateDoc(doc(db, "schools", schoolId, "inventory", editingAsset.id), data);
        await logAction("Update Inventory", `Updated inventory asset: ${formData.name}`, "inventory");
      } else {
        await addDoc(collection(db, "schools", schoolId, "inventory"), {
          ...data,
          createdAt: serverTimestamp()
        });
        await logAction("Add Inventory", `Added new inventory asset: ${formData.name}`, "inventory");
      }
      setIsModalOpen(false);
      setEditingAsset(null);
      setFormData({ name: "", category: "Furniture", quantity: "1", condition: "New", location: "Main Building", purchaseDate: new Date().toISOString().split('T')[0], value: "" });
    } catch (error) {
      console.error("Error saving asset:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await deleteDoc(doc(db, "schools", schoolId!, "inventory", id));
      await logAction("Delete Inventory", `Deleted inventory asset ID: ${id}`, "inventory");
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = assets.reduce((acc, a) => acc + a.value, 0);
  const poorConditionCount = assets.filter(a => a.condition === "Poor").length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: "Total Assets", value: assets.length, icon: Package, color: "text-blue-600 bg-blue-50" },
          { label: "Total Value", value: `Rs. ${totalValue.toLocaleString()}`, icon: Archive, color: "text-emerald-600 bg-emerald-50" },
          { label: "Needs Maintenance", value: poorConditionCount, icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
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
        <div className="flex flex-col gap-4 border-b border-slate-50 p-6 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button 
            onClick={() => {
              setEditingAsset(null);
              setFormData({ name: "", category: "Furniture", quantity: "1", condition: "New", location: "Main Building", purchaseDate: new Date().toISOString().split('T')[0], value: "" });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-6 py-4">Asset Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-center">Condition</th>
                <th className="px-6 py-4 text-right">Value</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" /></td></tr>
              ) : filteredAssets.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No assets found.</td></tr>
              ) : (
                filteredAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{a.name}</td>
                    <td className="px-6 py-4 text-slate-600">{a.category}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">{a.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                        a.condition === "New" ? "bg-emerald-50 text-emerald-600" :
                        a.condition === "Good" ? "bg-blue-50 text-blue-600" :
                        a.condition === "Fair" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {a.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">Rs. {a.value.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingAsset(a);
                            setFormData({ name: a.name, category: a.category, quantity: a.quantity.toString(), condition: a.condition, location: a.location, purchaseDate: a.purchaseDate, value: a.value.toString() });
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1 text-slate-400 hover:text-rose-600">
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

      {/* Add/Edit Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{editingAsset ? "Edit Asset" : "Add New Asset"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Computer Lab PCs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    {conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Value (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Block A, Room 102"
                />
              </div>
              <button
                disabled={isSaving}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : editingAsset ? "Update Asset" : "Save Asset"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
