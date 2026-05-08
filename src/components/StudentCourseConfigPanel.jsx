function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${(hour % 12) || 12}:${m} ${suffix}`;
}

export default function StudentCourseConfigPanel({
  courseName,
  startTime,
  endTime,
  graceMinutes,
  minMinutesPresent,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">

      {/* Course identity */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/60">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">
          Course
        </div>
        <div className="text-base font-semibold text-slate-100 leading-snug">
          {courseName || "—"}
        </div>
      </div>

      {/* Schedule */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2.5">
          Schedule
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-center">
            <div className="text-[10px] text-slate-500 mb-0.5">Start</div>
            <div className="text-sm font-semibold text-slate-100 font-mono tabular-nums">
              {formatTime(startTime)}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-slate-700">
            <div className="h-px w-3 bg-slate-700" />
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2.5 text-center">
            <div className="text-[10px] text-slate-500 mb-0.5">End</div>
            <div className="text-sm font-semibold text-slate-100 font-mono tabular-nums">
              {formatTime(endTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2.5">
          Attendance Rules
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 px-3 py-2.5">
            <div className="text-[10px] text-slate-500 mb-0.5">Grace window</div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-amber-300">{graceMinutes}</span>
              <span className="text-xs text-slate-500">min</span>
            </div>
          </div>
          <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 px-3 py-2.5">
            <div className="text-[10px] text-slate-500 mb-0.5">Min. to count</div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-300">{minMinutesPresent}</span>
              <span className="text-xs text-slate-500">min</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
