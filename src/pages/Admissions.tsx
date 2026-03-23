export default function Admissions() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">Admissions 2026</h1>
      <p className="mt-4 text-lg text-slate-600">Latest admission notices from schools, colleges, and universities across Pakistan.</p>
      <div className="mt-12 space-y-6">
        {/* Placeholder for admission notices */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div className="h-24 w-24 flex-shrink-0 rounded-xl bg-slate-100" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">University of the Punjab - Fall Admissions 2026</h3>
              <p className="mt-1 text-sm text-slate-500">Last Date: 15th August 2026</p>
              <p className="mt-2 text-slate-600">Applications are invited for undergraduate and postgraduate programs...</p>
            </div>
            <button className="rounded-lg border border-emerald-600 px-6 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
}
