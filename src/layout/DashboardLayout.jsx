export default function DashboardLayout({ title, onLogout, onBack, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3
                         border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 leading-none">{title}</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Smart Classroom Attendance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300
                         hover:border-emerald-500/60 hover:text-emerald-300 hover:bg-emerald-500/5
                         transition-all duration-200 cursor-pointer"
            >
              ← Back to Courses
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300
                         hover:border-red-500/60 hover:text-red-300 hover:bg-red-500/5
                         transition-all duration-200 cursor-pointer"
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="px-6 py-5 space-y-5 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
