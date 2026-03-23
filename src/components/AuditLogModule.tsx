import React, { useState, useEffect } from "react";
import { History, Search, Filter, Clock, User, Shield, FileText, CreditCard } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";

interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  details: string;
  timestamp: any;
  module: string;
}

export default function AuditLogModule({ schoolId }: { schoolId?: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let q;
    if (schoolId) {
      q = query(
        collection(db, "audit_logs"),
        where("schoolId", "==", schoolId),
        orderBy("timestamp", "desc"),
        limit(50)
      );
    } else {
      q = query(
        collection(db, "audit_logs"),
        orderBy("timestamp", "desc"),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString() || "Just now"
      })) as AuditLog[];
      setLogs(logList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Audit Logs</h3>
          <p className="text-sm text-slate-500">Track all administrative actions and data changes.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-50">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-slate-100 p-4">
            <History className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="mt-4 text-lg font-bold text-slate-900">No logs found</h4>
          <p className="text-sm text-slate-500">Activity will appear here as users interact with the system.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                log.module === "academic" ? "bg-blue-50 text-blue-600" :
                log.module === "finance" ? "bg-emerald-50 text-emerald-600" :
                log.module === "admission" ? "bg-purple-50 text-purple-600" : "bg-slate-50 text-slate-600"
              )}>
                {log.module === "academic" ? <FileText className="h-6 w-6" /> :
                 log.module === "finance" ? <CreditCard className="h-6 w-6" /> :
                 log.module === "admission" ? <User className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{log.user}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {log.role}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {log.action}: <span className="text-slate-500">{log.details}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Clock className="h-4 w-4" />
                {log.timestamp}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
