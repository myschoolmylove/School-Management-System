import { useState } from "react";
import { Plus, Trash2, Users, ChevronRight } from "lucide-react";
import { SchoolClass, DEFAULT_CLASSES, Section } from "../types";
import { cn } from "../lib/utils";

export default function ClassModule() {
  const [classes, setClasses] = useState<SchoolClass[]>(
    DEFAULT_CLASSES.map((name, idx) => ({
      id: `class-${idx}`,
      name,
      sections: [
        { id: `sec-${idx}-1`, name: "A", studentCount: 20 },
        { id: `sec-${idx}-2`, name: "B", studentCount: 15 },
      ],
    }))
  );

  const [selectedClassId, setSelectedClassId] = useState<string | null>(classes[0].id);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const addSection = (classId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const newSection: Section = {
            id: `sec-${Date.now()}`,
            name: String.fromCharCode(65 + c.sections.length), // A, B, C...
            studentCount: 0,
          };
          return { ...c, sections: [...c.sections, newSection] };
        }
        return c;
      })
    );
  };

  const removeSection = (classId: string, sectionId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          return { ...c, sections: c.sections.filter((s) => s.id !== sectionId) };
        }
        return c;
      })
    );
  };

  const updateSectionName = (classId: string, sectionId: string, name: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            sections: c.sections.map((s) => (s.id === sectionId ? { ...s, name } : s)),
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* Class List */}
      <div className="col-span-1 space-y-2 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <h3 className="mb-4 px-2 text-sm font-bold uppercase tracking-wider text-slate-400">Classes</h3>
        <div className="max-h-[600px] overflow-y-auto pr-2">
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition-all",
                selectedClassId === c.id
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span>{c.name}</span>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs opacity-60", selectedClassId === c.id ? "text-white" : "text-slate-400")}>
                  {c.sections.length} Sec
                </span>
                <ChevronRight className="h-4 w-4 opacity-40" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Section Management */}
      <div className="col-span-1 lg:col-span-3">
        {selectedClass ? (
          <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedClass.name}</h2>
                <p className="text-sm text-slate-500">Manage sections and student distribution for this class.</p>
              </div>
              <button
                onClick={() => addSection(selectedClass.id)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {selectedClass.sections.map((section) => (
                <div key={section.id} className="group relative rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:bg-white hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) => updateSectionName(selectedClass.id, section.id, e.target.value)}
                      className="w-24 rounded-lg border-transparent bg-transparent text-xl font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      onClick={() => removeSection(selectedClass.id, section.id)}
                      className="rounded-lg p-2 text-slate-400 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-slate-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">{section.studentCount} Students</span>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button className="flex-1 rounded-lg bg-white py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-slate-50">View List</button>
                    <button className="flex-1 rounded-lg bg-white py-2 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-slate-50">Attendance</button>
                  </div>
                </div>
              ))}
            </div>

            {selectedClass.sections.length === 0 && (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 font-medium text-slate-500">No sections added yet.</p>
                <button
                  onClick={() => addSection(selectedClass.id)}
                  className="mt-2 text-sm font-bold text-emerald-600 hover:underline"
                >
                  Create your first section
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">Select a class from the list to manage its sections.</p>
          </div>
        )}
      </div>
    </div>
  );
}
