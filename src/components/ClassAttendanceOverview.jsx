import {
  getClassAttendanceSummary,
  getAttendanceColorClass,
  getAttendanceEmoji,
} from "../utils/attendance";

export default function ClassAttendanceOverview({ students, computeStatus, preview }) {
  const { totalSessions, totalAttended, percent } =
    getClassAttendanceSummary(students, computeStatus, preview);
  const color = getAttendanceColorClass(percent);
  const emoji = getAttendanceEmoji(percent);

  const barColor =
    percent >= 80 ? "bg-emerald-500" :
    percent >= 60 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 mb-1">
            Class Attendance Overview
          </h2>
          <p className={`text-lg font-bold ${color}`}>
            {percent.toFixed(1)}%
            <span className="text-slate-400 text-xs font-normal ml-2">
              {totalSessions > 0 && `${totalAttended} / ${totalSessions} session-marks`}
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Present = ON_TIME, LATE, or EXCUSED
          </p>
        </div>
        <div className="text-4xl">{emoji}</div>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </section>
  );
}
