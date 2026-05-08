import { formatTotalDuration } from '../utils/time.jsx';

const STATUS_STYLES = {
  ON_TIME: {
    badge: "border-emerald-500/60 text-emerald-300 bg-emerald-500/10",
    border: "border-l-emerald-500",
  },
  LATE: {
    badge: "border-red-500/60 text-red-300 bg-red-500/10",
    border: "border-l-red-500",
  },
  PENDING: {
    badge: "border-amber-500/60 text-amber-300 bg-amber-500/10",
    border: "border-l-amber-500",
  },
  ABSENT: {
    badge: "border-fuchsia-500/60 text-fuchsia-300 bg-fuchsia-500/10",
    border: "border-l-fuchsia-500",
  },
  SKIPPED: {
    badge: "border-pink-500/60 text-pink-300 bg-pink-500/10",
    border: "border-l-pink-500",
  },
  EXCUSED: {
    badge: "border-blue-500/60 text-blue-300 bg-blue-500/10",
    border: "border-l-blue-500",
  },
  UNKNOWN: {
    badge: "border-slate-500/60 text-slate-400 bg-slate-500/10",
    border: "border-l-slate-500",
  },
};

export default function StudentCard({ student, attendanceSummary, onClick }) {
  const { name, uid, totalSeconds, lastArrival, lastLeave, status } = student;
  const styles = STATUS_STYLES[status] || STATUS_STYLES.UNKNOWN;
  const { attended = 0, total = 0, percent = 0 } = attendanceSummary || {};

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border border-slate-800 border-l-4 ${styles.border}
                  bg-slate-900/70 p-4
                  hover:border-emerald-500 hover:border-l-4 hover:bg-slate-900
                  hover:shadow-lg hover:shadow-emerald-500/20
                  hover:-translate-y-1
                  transition-all duration-300 cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-slate-100">{name || "Unknown Student"}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">{uid}</div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles.badge}`}>
          {status || "PENDING"}
        </span>
      </div>

      <div className="text-xs text-slate-400 space-y-1.5">
        <div className="flex justify-between">
          <span>Total time</span>
          <span className="text-slate-200 font-medium">{formatTotalDuration(totalSeconds || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Last arrival</span>
          <span className="text-slate-200 font-mono">{lastArrival || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>Last leave</span>
          <span className="text-slate-200 font-mono">{lastLeave || "—"}</span>
        </div>
        {total > 0 && (
          <div className="pt-1">
            <div className="flex justify-between mb-1">
              <span>Attendance</span>
              <span className="text-slate-200 font-medium">
                {percent.toFixed(0)}% ({attended}/{total})
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
