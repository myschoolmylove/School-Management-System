import React, { useState, useEffect, useRef } from "react";
import { QrCode, Printer, Download, Search, User, School, Plus, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

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

export default function IDCardModule() {
  const [people, setPeople] = useState<IDCardData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<IDCardData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch students and staff for ID cards
    const studentsUnsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
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
      
      const staffUnsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const staffList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          role: "Staff" as const,
          idNumber: doc.data().employeeId || doc.id.slice(0, 6),
          photoUrl: doc.data().photoUrl,
          department: doc.data().department,
          bloodGroup: doc.data().bloodGroup || "O+",
          phone: doc.data().phone
        }));
        
        setPeople([...studentList, ...staffList]);
      });
      
      return () => staffUnsubscribe();
    });
    return () => studentsUnsubscribe();
  }, []);

  const handlePrint = () => {
    if (!selectedPerson) return;
    const printContent = cardRef.current;
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow && printContent) {
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
          <h3 className="text-xl font-bold text-slate-900">ID Card Generator</h3>
          <p className="text-sm text-slate-500">Generate and print professional ID cards with QR codes.</p>
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
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-2xl border border-black/5 bg-white p-2 no-scrollbar">
            {filteredPeople.map((person) => (
              <button
                key={person.id}
                onClick={() => setSelectedPerson(person)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all",
                  selectedPerson?.id === person.id ? "bg-emerald-50 ring-1 ring-emerald-500" : "hover:bg-slate-50"
                )}
              >
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-500">{person.role} • ID: {person.idNumber}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Preview */}
        <div className="flex flex-col items-center justify-center space-y-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
          {selectedPerson ? (
            <>
              <div ref={cardRef} className="relative h-[450px] w-[280px] overflow-hidden rounded-[20px] bg-white shadow-2xl ring-1 ring-black/5">
                {/* Header */}
                <div className="h-24 bg-emerald-600 p-6 text-center text-white">
                  <div className="flex items-center justify-center gap-2">
                    <School className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">City School</span>
                  </div>
                  <p className="mt-1 text-[10px] font-medium opacity-80">Education for Excellence</p>
                </div>

                {/* Photo */}
                <div className="absolute left-1/2 top-16 -translate-x-1/2">
                  <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg">
                    {selectedPerson.photoUrl ? (
                      <img src={selectedPerson.photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <User className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="mt-24 px-6 text-center">
                  <h4 className="text-lg font-bold text-slate-900">{selectedPerson.name}</h4>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{selectedPerson.role}</p>
                  
                  <div className="mt-6 space-y-2 text-left">
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">ID Number</span>
                      <span className="text-[10px] font-bold text-slate-900">{selectedPerson.idNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">{selectedPerson.role === 'Student' ? 'Class' : 'Dept'}</span>
                      <span className="text-[10px] font-bold text-slate-900">{selectedPerson.class || selectedPerson.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Blood Group</span>
                      <span className="text-[10px] font-bold text-rose-600">{selectedPerson.bloodGroup}</span>
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <QrCode className="h-16 w-16 text-slate-900" />
                    </div>
                    <p className="text-[8px] font-medium text-slate-400">Scan for Verification</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 w-full bg-slate-50 py-3 text-center">
                  <p className="text-[8px] font-bold text-slate-400">Valid until March 2027</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
                >
                  <Printer className="h-4 w-4" /> Print Card
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  <Download className="h-4 w-4" /> Download PNG
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <QrCode className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">Select a student or staff member to generate their ID card</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
