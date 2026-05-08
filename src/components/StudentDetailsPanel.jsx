import {
  STATUS_OPTIONS,
  formatSessionDuration,
  getEffectiveStatus,
  getAttendanceSummary,
  getAttendanceColorClass,
  getAttendanceEmoji,
} from "../utils/attendance";
import { formatTotalDuration } from "../utils/time";

import { getTodayKeyLocal } from "../utils/date";

import sTierGif from "../assets/attendance/s_tier.gif";
import decentGif from "../assets/attendance/decent.gif";
import badGif from "../assets/attendance/bad.gif";
import awfulGif from "../assets/attendance/awful.gif";

function getAttendanceImage(percent) {
  if (percent >= 90) return sTierGif;
  if (percent >= 70) return decentGif;
  if (percent >= 40) return badGif;
  return awfulGif;
}

function getAttendanceCaption(percent) {
  if (percent >= 90) return "NERD";
  if (percent >= 70) return "Decent attendance...or is it?";
  if (percent >= 40) return "POV: You're failing the course";
  return "Your professor about to Hollow Purple your ahh";
}

function getAttendanceShadow(percent) {
  if (percent >= 90) return "shadow-emerald-500";
  if (percent >= 70) return "shadow-yellow-500";
  if (percent >= 40) return "shadow-orange-500";
  return "shadow-red-500";
}

function getStatusBorderColor(status) {
  switch (status) {
    case "ON_TIME":  return "border-l-emerald-500";
    case "LATE":     return "border-l-amber-500";
    case "ABSENT":   return "border-l-red-500";
    case "SKIPPED":  return "border-l-red-400";
    case "EXCUSED":  return "border-l-purple-500";
    default:         return "border-l-slate-600";
  }
}

