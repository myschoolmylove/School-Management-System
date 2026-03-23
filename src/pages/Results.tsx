export default function Results() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">Board Results</h1>
      <p className="mt-4 text-lg text-slate-600">Check your Matric, Inter, MDCAT, and NTS results here.</p>
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for board cards */}
        {['BISE Lahore', 'BISE Gujranwala', 'BISE Multan', 'BISE Rawalpindi', 'BISE Karachi', 'MDCAT 2026'].map((board) => (
          <div key={board} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900">{board}</h3>
            <p className="mt-2 text-sm text-slate-500">Latest updates and result announcements.</p>
            <button className="mt-6 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Check Result</button>
          </div>
        ))}
      </div>
    </div>
  );
}
