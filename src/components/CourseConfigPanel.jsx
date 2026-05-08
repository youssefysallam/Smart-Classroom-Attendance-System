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
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold mb-3">Course Configuration</h2>

      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Course Name
          </label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => onCourseNameChange(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 hover:border-emerald-400 hover:bg-slate-900/80 transition-colors ease-in-out"
            placeholder="e.g. CS101 - Intro to CS"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 hover:border-emerald-400 hover:bg-slate-900/80 transition-colors ease-in-out cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 hover:border-emerald-400 hover:bg-slate-900/80 transition-colors ease-in-out cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Grace period (min)
            </label>
            <input
              type="number"
              value={graceMinutes}
              onChange={(e) => onGraceMinutesChange(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 hover:border-emerald-400 hover:bg-slate-900/80 transition-colors ease-in-out"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Min. minutes to count as attended
          </label>
          <input
            type="number"
            value={minMinutesPresent}
            onChange={(e) => onMinMinutesPresentChange(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 hover:border-emerald-400 hover:bg-slate-900/80 transition-colors ease-in-out"
          />
        </div>

        <p className="text-xs text-slate-400 mt-1">
          Changing these values will recalculate who is considered{" "}
          <span className="text-emerald-300">ON_TIME</span>,{" "}
          <span className="text-red-300">LATE</span>,{" "}
          <span className="text-amber-300">PENDING</span>,{" "}
          <span className="text-fuchsia-300">ABSENT</span>, and{" "}
          <span className="text-pink-300">SKIPPED</span>.
        </p>
      </div>
    </div>
  );
}
