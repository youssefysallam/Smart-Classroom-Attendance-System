import { getEffectiveStatus } from "../utils/attendance";
import { formatTotalDuration } from "../utils/time";

const STATUS_DOT = {
  ON_TIME:  "bg-emerald-500",
  LATE:     "bg-amber-500",
  ABSENT:   "bg-red-500",
  SKIPPED:  "bg-red-400",
  EXCUSED:  "bg-purple-500",
  PENDING:  "bg-amber-400",
  UNKNOWN:  "bg-slate-600",
};

const STATUS_TEXT = {
  ON_TIME:  "text-emerald-400",
  LATE:     "text-amber-400",
  ABSENT:   "text-red-400",
  SKIPPED:  "text-red-300",
  EXCUSED:  "text-purple-400",
  PENDING:  "text-amber-300",
  UNKNOWN:  "text-slate-500",
};

function ts(val) {
  if (!val) return "—";
  const s = String(val);
  const parts = s.split(" ");
  if (parts.length >= 2) return parts[1].slice(0, 5);
  return s;
}

export default function StudentsGrid({
  students,
  selectedStudent,
  computeStatus,
  onSelectStudent,
  setShowAddStudentForm,
  preview,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/40 shrink-0">
        <span className="text-xs font-semibold text-slate-300">
          Roster
          <span className="ml-2 text-slate-600 font-normal">{students.length} enrolled</span>
        </span>
        <button
          type="button"
          onClick={() => setShowAddStudentForm(true)}
          className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add student
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[minmax(0,1fr),90px,52px,52px,60px] gap-2 px-4 py-1.5
                      border-b border-slate-800/60 bg-slate-900/20 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Name</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Status</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">In</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Out</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Time</span>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto divide-y divide-slate-800/40 flex-1">
        {students.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No students enrolled yet.
          </div>
        )}

        {students.map((s) => {
          const status = getEffectiveStatus(s, computeStatus, preview);
          const isSelected = selectedStudent?.id === s.id;
          const dot = STATUS_DOT[status] || STATUS_DOT.UNKNOWN;
          const textC = STATUS_TEXT[status] || STATUS_TEXT.UNKNOWN;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStudent(isSelected ? null : s)}
              className={`w-full grid grid-cols-[minmax(0,1fr),90px,52px,52px,60px] items-center gap-2
                          px-4 py-2.5 text-left transition-all duration-150 cursor-pointer
                          ${isSelected
                            ? "bg-emerald-500/8 border-l-2 border-l-emerald-500 pl-[14px]"
                            : "hover:bg-slate-900/60 border-l-2 border-l-transparent"}`}
            >
              <span className={`text-sm font-medium truncate ${isSelected ? "text-slate-50" : "text-slate-200"}`}>
                {s.name}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
                <span className={`text-[11px] font-semibold ${textC} truncate`}>{status}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{ts(s.lastArrival)}</span>
              <span className="font-mono text-[11px] text-slate-400">{ts(s.lastLeave)}</span>
              <span className="font-mono text-[11px] text-slate-400">{formatTotalDuration(s.totalSeconds || 0)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
