import { useState } from "react";
import { db } from "../utils/firebase.js";
import { collection, addDoc } from "firebase/firestore";

export default function AddCourse({ profId, onCreated, onCancel }) {
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [minMinutesPresent, setMinMinutesPresent] = useState(30);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 " +
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 " +
    "hover:border-slate-600 transition-all duration-200";

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!courseId || !courseName || !startTime || !endTime) {
      setErrorMsg("Course code, name, and times are required.");
      return;
    }

    const payload = {
      course_id: courseId.trim(),
      course_name: courseName.trim(),
      start_time: startTime,
      end_time: endTime,
      grace_minutes: Number(graceMinutes) || 0,
      min_minutes_present: Number(minMinutesPresent) || 0,
      prof_id: profId,
      createdAt: Date.now(),
    };

    try {
      setSaving(true);

      if (!import.meta.env.VITE_PROJECT_ID) {
        const localId = `local-${Date.now()}`;
        const fullCourse = { id: localId, ...payload };
        if (onCreated) onCreated(fullCourse);
        return;
      }

      const docRef = await addDoc(collection(db, "courses"), payload);
      const fullCourse = { id: docRef.id, ...payload };
      if (onCreated) onCreated(fullCourse);
    } catch (e) {
      console.error("[AddCourse] Error:", e);
      setErrorMsg("Failed to create course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">New Course</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Code + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-[100px,1fr] gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Course Code</label>
          <input
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="CS410"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Course Name</label>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. Smart Classroom Attendance"
            className={inputClass}
          />
        </div>
      </div>

      {/* Start + End time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClass + " cursor-pointer"}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputClass + " cursor-pointer"}
          />
        </div>
      </div>

      {/* Grace + Min present */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Grace period (min)</label>
          <input
            type="number"
            value={graceMinutes}
            onChange={(e) => setGraceMinutes(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Min. minutes to count</label>
          <input
            type="number"
            value={minMinutesPresent}
            onChange={(e) => setMinMinutesPresent(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold py-2.5
                   hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30
                   active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60"
      >
        {saving ? "Creating…" : "Create Course"}
      </button>
    </form>
  );
}
