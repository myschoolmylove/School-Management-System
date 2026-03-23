import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type AuditLogModule = "academic" | "finance" | "admission" | "inventory" | "id-cards" | "whatsapp" | "biometrics" | "other";

export interface AuditLogEntry {
  user: string;
  userId: string;
  role: string;
  action: string;
  details: string;
  module: AuditLogModule;
  timestamp: any;
}

export const logAction = async (
  action: string,
  details: string,
  module: AuditLogModule,
  userProfile?: { name: string; role: string; schoolId?: string }
) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "audit_logs"), {
      user: userProfile?.name || user.email || "Unknown User",
      userId: user.uid,
      role: userProfile?.role || "Unknown Role",
      schoolId: userProfile?.schoolId || null,
      action,
      details,
      module,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};
