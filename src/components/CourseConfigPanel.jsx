function Stepper({ value, onChange, min = 0, step = 5 }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Number(value) - step))}
        className="h-7 w-7 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 text-sm font-bold
                   hover:border-slate-500 hover:text-slate-100 hover:bg-slate-800
                   transition-all duration-150 cursor-pointer flex items-center justify-center select-none"
      >
        −
      </button>
      <span className="w-14 text-center text-sm font-semibold text-slate-100 tabular-nums">
        {value} min
      </span>
      <button
        type="button"
        onClick={() => onChange(Number(value) + step)}
        className="h-7 w-7 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 text-sm font-bold
                   hover:border-slate-500 hover:text-slate-100 hover:bg-slate-800
                   transition-all duration-150 cursor-pointer flex items-center justify-center select-none"
      >
        +
      </button>
    </div>
  );
}

export default function CourseConfigPanel({
  courseName,
  startTime,
  endTime,
  graceMinutes,
  minMinutesPresent,
  onCourseNameChange,
  onStartTimeChange,
  onEndTimeChange,
  onGraceMinutesChange,
  onMinMinutesPresentChange,
}) {
  const timeInputClass =
    "w-full bg-transparent text-sm font-semibold text-slate-100 text-center " +
    "focus:outline-none cursor-pointer";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">

      {/* Course name */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/60">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
          Course Name
        </label>
        <input
          type="text"
          value={courseName}
          onChange={(e) => onCourseNameChange(e.target.value)}
          placeholder="e.g. CS101 — Intro to Computer Science"
          className="w-full bg-transparent text-base font-semibold text-slate-100 placeholder-slate-600
                     focus:outline-none border-b border-transparent focus:border-slate-700
                     transition-colors duration-200 pb-0.5"
        />
      </div>

      {/* Schedule */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2.5">
          Schedule
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5
                          focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30
                          transition-all duration-200">
            <div className="text-[10px] text-slate-500 mb-0.5">Start</div>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className={timeInputClass}
            />
          </div>

          <div className="shrink-0 flex items-center gap-1 text-slate-700">
            <div className="h-px w-3 bg-slate-700" />
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5
                          focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30
                          transition-all duration-200">
            <div className="text-[10px] text-slate-500 mb-0.5">End</div>
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className={timeInputClass}
            />
          </div>
        </div>
      </div>

      {/* Rules: steppers */}
      <div className="divide-y divide-slate-800/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm text-slate-300">Grace window</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Late arrivals allowed within this window</div>
          </div>
          <Stepper value={graceMinutes} onChange={onGraceMinutesChange} min={0} step={5} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm text-slate-300">Min. to count</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Minimum time present to mark as attended</div>
          </div>
          <Stepper value={minMinutesPresent} onChange={onMinMinutesPresentChange} min={5} step={5} />
        </div>
      </div>

    </div>
  );
}
