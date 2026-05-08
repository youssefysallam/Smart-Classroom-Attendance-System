import { useEffect, useState } from "react";

import { db } from "../utils/firebase";
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";

import { MOCK_STUDENTS } from "../data/mockStudents.js";
import {
  getMinuteFromTimestring,
  getMinuteFromTimestamp,
  getSessionDurationMinutes,
} from "../utils/attendance.js";

import DashboardLayout from "../layout/DashboardLayout.jsx";
import ClassAttendanceOverview from "../components/ClassAttendanceOverview.jsx";
import CourseConfigPanel from "../components/CourseConfigPanel.jsx";
import StudentDetailsPanel from "../components/StudentDetailsPanel.jsx";
import StudentsGrid from "../components/StudentsGrid.jsx";
import AddStudent from "../components/AddStudent.jsx";

import { getTodayKeyLocal } from "../utils/date";

function getTodayKey() {
  // Local date, simple and good enough for this project
  //return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return getTodayKeyLocal();
}

export default function ProfessorDashboard({ courseDocId, courseMeta, onLogout, onBackToCourses }) {
  // Course configuration state (initialized from courseMeta)
  const [courseName, setCourseName] = useState(
    courseMeta?.course_name || courseMeta?.course_id || "CS410"
  );
  const [startTime, setStartTime] = useState(
    courseMeta?.start_time || "09:00"
  );
  const [endTime, setEndTime] = useState(
    courseMeta?.end_time || "10:15"
  );
  const [graceMinutes, setGraceMinutes] = useState(
    typeof courseMeta?.grace_minutes === "number"
      ? courseMeta.grace_minutes
      : 10
  );
  const [minMinutesPresent, setMinMinutesPresent] = useState(
    typeof courseMeta?.min_minutes_present === "number"
      ? courseMeta.min_minutes_present
      : 30
  );

  // UI feedback for saving config
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [clearingStates, setClearingStates] = useState(false);

  const [saveError, setSaveError] = useState("");
  const [saveAttendanceError, setSaveAttendanceError] = useState("");
  const [saveClearStateError, setClearStateError] = useState("");

  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [lastSavedAttendance, setLastSavedAttendance] = useState(null);
  const [lastSavedClearState, setLastSavedClearState] = useState(null);

  // Students (still local for now)
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);

  // Load course config from Firestore on mount
  useEffect(() => {
    if (!courseDocId) return;

    const ref = doc(db, "courses", courseDocId);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data.course_name) setCourseName(data.course_name);
        if (data.start_time) setStartTime(data.start_time);
        if (data.end_time) setEndTime(data.end_time);
        if (typeof data.grace_minutes === "number")
          setGraceMinutes(data.grace_minutes);
        if (typeof data.min_minutes_present === "number")
          setMinMinutesPresent(data.min_minutes_present);
      },
      (err) => {
        console.error("Error loading course config (onSnapshot):", err);
      }
    );

    return () => unsubscribe();
  }, [courseDocId]);

   useEffect(() => {
    if (!courseDocId) return;

    const colRef = collection(db, "courses", courseDocId, "students");

    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        const data = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setStudents(data);

        // keep selectedStudent in sync if it exists
        setSelectedStudent((prev) => {
          if (!prev) return prev;
          const updated = data.find((s) => s.id === prev.id);
          return updated || null;
        });
      },
      (err) => {
        console.error("[ProfessorDashboard] onSnapshot students error:", err);
      }
    );

    return () => unsubscribe();
  }, [courseDocId]);

  // Save course configuration back to Firestore
  async function handleSaveConfig() {
    if (!courseDocId) return;

    try {
      setSavingConfig(true);
      setSaveError("");

      const ref = doc(db, "courses", courseDocId);

      await setDoc(
        ref,
        {
          // keep course_id & prof_id stable, use what's in courseMeta
          course_id: courseMeta?.course_id || "",
          prof_id: courseMeta?.prof_id || "",
          course_name: courseName,
          start_time: startTime,
          end_time: endTime,
          grace_minutes: Number(graceMinutes) || 0,
          min_minutes_present: Number(minMinutesPresent) || 0,
        },
        { merge: true }
      );

      setLastSavedAt(new Date());
    } catch (e) {
      console.error("Error saving course config:", e);
      setSaveError("Failed to save course configuration.");
    } finally {
      setSavingConfig(false);
    }
  }

  // Automatically computes the student status. Basically, computeStatus code was
  // transferred to here
  function computeAutomaticStatus(student) {
    const startMinutes = getMinuteFromTimestring(startTime);
    const endMinutes = getMinuteFromTimestring(endTime);

    if (startMinutes === null || endMinutes === null) {
      return "UNKNOWN";
    }

    const now = new Date();
    const nowMinutes =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const arrivalInMinutes = getMinuteFromTimestamp(student.lastArrival);
    const leaveInMinutes = getMinuteFromTimestamp(student.lastLeave);
    const durationMinutes = getSessionDurationMinutes(student);

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

  useEffect(() => {
    if (!courseDocId || students.length === 0) return;

    async function syncStatuses() {
      const updates = [];

      // Updates each student's in the course status
      // to the database
      for (const s of students) {
        if (!s) continue;

        // If there's an override, do not touch status
        if (s.overrideStatus) continue;

        // Status calculated for the student
        const auto = computeAutomaticStatus(s);

        // Only persist if changed. Avoids multiple writes to the database
        // when not needed
        if (auto && auto !== s.status) {
          updates.push({ id: s.id, status: auto });
          try {
            const ref = doc(db, "courses", courseDocId, "students", s.id);
            await updateDoc(ref, { status: auto });
          } catch (e) {
            console.error(
              "[ProfessorDashboard] Error updating status for",
              s.id,
              e
            );
          }
        }
      }

      // Updates every student inside the students array
      if (updates.length > 0) {
        setStudents((prev) =>
          prev.map((s) => {
            const u = updates.find((u) => u.id === s.id);
            return u ? { ...s, status: u.status } : s;
          })
        );

        // Updates selected students' status
        setSelectedStudent((prev) => {
          if (!prev) return prev;
          const u = updates.find((u) => u.id === prev.id);
          return u ? { ...prev, status: u.status } : prev;
        });
      }
    }

    syncStatuses();
  }, [students, startTime, endTime, graceMinutes, minMinutesPresent, courseDocId]);

  // Override status for a student
  async function setOverrideStatus(studentId, newStatus) {
    const override = newStatus || null;

    // 1) Local state: overrideStatus only
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, overrideStatus: override } : s
      )
    );

    setSelectedStudent((prev) =>
      prev && prev.id === studentId
        ? { ...prev, overrideStatus: override }
        : prev
    );

    if (!courseDocId) return;

    // 2) Persist overrideStatus to Firestore, but DO NOT touch attendanceRecords
    try {
      const ref = doc(db, "courses", courseDocId, "students", studentId);
      await updateDoc(ref, {
        overrideStatus: override,
      });
    } catch (e) {
      console.error("[ProfessorDashboard] Error saving overrideStatus:", e);
    }
  }

  // Compute status now returns the students status that's been
  // saved on the database.
  function computeStatus(student) {
    if (!student) return "UNKNOWN";

    if (student.overrideStatus) return student.overrideStatus;
    if (student.status) return student.status;

    // Computes the students' status as a fallback if for some reason
    // it wasn't already computed
    return computeAutomaticStatus(student);
  }

  function handleStudentCreated(newStudent) {
    // update local list immediately
    //setStudents((prev) => [...prev, newStudent]);
    setShowAddStudentForm(false);
  }

  async function handleDeleteStudent(student) {
    if (!courseDocId) return;

    const confirmed = window.confirm(
      `Remove ${student.name || student.uid} from this course? This action cannot be undone!`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "courses", courseDocId, "students", student.id)
      );

      // Delete student on global level
      const globalRef = doc(db, "students", student.id);
      const globalSnap = await getDoc(globalRef);

      if (globalSnap.exists()) {
        const data = globalSnap.data();
        const currentCourses = Array.isArray(data.courses) ? data.courses : [];

        const newCourses = currentCourses.filter((cid) => cid !== courseDocId);

        if (newCourses.length === 0) {
          await deleteDoc(globalRef);
        } else {
          await setDoc(
            globalRef,
            { courses: newCourses},
            { merge : true}
          );
        }
      }
      // update local state
      setStudents((prev) => prev.filter((s) => s.id !== student.id));

      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent(null);
      }
    } catch (e) {
      console.error("[ProfessorDashboard] Error deleting student:", e);
    }
  }

  async function finalizeTodayAttendance() {
      if (!courseDocId) return;

      if (!students || students.length === 0) {
        window.alert(`There's no students in this course to finalize attendance!`);
        return;
      }

      const todayKey = getTodayKey();

      const confirmed = window.confirm(
        `Snapshot today's attendance for ${students.length} student(s)?`
      );
      if (!confirmed) return;

      try {
        setSavingAttendance(true);
        setSaveAttendanceError("");
        const updated = [];

        for (const s of students) {
          if (!s) continue;

          // compute automatic + effective status
          const auto = computeAutomaticStatus(s);
          const effectiveStatus = s.overrideStatus || auto || "UNKNOWN";

          // duration snapshot (seconds)
          const durSeconds =
            typeof s.totalSeconds === "number"
              ? s.totalSeconds
              : Math.max(
                  0,
                  Math.round((getSessionDurationMinutes(s) || 0) * 60)
                );

          // existing history without any previous record for today
          const existingRecords = Array.isArray(s.attendanceRecords)
            ? s.attendanceRecords.filter((rec) => rec.date !== todayKey)
            : [];

          const record = {
            date: todayKey,
            status: effectiveStatus,
            overrideStatus: s.overrideStatus || null,
            lastArrival: s.lastArrival || null,
            lastLeave: s.lastLeave || null,
            durationSeconds: durSeconds,
          };

          const newRecords = [...existingRecords, record];

          // write to Firestore
          const ref = doc(db, "courses", courseDocId, "students", s.id);
          await updateDoc(ref, {
            attendanceRecords: newRecords,
            status: effectiveStatus,
          });

          updated.push({
            id: s.id,
            attendanceRecords: newRecords,
            status: effectiveStatus,
          });
        }

        // update local state
        if (updated.length > 0) {
          setStudents((prev) =>
            prev.map((s) => {
              const u = updated.find((x) => x.id === s.id);
              return u
                ? {
                    ...s,
                    attendanceRecords: u.attendanceRecords,
                    status: u.status,
                  }
                : s;
            })
          );

          setSelectedStudent((prev) => {
            if (!prev) return prev;
            const u = updated.find((x) => x.id === prev.id);
            return u
              ? {
                  ...prev,
                  attendanceRecords: u.attendanceRecords,
                  status: u.status,
                }
              : prev;
          });
        }
        setLastSavedAttendance(new Date());
      } catch (e) {
        console.error("[ProfessorDashboard] Error finalizing attendance:", e);
        //alert("Failed to snapshot attendance. Check console for details.");
        setSaveAttendanceError("Failed to snapshot attendance. Check console for details.");
      } finally {
        setSavingAttendance(false);
      }
    }

    async function clearLiveStateForAllStudents() {
      if (!courseDocId) return;

      if (!students || students.length === 0) {
        window.alert("There's no students in this course to clear their stats!");
        return;
      }

      const confirmed = window.confirm(
        `Clear today's live arrival/leave/totalSeconds/status/overrideStatus for ${students.length} student(s)?`
      );

      if (!confirmed) return;

      try {
        setClearingStates(true);
        setClearStateError("");

        for (const s of students) {
          if (!s || !s.id) continue;
          const ref = doc(db, "courses", courseDocId, "students", s.id);
          await updateDoc(ref, {
            lastArrival: null,
            lastLeave: null,
            totalSeconds: 0,
            status: "UNKNOWN",
            overrideStatus: null,
          });
        }
        setLastSavedClearState(new Date());

      } catch (e) {
        console.error("[ProfessorDashboard] Error clearing live state:", e);
        //alert("Failed to clear live state. Check console for details.");
        setClearStateError("Failed to clear live state. Check console for details.");
      } finally {
        setClearingStates(false);
      }
    }

  return (
    <DashboardLayout title="Professor Dashboard" onLogout={onLogout} onBack={onBackToCourses}>
      {/* Top: class overview */}
      <ClassAttendanceOverview
        students={students}
        computeStatus={computeStatus}
        preview={true}
      />

      {/* Middle: course config + student details */}
      <section className="grid md:grid-cols-[2fr,3fr] gap-4">
        <div>
          <CourseConfigPanel
            courseName={courseName}
            startTime={startTime}
            endTime={endTime}
            graceMinutes={graceMinutes}
            minMinutesPresent={minMinutesPresent}
            onCourseNameChange={setCourseName}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onGraceMinutesChange={setGraceMinutes}
            onMinMinutesPresentChange={setMinMinutesPresent}
          />

          {/* Action panel — numbered workflow steps */}
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            {/* Step 01 */}
            <div className="p-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-slate-600">01</span>
                <span className="text-sm font-semibold text-slate-100">Save Course Settings</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">Persist class timing &amp; grace config to Firestore.</p>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full rounded-xl border border-emerald-500 bg-emerald-600/20 px-3 py-2 text-xs font-medium text-emerald-200
                           hover:bg-emerald-600/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30
                           transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? "Saving…" : "Save Settings"}
              </button>
              <div className="mt-2 min-h-[16px]">
                {saveError && <span className="text-[11px] text-red-400">{saveError}</span>}
                {!saveError && lastSavedAt && (
                  <span className="text-[11px] text-slate-500">
                    ✓ Saved at{" "}
                    {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-slate-600">02</span>
                <span className="text-sm font-semibold text-slate-100">Finalize Today&apos;s Attendance</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">Snapshot all current statuses to attendance history.</p>
              <button
                type="button"
                onClick={finalizeTodayAttendance}
                disabled={savingAttendance}
                className="w-full rounded-xl border border-purple-500 bg-purple-600/20 px-3 py-2 text-xs font-medium text-purple-200
                           hover:bg-purple-600/30 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/30
                           transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {savingAttendance ? "Saving…" : "Finalize Attendance"}
              </button>
              <div className="mt-2 min-h-[16px]">
                {saveAttendanceError && <span className="text-[11px] text-red-400">{saveAttendanceError}</span>}
                {!saveAttendanceError && lastSavedAttendance && (
                  <span className="text-[11px] text-slate-500">
                    ✓ Done at{" "}
                    {lastSavedAttendance.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-slate-600">03</span>
                <span className="text-sm font-semibold text-slate-100">Clear Live Info</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">Reset arrivals, leaves &amp; statuses for the next session.</p>
              <button
                type="button"
                onClick={clearLiveStateForAllStudents}
                disabled={clearingStates}
                className="w-full rounded-xl border border-red-500 bg-red-600/20 px-3 py-2 text-xs font-medium text-red-200
                           hover:bg-red-600/30 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/30
                           transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {clearingStates ? "Clearing…" : "Clear Live Info"}
              </button>
              <div className="mt-2 min-h-[16px]">
                {saveClearStateError && <span className="text-[11px] text-red-400">{saveClearStateError}</span>}
                {!saveClearStateError && lastSavedClearState && (
                  <span className="text-[11px] text-slate-500">
                    ✓ Cleared at{" "}
                    {lastSavedClearState.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="ring-1 ring-slate-800/60 rounded-2xl">
          <StudentDetailsPanel
            selectedStudent={selectedStudent}
            computeStatus={computeStatus}
            onOverrideStatusChange={setOverrideStatus}
            showOverrideControls={true}
            onDeleteStudent={handleDeleteStudent}
            preview={true}
          />
        </div>
      </section>

      {/* Bottom: student cards */}
      <StudentsGrid
        students={students}
        selectedStudent={selectedStudent}
        computeStatus={computeStatus}
        onSelectStudent={setSelectedStudent}
        setShowAddStudentForm={setShowAddStudentForm}
        preview={true}
      />

      {showAddStudentForm && (
          <AddStudent
            courseDocId={courseDocId}
            onCreated={handleStudentCreated}
            onCancel={() => setShowAddStudentForm(false)}
          />
        )}
    </DashboardLayout>
  );
}
