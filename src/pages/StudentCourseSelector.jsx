import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";

import DashboardLayout from "../layout/DashboardLayout.jsx";

export default function StudentCourseSelector({ student, onSelectCourse, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      if (!student) {
        setLoading(false);
        return;
      }

      const courseIds = Array.isArray(student.courses) ? student.courses : [];

      if (courseIds.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch each course doc by id from the student's global courses array
        const snaps = await Promise.all(
          courseIds.map((id) => getDoc(doc(db, "courses", id)))
        );

        const data = snaps
          .map((snap, index) =>
            snap.exists()
              ? { id: courseIds[index], ...snap.data() }
              : null
          )
          .filter(Boolean);

        setCourses(data);
      } catch (e) {
        console.error("[StudentCourseSelector] Error fetching courses for student:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [student]);

  return (
    <DashboardLayout title="Your Courses" onLogout={onLogout}>
      <div className="space-y-5">

        {/* Identity banner */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-800/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 shrink-0">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <div className="text-base font-semibold text-slate-100">
              {student?.name || "Student"}
            </div>
            <span className="font-mono text-[11px] text-slate-400 bg-slate-800/80 border border-slate-700 rounded-md px-1.5 py-0.5">
              {student?.uid || "—"}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400">Select a course to view your attendance.</p>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 py-8">
            <div className="h-4 w-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <span className="text-sm text-slate-400">Loading your courses…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && courses.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700">
              <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No courses enrolled</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Ask your professor to add card UID{" "}
                <span className="font-mono text-slate-400">{student?.uid}</span>{" "}
                to a course.
              </p>
            </div>
          </div>
        )}

        {/* Course cards */}
        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCourse(course)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectCourse(course);
                  }
                }}
                className="group text-left w-full rounded-2xl border border-slate-800
                           bg-slate-900/70 p-4
                           hover:border-emerald-500 hover:bg-slate-900
                           hover:shadow-lg hover:shadow-emerald-500/50
                           hover:-translate-y-1 hover:scale-101
                           transition-all duration-400 cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-300 mb-1">
                  {course.course_id || "(No ID)"}
                </div>
                <div className="text-sm font-medium text-slate-100">
                  {course.course_name || "Untitled course"}
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  {course.start_time && course.end_time
                    ? `Time: ${course.start_time} – ${course.end_time}`
                    : "Time: not configured"}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Grace: {course.grace_minutes ?? 0} min
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Min present: {course.min_minutes_present ?? 0} min
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
