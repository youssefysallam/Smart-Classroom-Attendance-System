import { useState, useEffect } from "react";
import StudentCard from "../components/StudentCard.jsx";
import { db } from "../utils/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import {
  getMinuteFromTimestring,
  getMinuteFromTimestamp,
  getSessionDurationMinutes,
  getEffectiveStatus,
  getAttendanceSummary,
} from "../utils/attendance.js";

import DashboardLayout from "../layout/DashboardLayout.jsx";
import StudentDetailsPanel from "../components/StudentDetailsPanel.jsx";
import StudentAttendanceOverview from "../components/StudentAttendanceOverview.jsx";
import StudentCourseConfigPanel from "../components/StudentCourseConfigPanel.jsx";

import { getTodayKeyLocal } from "../utils/date";

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
        <p className="text-sm text-slate-400">
          No student data. Please log in again.
        </p>
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

  // course config as read-only values coming from Firestore
  const courseName =
    courseMeta.course_name || courseMeta.course_id || "Course";
  const startTime = courseMeta.start_time || "09:00";
  const endTime = courseMeta.end_time || "10:15";
  const graceMinutes =
    typeof courseMeta.grace_minutes === "number"
      ? courseMeta.grace_minutes
      : 10;
  const minMinutesPresent =
    typeof courseMeta.min_minutes_present === "number"
      ? courseMeta.min_minutes_present
      : 30;

  // per-course student doc (courses/{courseDocId}/students/{uid})
  const [courseStudent, setCourseStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showDetails, setShowDetails] = useState(false);


  // Firestore fetch
  useEffect(() => {
    if (!courseDocId || !uid) return;

    setLoading(true);
    setLoadError("");

    const ref = doc(db, "courses", courseDocId, "students", uid);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const full = { id: snap.id, ...data };
          setCourseStudent(full);
          setLoadError("");
        } else {
          setCourseStudent(null);
          setShowDetails(false);
          setLoadError(
            "You are not registered for this course in the system."
          );
        }
        setLoading(false);
      },
      (err) => {
        console.error("[StudentDashboard] onSnapshot error:", err);
        setLoadError("Failed to load your attendance data.");
        setLoading(false);
      }
    );

    // cleanup when course/uid changes or component unmounts
    return () => unsubscribe();
  }, [courseDocId, uid]);

  function computeAutomaticStatus(s) {
    if (!s) return "UNKNOWN";

    const startMinutes = getMinuteFromTimestring(startTime);
    const endMinutes = getMinuteFromTimestring(endTime);

    if (startMinutes === null || endMinutes === null) {
      return "UNKNOWN";
    }

    const now = new Date();
    const nowMinutes =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const arrivalInMinutes = getMinuteFromTimestamp(s.lastArrival);
    const leaveInMinutes = getMinuteFromTimestamp(s.lastLeave);
    const durationMinutes = getSessionDurationMinutes(s);

    const latestOnTime = startMinutes + graceMinutes;
    const latestLeaveTime = endMinutes + graceMinutes;

    if (durationMinutes === -1) {
      return "UNKNOWN";
    }

    if (arrivalInMinutes === null) {
      if (nowMinutes > latestLeaveTime) {
        return "ABSENT";
      }
      return "PENDING";
    }

    if (arrivalInMinutes > latestLeaveTime) {
      return "ABSENT";
    }

    if (durationMinutes !== null) {
      if (durationMinutes < minMinutesPresent) {
        return "SKIPPED";
      }

      if (
        arrivalInMinutes <= latestOnTime &&
        leaveInMinutes <= latestLeaveTime
      ) {
        return "ON_TIME";
      } else {
        return "LATE";
      }
    }

    if (nowMinutes > latestLeaveTime) {
      return "SKIPPED";
    } else {
      if (arrivalInMinutes <= latestOnTime) {
        return "ON_TIME";
      } else {
        return "LATE";
      }
    }
  }

  // respects overrideStatus / saved status snapshot
  function computeStatus(s) {
    if (!s) return "UNKNOWN";

    // If today's attendance was finalized, use that
    const records = Array.isArray(s.attendanceRecords)
      ? s.attendanceRecords
      : [];

    //const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const todayKey = getTodayKeyLocal();

    const todayRecord = records.find((r) => r.date === todayKey);

    if (todayRecord) {
      // If professor ever overrode at finalize time, respect that first
      return (
        todayRecord.overrideStatus ||
        todayRecord.status ||
        "UNKNOWN"
      );
    }

    // No finalized record for today, so fall back to live status
    if (s.overrideStatus) return s.overrideStatus;
    if (s.status) return s.status;

    // Absolute fallback: compute automatically
    return computeAutomaticStatus(s);
  }

  // if Firestore doc missing, still show *something* using global student info
  const baseStudent =
    courseStudent || {
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

    //const todayKey = new Date().toISOString().slice(0, 10);
    const todayKey = getTodayKeyLocal();
    
    const records = Array.isArray(baseStudent.attendanceRecords)
      ? baseStudent.attendanceRecords
      : [];
    const todayRecord = records.find((r) => r.date === todayKey);

    const displayStudent = todayRecord
      ? {
          ...baseStudent,
          // trust today's snapshot for the student view
          lastArrival: todayRecord.lastArrival ?? baseStudent.lastArrival,
          lastLeave: todayRecord.lastLeave ?? baseStudent.lastLeave,
          totalSeconds:
            typeof todayRecord.durationSeconds === "number"
              ? todayRecord.durationSeconds
              : baseStudent.totalSeconds,
          status:
            todayRecord.overrideStatus ||
            todayRecord.status ||
            baseStudent.status,
          overrideStatus:
            todayRecord.overrideStatus ?? baseStudent.overrideStatus,
        }
      : baseStudent;
      
  const effectiveStatus = getEffectiveStatus(displayStudent, computeStatus, false);
  const attendanceSummary = getAttendanceSummary(
    displayStudent,
    effectiveStatus,
    false
  );

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard" onLogout={onLogout} onBack={onBackToCourses}>
        <div className="text-sm text-slate-300">Loading your data…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard" onLogout={onLogout} onBack={onBackToCourses}>
      {loadError && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
          {loadError}
        </p>
      )}

      {/* Top overview */}
      <StudentAttendanceOverview
        student={displayStudent}
        computeStatus={computeStatus}
      />

      {/* Middle: course info + details */}
      <section className="grid md:grid-cols-[2fr,3fr] gap-4">
        <StudentCourseConfigPanel
          courseName={courseName}
          startTime={startTime}
          endTime={endTime}
          graceMinutes={graceMinutes}
          minMinutesPresent={minMinutesPresent}
        />

        <StudentDetailsPanel
          selectedStudent={showDetails ? displayStudent : null}
          computeStatus={computeStatus}
          onOverrideStatusChange={() => {}}
          showOverrideControls={false}
          preview={false}
        />
      </section>

      {/* Bottom: card view */}
      <section>
        <h2 className="text-sm font-semibold text-slate-100 pb-2 border-b border-slate-800/60 mb-4">
          Today&apos;s Status
        </h2>
        <div className="max-w-sm">
          <StudentCard
            student={{ ...displayStudent, status: effectiveStatus }}
            attendanceSummary={attendanceSummary}
            onClick={() => {
              setShowDetails(prev => !prev);
            }}
          />
        </div>
      </section>

    </DashboardLayout>
  );
}
