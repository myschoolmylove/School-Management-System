import React, { useState, useEffect } from "react";
import { Fingerprint, Search, Filter, Plus, MoreVertical, Trash2, Edit2, AlertCircle, CheckCircle, Clock, Smartphone, Activity, Settings, RefreshCw, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy, limit } from "firebase/firestore";
import { logAction } from "../services/auditService";

interface BiometricDevice {
  id: string;
  name: string;
  location: string;
  status: "Online" | "Offline";
  lastSync: string;
  ipAddress?: string;
}

interface AttendanceLog {
  id: string;
  name: string;
  rollNo: string;
  time: string;
  status: string;
  device: string;
}

export default function BiometricModule() {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: "",
    location: "",
    ipAddress: ""
  });

  useEffect(() => {
    const devicesUnsubscribe = onSnapshot(collection(db, "biometric_devices"), (snapshot) => {
      const deviceList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BiometricDevice[];
      setDevices(deviceList);
    });

    const logsUnsubscribe = onSnapshot(
      query(collection(db, "attendance_logs"), orderBy("time", "desc"), limit(50)),
      (snapshot) => {
        const logList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceLog[];
        setLogs(logList);
        setIsLoading(false);
      }
    );

    return () => {
      devicesUnsubscribe();
      logsUnsubscribe();
    };
  }, []);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "biometric_devices"), {
        ...newDevice,
        status: "Online",
        lastSync: new Date().toISOString()
      });
      await logAction("Added Biometric Device", `Device: ${newDevice.name}`, "biometrics");
      setIsModalOpen(false);
      setNewDevice({ name: "", location: "", ipAddress: "" });
    } catch (error) {
      console.error("Error adding device:", error);
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}?`)) {
      try {
        await deleteDoc(doc(db, "biometric_devices", id));
        await logAction("Deleted Biometric Device", `Device: ${name}`, "biometrics");
      } catch (error) {
        console.error("Error deleting device:", error);
      }
    }
  };

  const filteredLogs = logs.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Biometric Attendance</h3>
          <p className="text-sm text-slate-500">Manage thumb-scanners and real-time attendance syncing.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Add Device
          </button>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            Sync All Devices
          </button>
        </div>
      </div>

      {/* Device Status Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {devices.length === 0 ? (
          <div className="md:col-span-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            No devices connected. Click "Add Device" to get started.
          </div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm relative group">
              <button 
                onClick={() => handleDeleteDevice(device.id, device.name)}
                className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center justify-between">
                <div className={cn(
                  "rounded-xl p-2",
                  device.status === "Online" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  <Fingerprint className="h-6 w-6" />
                </div>
                <span className={cn(
                  "flex items-center gap-1.5 text-xs font-bold",
                  device.status === "Online" ? "text-emerald-600" : "text-rose-600"
                )}>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    device.status === "Online" ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  {device.status}
                </span>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">{device.name}</p>
              <p className="text-xs text-slate-500">{device.location} • Last Sync: {new Date(device.lastSync).toLocaleTimeString()}</p>
            </div>
          ))
        )}
      </div>

      {/* Real-time Logs */}
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-50 p-6">
          <h3 className="text-lg font-bold text-slate-900">Today's Live Attendance</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Roll/Staff ID</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Device</th>
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
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No attendance logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{log.name}</td>
                    <td className="px-6 py-4 text-slate-600">{log.rollNo}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{new Date(log.time).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        log.status === "Present" ? "bg-emerald-50 text-emerald-600" :
                        log.status === "Late" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{log.device}</td>
                    <td className="px-6 py-4">
                      <button className="text-emerald-600 hover:underline">View Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Add Biometric Device</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddDevice} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Device Name</label>
                <input
                  type="text"
                  required
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Main Entrance Scanner"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Location</label>
                <input
                  type="text"
                  required
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Block A, Ground Floor"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">IP Address</label>
                <input
                  type="text"
                  required
                  value={newDevice.ipAddress}
                  onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 192.168.1.105"
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
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
