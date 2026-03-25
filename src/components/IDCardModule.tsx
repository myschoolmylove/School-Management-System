import React, { useState, useEffect, useRef } from "react";
import { QrCode, Printer, Download, Search, User, School, Plus, X, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";

import { QRCodeCanvas } from "qrcode.react";

interface IDCardData {
  id: string;
  name: string;
  role: "Student" | "Staff";
  idNumber: string;
  photoUrl?: string;
  department?: string;
  class?: string;
  bloodGroup?: string;
  phone?: string;
}

export default function IDCardModule({ schoolId }: { schoolId?: string }) {
  const [people, setPeople] = useState<IDCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<IDCardData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!schoolId) return;

    // Fetch students
    const sQuery = query(collection(db, "schools", schoolId, "students"));
    const sUnsubscribe = onSnapshot(sQuery, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        role: "Student" as const,
        idNumber: doc.data().rollNo || doc.id.slice(0, 6),
        photoUrl: doc.data().photoUrl,
        class: doc.data().class,
        bloodGroup: doc.data().bloodGroup || "O+",
        phone: doc.data().phone
      }));
      
      // Fetch staff (teachers)
      const tQuery = query(collection(db, "schools", schoolId, "teachers"));
      const tUnsubscribe = onSnapshot(tQuery, (snapshot) => {
        const teacherList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          role: "Staff" as const,
          idNumber: doc.data().employeeId || doc.id.slice(0, 6),
          photoUrl: doc.data().photoUrl,
          department: doc.data().subject || "General",
          bloodGroup: doc.data().bloodGroup || "O+",
          phone: doc.data().phone
        }));
        
        setPeople([...studentList, ...teacherList]);
        setIsLoading(false);
      });
      
      return () => tUnsubscribe();
    });
    return () => sUnsubscribe();
  }, [schoolId]);

  const handlePrint = () => {
    if (!selectedPerson) return;
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print ID Card - ${selectedPerson.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="p-8 flex items-center justify-center">
            ${printContent.innerHTML}
            <script>
              window.onload = () => {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">ID Card Generator</h3>
          <p className="text-sm font-medium text-slate-500">Generate and print professional ID cards with QR codes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Selection List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search students or staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-2xl border border-black/5 bg-white p-2 no-scrollbar">
            {isLoading ? (
              <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" /></div>
            ) : filteredPeople.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No students or staff found.</div>
            ) : (
              filteredPeople.map((person) => (
                <button
                  key={person.id}
                  onClick={() => setSelectedPerson(person)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all",
                    selectedPerson?.id === person.id ? "bg-emerald-50 ring-1 ring-emerald-500 shadow-sm" : "hover:bg-slate-50"
                  )}
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100 border-2 border-white shadow-sm">
                    {person.photoUrl ? (
                      <img src={person.photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{person.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{person.role} • ID: {person.idNumber}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Card Preview */}
        <div className="flex flex-col items-center justify-center space-y-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
          {selectedPerson ? (
            <>
              <div ref={cardRef} className="relative h-[450px] w-[280px] overflow-hidden rounded-[24px] bg-white shadow-2xl ring-1 ring-black/5">
                {/* Header */}
                <div className="h-28 bg-slate-900 p-6 text-center text-white">
                  <div className="flex items-center justify-center gap-2">
                    <School className="h-5 w-5 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-widest">My School My Love</span>
                  </div>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Excellence in Education</p>
                </div>

                {/* Photo */}
                <div className="absolute left-1/2 top-16 -translate-x-1/2">
                  <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-xl">
                    {selectedPerson.photoUrl ? (
                      <img src={selectedPerson.photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <User className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-24 px-6 text-center">
                  <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">{selectedPerson.name}</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{selectedPerson.role}</p>
                  
                  <div className="mt-8 space-y-3 text-left">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID Number</span>
                      <span className="text-[10px] font-black text-slate-900">{selectedPerson.idNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{selectedPerson.role === 'Student' ? 'Class' : 'Dept'}</span>
                      <span className="text-[10px] font-black text-slate-900">{selectedPerson.class || selectedPerson.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Blood Group</span>
                      <span className="text-[10px] font-black text-rose-600">{selectedPerson.bloodGroup}</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="mt-10 flex flex-col items-center gap-2">
                    <div className="rounded-xl bg-white p-2 border border-slate-100 shadow-sm">
                      <QRCodeCanvas 
                        value={`https://ais-dev-gukoujxyycwzq63aveib6l-637084201611.asia-southeast1.run.app/verify/${selectedPerson.idNumber}`}
                        size={64}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Scan for Verification</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 w-full bg-slate-900 py-3 text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Valid until March 2027</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800 shadow-lg"
                >
                  <Printer className="h-4 w-4" /> Print Card
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 border-2 border-dashed border-slate-300">
                <QrCode className="h-10 w-10 text-slate-400" />
              </div>
              <p className="mt-6 text-sm font-bold text-slate-500 uppercase tracking-tight">Select a student or staff member to generate their ID card</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
