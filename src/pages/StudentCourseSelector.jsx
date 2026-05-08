import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";

import { MOCK_COURSE } from "../data/mockStudents.js";
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

      if (!import.meta.env.VITE_PROJECT_ID) {
        const mockCourses = courseIds
          .map((id) => (id === MOCK_COURSE.id ? MOCK_COURSE : null))
          .filter(Boolean);
        setCourses(mockCourses);
        setLoading(false);
        return;
      }

      try {
        const snaps = await Promise.all(
          courseIds.map((id) => getDoc(doc(db, "courses", id)))
        );

        const data = snaps
          .map((snap, index) =>
            snap.exists() ? { id: courseIds[index], ...snap.data() } : null
          )
          .filter(Boolean);

        setCourses(data);
      } catch (e) {
        console.error("[StudentCourseSelector] Error fetching courses:", e);
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
                <span className="font-mono text-slate-400">{student?.uid ?? "—"}</span>{" "}
                to a course.
              </p>
            </div>
          </div>
        )}

        {/* Course row list */}
        {!loading && courses.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-3">Select a course to view your attendance.</p>
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              {courses.map((course, i) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => onSelectCourse(course)}
                  className={`w-full flex items-center gap-4 px-4 py-4 text-left
                             hover:bg-slate-900 transition-colors duration-150 cursor-pointer group
                             ${i < courses.length - 1 ? "border-b border-slate-800/60" : ""}`}
                >
                  <span className="font-mono text-xs font-semibold text-slate-400 w-14 shrink-0">
                    {course.course_id || "—"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {course.course_name || "Untitled course"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {course.start_time && course.end_time
                        ? `${course.start_time} – ${course.end_time}`
                        : "Time not set"}
                      {" · "}Grace: {course.grace_minutes ?? 0} min
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
