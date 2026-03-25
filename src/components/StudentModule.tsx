import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, UserPlus, Edit2, Trash2, MoreVertical, GraduationCap, CheckCircle, XCircle, X, Camera, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc } from "firebase/firestore";
import { logAction } from "../services/auditService";
import * as XLSX from "xlsx";
import { getSecondaryAuth } from "../lib/authUtils";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNo: string;
  fatherName: string;
  parentUsername: string;
  status: "Active" | "Inactive";
  photoUrl?: string;
  phone?: string;
  bloodGroup?: string;
}

export default function StudentModule({ schoolId }: { schoolId?: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    name: "",
    class: "",
    section: "",
    rollNo: "",
    fatherName: "",
    parentUsername: "",
    status: "Active",
    photoUrl: "",
    phone: "",
    bloodGroup: "O+",
  });

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(db, "schools", schoolId, "students"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Student[];
      setStudents(studentList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for base64 in Firestore
        alert("Image size too large. Please select an image smaller than 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setLoading(true);
    try {
      const finalParentUsername = formData.parentUsername || formData.rollNo;
      
      if (editingStudent) {
        await updateDoc(doc(db, "schools", schoolId, "students", editingStudent.id), {
          ...formData,
          parentUsername: finalParentUsername,
          updatedAt: serverTimestamp(),
        });
        await logAction("Updated Student", `${formData.name} (ID: ${editingStudent.id})`, "admission");
      } else {
        // Create parent Auth user if parentUsername or rollNo is provided
        if (finalParentUsername) {
          try {
            const secondaryAuth = getSecondaryAuth();
            const sanitizedUsername = finalParentUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const virtualEmail = `${sanitizedUsername}@${schoolId}.parent.com`;
            
            let parentUid = "";
            try {
              const userCredential = await createUserWithEmailAndPassword(secondaryAuth, virtualEmail, "Parent@123");
              parentUid = userCredential.user.uid;
              
              // Create user profile for parent
              await setDoc(doc(db, "users", parentUid), {
                name: `${formData.name}'s Parent`,
                email: virtualEmail,
                username: finalParentUsername,
                role: "parent",
                schoolId,
                studentId: "", // Will update after student doc is created
                status: "active",
                createdAt: new Date().toISOString()
              });
              
              await signOut(secondaryAuth);
            } catch (authErr: any) {
              if (authErr.code === "auth/email-already-in-use") {
                // Find existing parent in Firestore
                const { getDocs, query, collection, where } = await import("firebase/firestore");
                const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", virtualEmail)));
                if (!usersSnap.empty) {
                  parentUid = usersSnap.docs[0].id;
                }
              } else {
                throw authErr;
              }
            }

            const docRef = await addDoc(collection(db, "schools", schoolId, "students"), {
              ...formData,
              parentUsername: finalParentUsername,
              schoolId,
              parentUid: parentUid || null,
              createdAt: serverTimestamp(),
            });

            // Update parent profile with studentId (if multiple students, this might need to be an array, but for now we keep it simple or append)
            if (parentUid) {
              await updateDoc(doc(db, "users", parentUid), {
                studentId: docRef.id // In a real app, this would be an array of studentIds
              });
            }

            await logAction("Added Student", `${formData.name} (ID: ${docRef.id})`, "admission");
          } catch (authErr: any) {
            console.error("Auth error:", authErr);
            throw authErr;
          }
        } else {
          const docRef = await addDoc(collection(db, "schools", schoolId, "students"), {
            ...formData,
            schoolId,
            createdAt: serverTimestamp(),
          });
          await logAction("Added Student", `${formData.name} (ID: ${docRef.id})`, "admission");
        }
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      setFormData({
        name: "",
        class: "",
        section: "",
        rollNo: "",
        fatherName: "",
        parentUsername: "",
        status: "Active",
        photoUrl: "",
        phone: "",
        bloodGroup: "O+",
      });
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Error saving student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schoolId) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let successCount = 0;
        const secondaryAuth = getSecondaryAuth();

        for (const row of data) {
          const studentData = {
            name: row.Name || row.name || "",
            class: String(row.Class || row.class || ""),
            section: row.Section || row.section || "",
            rollNo: String(row.RollNo || row.roll_no || ""),
            fatherName: row.FatherName || row.father_name || "",
            parentUsername: String(row.ParentUsername || row.parent_username || ""),
            status: "Active" as const,
            phone: String(row.Phone || row.phone || ""),
            bloodGroup: row.BloodGroup || row.blood_group || "O+",
          };

          if (!studentData.name || !studentData.rollNo) continue;

          try {
            let parentUid = "";
            if (studentData.parentUsername) {
              const sanitizedUsername = studentData.parentUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const virtualEmail = `${sanitizedUsername}@${schoolId}.parent.com`;
              
              try {
                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, virtualEmail, "Parent@123");
                parentUid = userCredential.user.uid;
                
                await setDoc(doc(db, "users", parentUid), {
                  name: `${studentData.name}'s Parent`,
                  email: virtualEmail,
                  username: studentData.parentUsername,
                  role: "parent",
                  schoolId,
                  status: "active",
                  createdAt: new Date().toISOString()
                });
              } catch (authErr: any) {
                if (authErr.code === "auth/email-already-in-use") {
                  // Find existing parent in Firestore
                  const { getDocs, query, collection, where } = await import("firebase/firestore");
                  const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", virtualEmail)));
                  if (!usersSnap.empty) {
                    parentUid = usersSnap.docs[0].id;
                  }
                } else {
                  console.error("Auth error in bulk:", authErr);
                }
              }
            }

            const docRef = await addDoc(collection(db, "schools", schoolId, "students"), {
              ...studentData,
              schoolId,
              parentUid: parentUid || null,
              createdAt: serverTimestamp(),
            });

            if (parentUid) {
              await updateDoc(doc(db, "users", parentUid), { studentId: docRef.id });
            }

            successCount++;
          } catch (err) {
            console.error("Error adding student in bulk:", err);
          }
        }

        await signOut(secondaryAuth);
        await logAction("Bulk Upload Students", `Uploaded ${successCount} students`, "admission");
        alert(`Successfully uploaded ${successCount} students!`);
      } catch (err) {
        console.error("Bulk upload error:", err);
        alert("Failed to process Excel file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { Name: "Student Name", Class: "1", Section: "A", RollNo: "101", FatherName: "Father Name", ParentUsername: "03001234567", Phone: "03001234567", BloodGroup: "O+" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Upload_Template.xlsx");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!schoolId) return;
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, "schools", schoolId, "students", id));
        await logAction("Deleted Student", `${name} (ID: ${id})`, "admission");
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.rollNo.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Student Management</h3>
          <p className="text-sm text-slate-500">Manage student profiles, admissions, and records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Template
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Bulk Upload
            <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" />
          </label>
          <button 
            onClick={() => {
              setEditingStudent(null);
              setFormData({
                name: "",
                class: "",
                section: "",
                rollNo: "",
                fatherName: "",
                parentUsername: "",
                status: "Active",
                photoUrl: "",
                phone: "",
                bloodGroup: "O+",
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-50 p-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-slate-50">
            <Filter className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4">Class/Section</th>
                  <th className="px-6 py-4">Father Name</th>
                  <th className="px-6 py-4">Parent Login</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-emerald-100 ring-2 ring-white shadow-sm">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-emerald-600 font-bold">
                              {s.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-xs text-slate-500">ID: {s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{s.rollNo}</td>
                    <td className="px-6 py-4 text-slate-600">{s.class} - {s.section}</td>
                    <td className="px-6 py-4 text-slate-600">{s.fatherName}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-900">{s.parentUsername}</div>
                      <div className="text-[10px] text-slate-500">PW: Parent@123</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {s.status === "Active" ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500" />
                        )}
                        <span className={cn(
                          "font-medium",
                          s.status === "Active" ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {s.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingStudent(s);
                            setFormData(s);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id, s.name)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingStudent ? "Edit Student" : "Add New Student"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative group">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-slate-50">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700">
                    <Plus className="h-4 w-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-900">Student Photo</p>
                  <p className="text-xs text-slate-500">Upload a professional photo. Max size 500KB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Roll Number</label>
                  <input
                    required
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Class</label>
                  <input
                    required
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Section</label>
                  <input
                    required
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Father's Name</label>
                  <input
                    required
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent Username / Mobile</label>
                  <p className="text-[10px] text-slate-500">The username the parent will use to login. Defaults to Roll Number if empty.</p>
                  <input
                    type="text"
                    value={formData.parentUsername}
                    onChange={(e) => setFormData({ ...formData, parentUsername: e.target.value })}
                    placeholder={formData.rollNo || "e.g. 101 or Mobile No"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-8 py-2 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                >
                  {editingStudent ? "Update Student" : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
