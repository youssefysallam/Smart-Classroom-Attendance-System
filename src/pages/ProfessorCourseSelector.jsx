import { useEffect, useState } from "react";
import { db } from "../utils/firebase";
import { collection, getDocs, query, where, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

import { MOCK_COURSE } from "../data/mockStudents.js";
import AddCourse from "../components/AddCourse.jsx";
import DashboardLayout from "../layout/DashboardLayout.jsx";

export default function ProfessorCourseSelector({ profId, onSelectCourse, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      if (!import.meta.env.VITE_PROJECT_ID) {
        const mockCourses = [MOCK_COURSE].filter((c) => c.prof_id === profId);
        setCourses(mockCourses);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "courses"),
          where("prof_id", "==", profId)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCourses(data);
      } catch (e) {
        console.error("Error fetching courses:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [profId]);

  function handleCourseCreated(newCourse) {
    setCourses((prev) => [...prev, newCourse]);
    setShowAddForm(false);
  }

  async function handleDeleteCourse(course) {
    const ok = window.confirm(
      `Delete course "${course.course_id || course.course_name}"? This cannot be undone.`
    );
    if (!ok) return;

    if (!import.meta.env.VITE_PROJECT_ID) {
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      return;
    }

    try {
      const studentsSnap = await getDocs(
        collection(db, "courses", course.id, "students")
      );

      const studentCleanupPromises = studentsSnap.docs.map(async (studentDoc) => {
        const uid = studentDoc.id;
        await deleteDoc(studentDoc.ref);

        const globalRef = doc(db, "students", uid);
        const globalSnap = await getDoc(globalRef);

        if (globalSnap.exists()) {
          const data = globalSnap.data();
          const currentCourses = Array.isArray(data.courses) ? data.courses : [];
          const newCourses = currentCourses.filter((cid) => cid !== course.id);

          if (newCourses.length === 0) {
            await deleteDoc(globalRef);
          } else {
            await setDoc(globalRef, { courses: newCourses }, { merge: true });
          }
        }
      });

      await Promise.all(studentCleanupPromises);
      await deleteDoc(doc(db, "courses", course.id));
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch (e) {
      console.error("Error deleting course:", e);
      alert("Failed to delete course. Check console for details.");
    }
  }

  return (
    <DashboardLayout title="Courses" onLogout={onLogout}>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              {profId}&apos;s Courses
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a course to open its dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5
                       text-xs font-medium text-emerald-300
                       hover:bg-emerald-500/20 hover:border-emerald-400
                       transition-all duration-200 cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Course
          </button>
        </div>

        {/* Add course form */}
        {showAddForm && (
          <AddCourse
            profId={profId}
            onCreated={handleCourseCreated}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 py-8">
            <div className="h-4 w-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <span className="text-sm text-slate-400">Loading courses…</span>
          </div>
        )}

        {/* Course table */}
        {!loading && (
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[minmax(60px,80px),minmax(0,1fr),minmax(120px,auto),60px] items-center gap-4
                            px-4 py-2 border-b border-slate-800 bg-slate-900/40">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Code</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Course</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Schedule</span>
              <span />
            </div>

            {/* Empty state */}
            {courses.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-slate-500">No courses yet.</p>
                <p className="text-xs text-slate-600 mt-1">Click &quot;New Course&quot; to create one.</p>
              </div>
            )}

            {/* Course rows */}
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
                className="grid grid-cols-[minmax(60px,80px),minmax(0,1fr),minmax(120px,auto),60px] items-center gap-4
                           px-4 py-3.5 border-b border-slate-800/60 last:border-0
                           hover:bg-slate-900/60 transition-colors duration-150 cursor-pointer group"
              >
                <span className="font-mono text-xs font-semibold text-slate-300 truncate">
                  {course.course_id || "—"}
                </span>
                <span className="text-sm text-slate-100 truncate">
                  {course.course_name || "Untitled"}
                </span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {course.start_time && course.end_time
                    ? `${course.start_time} – ${course.end_time}`
                    : "—"}
                </span>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCourse(course);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-700/60 text-slate-500
                               hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5
                               transition-all duration-200 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
