import { useState, useEffect } from "react";
import { db } from "../utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";

import {
  getMinuteFromTimestring,
  getMinuteFromTimestamp,
  getSessionDurationMinutes,
  getEffectiveStatus,
  getAttendanceSummary,
} from "../utils/attendance.js";
import { formatTotalDuration } from "../utils/time.jsx";

import DashboardLayout from "../layout/DashboardLayout.jsx";
import StudentDetailsPanel from "../components/StudentDetailsPanel.jsx";
import StudentCourseConfigPanel from "../components/StudentCourseConfigPanel.jsx";

import { getTodayKeyLocal } from "../utils/date";

const STATUS_STYLE = {
  ON_TIME:  { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300",  label: "On Time"    },
  LATE:     { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-300",    label: "Late"       },
  ABSENT:   { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-300",      label: "Absent"     },
  SKIPPED:  { bg: "bg-red-500/10",     border: "border-red-400/30",     text: "text-red-300",      label: "Left Early" },
  EXCUSED:  { bg: "bg-purple-500/10",  border: "border-purple-500/30",  text: "text-purple-300",   label: "Excused"    },
  PENDING:  { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-300",    label: "Pending"    },
  UNKNOWN:  { bg: "bg-slate-900/50",   border: "border-slate-700",      text: "text-slate-400",    label: "Unknown"    },
};

const DOT_COLOR = {
  ON_TIME: "bg-emerald-500",
  LATE:    "bg-amber-500",
  ABSENT:  "bg-red-500",
  SKIPPED: "bg-red-400",
  EXCUSED: "bg-purple-500",
  PENDING: "bg-amber-400",
};

function getDotColor(status) {
  return DOT_COLOR[status] || "bg-slate-600";
}

export default function StudentDashboard({
  student,
  courseDocId,
  courseMeta,
  onLogout,
  onBackToCourses,
}) {
  if (!student) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">No student data. Please log in again.</p>
      </div>
    );
  }

  if (!courseDocId || !courseMeta) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">
          Missing course selection. Please go back and pick a course.
        </p>
      </div>
    );
  }

  const uid = student.uid || student.id;

  const courseName = courseMeta.course_name || courseMeta.course_id || "Course";
  const startTime = courseMeta.start_time || "09:00";
  const endTime = courseMeta.end_time || "10:15";
  const graceMinutes =
    typeof courseMeta.grace_minutes === "number" ? courseMeta.grace_minutes : 10;
  const minMinutesPresent =
    typeof courseMeta.min_minutes_present === "number" ? courseMeta.min_minutes_present : 30;

  const [courseStudent, setCourseStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!courseDocId || !uid) return;

    setLoading(true);
    setLoadError("");

    if (!import.meta.env.VITE_PROJECT_ID) {
      setCourseStudent({ id: uid, uid, ...student });
      setLoading(false);
      return;
    }

    const ref = doc(db, "courses", courseDocId, "students", uid);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setCourseStudent({ id: snap.id, ...snap.data() });
          setLoadError("");
        } else {
          setCourseStudent(null);
          setLoadError("You are not registered for this course in the system.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("[StudentDashboard] onSnapshot error:", err);
        setLoadError("Failed to load your attendance data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [courseDocId, uid]);

  function computeAutomaticStatus(s) {
    if (!s) return "UNKNOWN";

    const startMinutes = getMinuteFromTimestring(startTime);
    const endMinutes = getMinuteFromTimestring(endTime);
    if (startMinutes === null || endMinutes === null) return "UNKNOWN";

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const arrivalInMinutes = getMinuteFromTimestamp(s.lastArrival);
    const leaveInMinutes = getMinuteFromTimestamp(s.lastLeave);
    const durationMinutes = getSessionDurationMinutes(s);

    const latestOnTime = startMinutes + graceMinutes;
    const latestLeaveTime = endMinutes + graceMinutes;

    if (durationMinutes === -1) return "UNKNOWN";
    if (arrivalInMinutes === null) return nowMinutes > latestLeaveTime ? "ABSENT" : "PENDING";
    if (arrivalInMinutes > latestLeaveTime) return "ABSENT";

    if (durationMinutes !== null) {
      if (durationMinutes < minMinutesPresent) return "SKIPPED";
      return arrivalInMinutes <= latestOnTime && leaveInMinutes <= latestLeaveTime
        ? "ON_TIME"
        : "LATE";
    }

    if (nowMinutes > latestLeaveTime) return "SKIPPED";
    return arrivalInMinutes <= latestOnTime ? "ON_TIME" : "LATE";
  }

  function computeStatus(s) {
    if (!s) return "UNKNOWN";

    const records = Array.isArray(s.attendanceRecords) ? s.attendanceRecords : [];
    const todayKey = getTodayKeyLocal();
    const todayRecord = records.find((r) => r.date === todayKey);

    if (todayRecord) {
      return todayRecord.overrideStatus || todayRecord.status || "UNKNOWN";
    }

    if (s.overrideStatus) return s.overrideStatus;
    if (s.status) return s.status;
    return computeAutomaticStatus(s);
  }

  const baseStudent = courseStudent || {
    id: uid,
    uid,
    name: student.name || "Unknown student",
    lastArrival: null,
    lastLeave: null,
    totalSeconds: 0,
    attendanceRecords: [],
    status: null,
    overrideStatus: null,
  };

  const todayKey = getTodayKeyLocal();
  const records = Array.isArray(baseStudent.attendanceRecords)
    ? baseStudent.attendanceRecords
    : [];
  const todayRecord = records.find((r) => r.date === todayKey);

  const displayStudent = todayRecord
    ? {
        ...baseStudent,
        lastArrival: todayRecord.lastArrival ?? baseStudent.lastArrival,
        lastLeave: todayRecord.lastLeave ?? baseStudent.lastLeave,
        totalSeconds:
          typeof todayRecord.durationSeconds === "number"
            ? todayRecord.durationSeconds
            : baseStudent.totalSeconds,
        status: todayRecord.overrideStatus || todayRecord.status || baseStudent.status,
        overrideStatus: todayRecord.overrideStatus ?? baseStudent.overrideStatus,
      }
    : baseStudent;

  const effectiveStatus = getEffectiveStatus(displayStudent, computeStatus, false);
  const attendanceSummary = getAttendanceSummary(displayStudent, effectiveStatus, false);
  const heroStyle = STATUS_STYLE[effectiveStatus] || STATUS_STYLE.UNKNOWN;

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard" onLogout={onLogout} onBack={onBackToCourses}>
        <div className="flex items-center gap-2 py-8">
          <div className="h-4 w-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <span className="text-sm text-slate-400">Loading your data…</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard" onLogout={onLogout} onBack={onBackToCourses}>
      {loadError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {loadError}
        </p>
      )}

      {/* ── Row 1: status hero (left) + course info (right) ── */}
      <section className="grid md:grid-cols-[3fr,2fr] gap-4">

        {/* Status hero */}
        <div className={`rounded-2xl border ${heroStyle.border} ${heroStyle.bg} p-5 flex flex-col`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className={`h-3 w-3 rounded-full ${heroStyle.dot}`} />
              <span className={`text-2xl font-bold tracking-tight ${heroStyle.text}`}>
                {heroStyle.label}
              </span>
            </div>
            <span className={`font-mono text-xs px-2.5 py-1 rounded-full border ${heroStyle.border} ${heroStyle.text}`}>
              {effectiveStatus}
            </span>
          </div>

          {/* Arrival / Leave / Duration */}
          <div className="grid grid-cols-3 gap-3 text-xs mb-4">
            {[
              { label: "Arrived",  val: displayStudent.lastArrival || "—" },
              { label: "Left",     val: displayStudent.lastLeave   || "—" },
              { label: "Duration", val: formatTotalDuration(displayStudent.totalSeconds || 0) },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-xl bg-black/20 border border-slate-800/60 px-3 py-2.5">
                <div className="text-slate-500 mb-0.5">{label}</div>
                <div className="font-mono text-slate-200 truncate">{val}</div>
              </div>
            ))}
          </div>

          {/* Attendance bar */}
          {attendanceSummary.total > 0 && (
            <div className="mt-auto">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">Overall attendance</span>
                <span className="text-slate-300 font-semibold">
                  {attendanceSummary.percent.toFixed(0)}%
                  <span className="text-slate-600 font-normal ml-1">
                    ({attendanceSummary.attended}/{attendanceSummary.total})
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    attendanceSummary.percent >= 80 ? "bg-emerald-500" :
                    attendanceSummary.percent >= 60 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(attendanceSummary.percent, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Dot timeline */}
          {records.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/40">
              <div className="text-[10px] text-slate-600 mb-2">Past sessions</div>
              <div className="flex gap-3 flex-wrap">
                {[...records].reverse().slice(0, 12).map((rec, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full ${getDotColor(rec.status)}`}
                      title={`${rec.date}: ${rec.status}`}
                    />
                    <span className="text-[9px] font-mono text-slate-700">{rec.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Course info */}
        <StudentCourseConfigPanel
          courseName={courseName}
          startTime={startTime}
          endTime={endTime}
          graceMinutes={graceMinutes}
          minMinutesPresent={minMinutesPresent}
        />
      </section>

      {/* ── Row 2: session history (full width) ── */}
      <StudentDetailsPanel
        selectedStudent={displayStudent}
        computeStatus={computeStatus}
        onOverrideStatusChange={() => {}}
        showOverrideControls={false}
        preview={false}
      />
    </DashboardLayout>
  );
}
