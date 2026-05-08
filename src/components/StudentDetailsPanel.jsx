import {
  STATUS_OPTIONS,
  getEffectiveStatus,
  getAttendanceSummary,
  getAttendanceColorClass,
} from "../utils/attendance";
import { formatTotalDuration } from "../utils/time";
import { getTodayKeyLocal } from "../utils/date";

import sTierGif from "../assets/attendance/s_tier.gif";
import decentGif from "../assets/attendance/decent.gif";
import badGif from "../assets/attendance/bad.gif";
import awfulGif from "../assets/attendance/awful.gif";

const HERO = {
  ON_TIME:  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300", dot: "bg-emerald-500" },
  LATE:     { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-300",   dot: "bg-amber-500"  },
  ABSENT:   { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-300",     dot: "bg-red-500"    },
  SKIPPED:  { bg: "bg-red-400/10",     border: "border-red-400/30",     text: "text-red-300",     dot: "bg-red-400"    },
  EXCUSED:  { bg: "bg-purple-500/10",  border: "border-purple-500/30",  text: "text-purple-300",  dot: "bg-purple-500" },
  PENDING:  { bg: "bg-amber-400/10",   border: "border-amber-400/30",   text: "text-amber-300",   dot: "bg-amber-400"  },
  UNKNOWN:  { bg: "",                  border: "border-slate-700",      text: "text-slate-400",   dot: "bg-slate-600"  },
};

const PILL = {
  ON_TIME:  "bg-emerald-500/25 border-emerald-500 text-emerald-200",
  LATE:     "bg-amber-500/25  border-amber-500  text-amber-200",
  ABSENT:   "bg-red-500/25    border-red-500    text-red-200",
  SKIPPED:  "bg-red-400/25    border-red-400    text-red-200",
  EXCUSED:  "bg-purple-500/25 border-purple-500 text-purple-200",
  "":       "bg-slate-700/40  border-slate-500  text-slate-200",
};

const STATUS_COLOR = {
  ON_TIME: "text-emerald-400",
  LATE:    "text-amber-400",
  ABSENT:  "text-red-400",
  SKIPPED: "text-red-300",
  EXCUSED: "text-purple-400",
  PENDING: "text-amber-300",
};

function borderL(status) {
  switch (status) {
    case "ON_TIME":  return "border-l-emerald-500";
    case "LATE":     return "border-l-amber-500";
    case "ABSENT":   return "border-l-red-500";
    case "SKIPPED":  return "border-l-red-400";
    case "EXCUSED":  return "border-l-purple-500";
    default:         return "border-l-slate-600";
  }
}

function gif(p) {
  if (p >= 90) return { src: sTierGif, caption: "NERD", shadow: "shadow-emerald-500/40" };
  if (p >= 70) return { src: decentGif, caption: "Decent attendance...or is it?", shadow: "shadow-yellow-500/40" };
  if (p >= 40) return { src: badGif, caption: "POV: You're failing the course", shadow: "shadow-orange-500/40" };
  return { src: awfulGif, caption: "Your professor about to Hollow Purple your ahh", shadow: "shadow-red-500/40" };
}

function ts(val) {
  if (!val) return "—";
  const s = String(val);
  const parts = s.split(" ");
  if (parts.length >= 2) return parts[1].slice(0, 5);
  return s;
}

export default function StudentDetailsPanel({
  selectedStudent,
  computeStatus,
  onOverrideStatusChange,
  showOverrideControls = true,
  onDeleteStudent,
  preview,
}) {
  if (!selectedStudent) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col items-center justify-center gap-3 min-h-[200px] p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700">
          <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-400">No student selected</p>
          <p className="text-xs text-slate-600 mt-0.5">Select a student from the roster.</p>
        </div>
      </div>
    );
  }

  let viewStudent = selectedStudent;

  if (!preview) {
    const recs = Array.isArray(selectedStudent.attendanceRecords)
      ? selectedStudent.attendanceRecords : [];
    const todayKey = getTodayKeyLocal();
    const todayRec = recs.find((r) => r.date === todayKey);
    if (todayRec) {
      viewStudent = {
        ...selectedStudent,
        lastArrival:   todayRec.lastArrival   != null  ? todayRec.lastArrival   : selectedStudent.lastArrival,
        lastLeave:     todayRec.lastLeave     != null  ? todayRec.lastLeave     : selectedStudent.lastLeave,
        totalSeconds:  typeof todayRec.durationSeconds === "number" ? todayRec.durationSeconds : selectedStudent.totalSeconds,
        status:        todayRec.overrideStatus || todayRec.status || selectedStudent.status,
        overrideStatus: todayRec.overrideStatus ?? selectedStudent.overrideStatus,
      };
    }
  }

  const effectiveStatus = getEffectiveStatus(viewStudent, computeStatus, preview);
  const { attended, total, percent } = getAttendanceSummary(viewStudent, effectiveStatus, preview);
  const color = getAttendanceColorClass(percent);
  const hero = HERO[effectiveStatus] || HERO.UNKNOWN;
  const currentOverride = viewStudent.overrideStatus || "";

  const sortedRecords = Array.isArray(viewStudent.attendanceRecords)
    ? [...viewStudent.attendanceRecords].sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const g = total > 0 ? gif(percent) : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden flex flex-col">

      {/* ── Header: name + status ── */}
      <div className={`px-4 pt-4 pb-3 border-b border-slate-800/60 ${hero.bg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${hero.dot}`} />
              <span className="text-base font-bold text-slate-100 truncate">{viewStudent.name}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-400 bg-slate-800/80 border border-slate-700 rounded-md px-1.5 py-0.5">
              {viewStudent.uid}
            </span>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${hero.border} ${hero.text} ${hero.bg}`}>
            {effectiveStatus}
          </span>
        </div>
      </div>

      {/* ── Stats: in / out / duration ── */}
      <div className="grid grid-cols-3 divide-x divide-slate-800/60 border-b border-slate-800/60">
        {[
          { label: "In",       val: ts(viewStudent.lastArrival) },
          { label: "Out",      val: ts(viewStudent.lastLeave)   },
          { label: "Duration", val: formatTotalDuration(viewStudent.totalSeconds || 0) },
        ].map(({ label, val }) => (
          <div key={label} className="px-3 py-2.5 text-center">
            <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
            <div className="text-xs font-mono font-semibold text-slate-200">{val}</div>
          </div>
        ))}
      </div>

      {/* ── Override pills (professor only) ── */}
      {showOverrideControls && (
        <div className="px-4 py-3 border-b border-slate-800/60">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
            Override
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onOverrideStatusChange(viewStudent.id, "")}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all duration-150 cursor-pointer
                ${!currentOverride
                  ? PILL[""]
                  : "border-slate-700/60 text-slate-600 hover:border-slate-600 hover:text-slate-400"}`}
            >
              Auto
            </button>
            {STATUS_OPTIONS.map((s) => {
              const isActive = currentOverride === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onOverrideStatusChange(viewStudent.id, s)}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all duration-150 cursor-pointer
                    ${isActive
                      ? (PILL[s] || PILL[""])
                      : "border-slate-700/60 text-slate-600 hover:border-slate-600 hover:text-slate-400"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {currentOverride && (
            <p className="text-[10px] text-amber-500/80 mt-1.5">
              ↑ Override active — automatic rules bypassed
            </p>
          )}
        </div>
      )}

      {/* ── Attendance bar ── */}
      {total > 0 && (
        <div className="px-4 py-3 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Attendance
            </span>
            <span className={`text-sm font-bold ${color}`}>
              {percent.toFixed(0)}%
              <span className="text-slate-500 text-xs font-normal ml-1">{attended}/{total}</span>
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${
                percent >= 80 ? "bg-emerald-500" : percent >= 60 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ── GIF ── */}
      {g && (
        <div className="px-4 py-3 border-b border-slate-800/60 flex flex-col items-center gap-2">
          <p className="text-xs font-medium text-slate-400">{g.caption}</p>
          <img
            src={g.src}
            alt="Attendance mood"
            className={`h-36 w-36 rounded-xl object-cover border border-slate-700 shadow-lg ${g.shadow}`}
          />
        </div>
      )}

      {/* ── Session history ── */}
      <div className="px-4 py-3 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
          Sessions
        </div>
        {sortedRecords.length === 0 ? (
          <p className="text-xs text-slate-500">No sessions recorded yet.</p>
        ) : (
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            {sortedRecords.map((rec, idx) => {
              const effStatus = rec.overrideStatus || rec.status || "UNKNOWN";
              const tagColor = STATUS_COLOR[effStatus] || "text-slate-400";
              return (
                <div
                  key={`${rec.date}-${idx}`}
                  className={`flex items-center justify-between text-[11px] border border-slate-800/80 border-l-[3px] ${borderL(effStatus)} rounded-lg px-2.5 py-1.5 bg-slate-950/50`}
                >
                  <div>
                    <span className="font-semibold text-slate-200">{rec.date}</span>
                    <span className="text-slate-500 ml-2 font-mono text-[10px]">
                      {ts(rec.lastArrival)} → {ts(rec.lastLeave)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-500 text-[10px]">
                      {formatTotalDuration(rec.durationSeconds || 0)}
                    </span>
                    <span className={`font-semibold text-[10px] ${tagColor}`}>
                      {effStatus}
                      {rec.overrideStatus && <span className="text-amber-400 ml-0.5">↑</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete ── */}
      {showOverrideControls && onDeleteStudent && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onDeleteStudent(viewStudent)}
            className="w-full text-[11px] py-1.5 rounded-xl border border-red-500/25 text-red-400/60
                       hover:bg-red-500/5 hover:border-red-500/40 hover:text-red-300
                       transition-all duration-200 cursor-pointer"
          >
            Remove from course
          </button>
        </div>
      )}
    </div>
  );
}