export default function StudentDetailsPanel({
  selectedStudent,
  computeStatus,
  onOverrideStatusChange,
  showOverrideControls = true,
  onDeleteStudent,
  preview,
}) {
  // Nothing selected
  if (!selectedStudent) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col items-center justify-center gap-3 min-h-[140px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700">
          <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-400">No student selected</p>
          <p className="text-xs text-slate-600 mt-0.5">Click a student card to view details.</p>
        </div>
      </div>
    );
  }

  let viewStudent = selectedStudent;

  if (!preview) {
    // student view: prefer today's finalized snapshot if it exists
    const records = Array.isArray(selectedStudent.attendanceRecords)
      ? selectedStudent.attendanceRecords
      : [];

    //const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const todayKey = getTodayKeyLocal();
    const todayRecord = records.find((r) => r.date === todayKey);

    if (todayRecord) {
      viewStudent = {
        ...selectedStudent,
        // Use finalized snapshot as the primary source
        lastArrival:
          todayRecord.lastArrival != null
            ? todayRecord.lastArrival
            : selectedStudent.lastArrival,
        lastLeave:
          todayRecord.lastLeave != null
            ? todayRecord.lastLeave
            : selectedStudent.lastLeave,
        totalSeconds:
          typeof todayRecord.durationSeconds === "number"
            ? todayRecord.durationSeconds
            : selectedStudent.totalSeconds,
        status:
          todayRecord.overrideStatus ||
          todayRecord.status ||
          selectedStudent.status,
        overrideStatus:
          todayRecord.overrideStatus ?? selectedStudent.overrideStatus,
      };
    }
  }

  const effectiveStatus = getEffectiveStatus(viewStudent, computeStatus, preview);
  const { attended, total, percent } = getAttendanceSummary(
    viewStudent,
    effectiveStatus,
    preview
  );
  const color = getAttendanceColorClass(percent);
  const emoji = getAttendanceEmoji(percent);
  const imageSrc = total > 0 ? getAttendanceImage(percent) : null;
  const caption = total > 0 ? getAttendanceCaption(percent) : null;
  const imageShadow = total > 0 ? getAttendanceShadow(percent) : null;

  const records = Array.isArray(viewStudent.attendanceRecords)
    ? [...viewStudent.attendanceRecords]
    : [];

  if (records.length > 0) {
    records.sort((a, b) => b.date.localeCompare(a.date)); // newest first
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold mb-3">Student details</h2>

      <div className="text-sm text-slate-200 space-y-2">
        <div>
          <span className="text-slate-400 text-xs">Name</span>
          <div className="font-medium">{viewStudent.name}</div>
        </div>

        <div>
          <span className="text-slate-400 text-xs">UID</span>
          <div className="text-xs text-slate-300">
            {viewStudent.uid}
          </div>
        </div>

        <div>
          <span className="text-slate-400 text-xs">Total Time</span>
          <div className="text-xs text-slate-300">
            {formatTotalDuration(viewStudent.totalSeconds || 0)}
          </div>
        </div>

        <div>
          <span className="text-slate-400 text-xs">Arrival Time</span>
          <div className="text-xs">
            {viewStudent.lastArrival || "N/A"}
          </div>
        </div>

        <div>
          <span className="text-slate-400 text-xs">Leave Time</span>
          <div className="text-xs">
            {viewStudent.lastLeave || "N/A"}
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-xs">Status</span>
          <div className="text-xs">
            {effectiveStatus}
          </div>
        </div>

        {showOverrideControls && (
          <div>
            <span className="text-slate-400 text-xs">Override Status</span>
            <select
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                         hover:border-emerald-500 hover:bg-slate-900 transition-colors ease-in-out cursor-pointer"
              value={viewStudent.overrideStatus || ""}
              onChange={(e) =>
                onOverrideStatusChange(viewStudent.id, e.target.value)
              }
            >
              <option value="">Use Automatic</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-2">
              Choosing a value here locks this student&apos;s status and
              ignores automatic rules until you switch back to
              <span className="italic"> Use automatic</span>.
            </p>
          </div>
        )}

        {/* Attendance summary */}
        <div>
          <span className="text-slate-400 text-xs">Attendance</span>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold ${color}`}>
                {total > 0
                  ? `${percent.toFixed(2)}% attendance (${attended}/${total} sessions)`
                  : "No attendance data"}
              </div>
              {total > 0 && (
                <div className="text-[10px] text-slate-500">
                  Present = ON_TIME, LATE, or EXCUSED
                </div>
              )}
            </div>
            <div className="text-2xl">{emoji}</div>
          </div>

          {imageSrc && (
            <div className="mt-3 flex flex-col items-center gap-2">
              {caption && (
                <div className="text-[19px] text-slate-400 text-center max-w-s">
                  {caption}
                </div>
              )}
              <img
                src={imageSrc}
                alt="Attendance mood gif"
                className={`h-60 w-60 rounded-xl object-cover border border-slate-700 
                           shadow-xl ${imageShadow}`}
              />
            </div>
          )}
        </div>

        {/* Delete button (professor only) */}
        {showOverrideControls && (
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteStudent && viewStudent) {
                  onDeleteStudent(viewStudent);
                }
              }}
              className="text-[12px] mt-2 px-2 py-0.5 rounded-full
                         border border-red-500/60 text-red-300 bg-slate-900/80
                         hover:bg-red-500/10 hover:border-red-400 
                         hover:shadow-lg hover:shadow-red-500/50
                         hover:-translate-y-1 hover:scale-101
                         transition-all duration-400 cursor-pointer"
            >
              Delete Student
            </button>
          </div>
        )}

        {/* Session history */}
        <div className="mt-3">
          <span className="text-slate-400 text-xs">Session history</span>
          {records.length === 0 ? (
            <p className="text-[11px] text-slate-500 mt-1">
              No saved sessions yet.
            </p>
          ) : (
            <div className="mt-1 max-h-40 overflow-y-auto pr-1 space-y-1">
              {records.map((rec, idx) => {
                const effStatus =
                  rec.overrideStatus || rec.status || "UNKNOWN";
                return (
                  <div
                    key={`${rec.date}-${idx}`}
                    className={`flex justify-between items-baseline text-[11px] border border-slate-800 border-l-[3px] ${getStatusBorderColor(effStatus)} rounded-lg px-2 py-1 bg-slate-950/60`}
                  >
                    <div>
                      <div className="font-medium text-slate-100">
                        {rec.date}
                      </div>
                      <div className="text-slate-400">
                        {(rec.lastArrival || "N/A") +
                          " → " +
                          (rec.lastLeave || "N/A")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center rounded-full border border-slate-600 px-2 py-0.5 text-[10px] text-slate-100">
                        {effStatus}
                        {rec.overrideStatus && (
                          <span className="ml-1 text-[9px] text-amber-300">
                            (override)
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {formatTotalDuration(rec.durationSeconds || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
