export default function Scholarships() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">Scholarships</h1>
      <p className="mt-4 text-lg text-slate-600">Find the best local and international scholarships for Pakistani students.</p>
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Placeholder for scholarship cards */}
        {['HEC Indigenous Scholarship', 'PEEF Scholarship 2026', 'Commonwealth Scholarship', 'USAID Merit-Based Scholarship'].map((s) => (
          <div key={s} className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
            <div className="inline-flex rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600">Fully Funded</div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">{s}</h3>
            <p className="mt-2 text-slate-600">Apply now for the {s} program for the academic year 2026-2027.</p>
            <div className="mt-8 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Deadline: 30th Sept 2026</span>
              <button className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800">Apply Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
