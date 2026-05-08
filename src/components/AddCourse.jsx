import { useState } from "react";
import { db } from "../utils/firebase.js";
import { collection, addDoc } from "firebase/firestore";

function Stepper({ value, onChange, min = 0, step = 5 }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Number(value) - step))}
        className="h-7 w-7 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 text-sm font-bold
                   hover:border-slate-500 hover:text-slate-100 hover:bg-slate-800
                   transition-all duration-150 cursor-pointer flex items-center justify-center select-none"
      >
        −
      </button>
      <span className="w-14 text-center text-sm font-semibold text-slate-100 tabular-nums">
        {value} min
      </span>
      <button
        type="button"
        onClick={() => onChange(Number(value) + step)}
        className="h-7 w-7 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 text-sm font-bold
                   hover:border-slate-500 hover:text-slate-100 hover:bg-slate-800
                   transition-all duration-150 cursor-pointer flex items-center justify-center select-none"
      >
        +
      </button>
    </div>
  );
}

export default function AddCourse({ profId, onCreated, onCancel }) {
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:15");
  const [graceMinutes, setGraceMinutes] = useState(10);
  const [minMinutesPresent, setMinMinutesPresent] = useState(30);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!courseId.trim() || !courseName.trim() || !startTime || !endTime) {
      setErrorMsg("Course code, name, and times are required.");
      return;
    }

    const payload = {
      course_id: courseId.trim().toUpperCase(),
      course_name: courseName.trim(),
      start_time: startTime,
      end_time: endTime,
      grace_minutes: graceMinutes,
      min_minutes_present: minMinutesPresent,
      prof_id: profId,
      createdAt: Date.now(),
    };

    try {
      setSaving(true);

      if (!import.meta.env.VITE_PROJECT_ID) {
        const localId = `local-${Date.now()}`;
        if (onCreated) onCreated({ id: localId, ...payload });
        return;
      }

      const docRef = await addDoc(collection(db, "courses"), payload);
      if (onCreated) onCreated({ id: docRef.id, ...payload });
    } catch (err) {
      console.error("[AddCourse] Error:", err);
      setErrorMsg("Failed to create course.");
    } finally {
      setSaving(false);
    }
  }

  const timeInputClass =
    "w-full bg-transparent text-sm font-semibold text-slate-100 text-center " +
    "focus:outline-none cursor-pointer";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <span className="text-sm font-semibold text-slate-100">New Course</span>
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

      {/* Identity: code badge + name */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
          Identity
        </div>
        <div className="flex gap-3 items-start">
          <div>
            <input
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="CS410"
              maxLength={8}
              className="w-24 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5
                         text-sm font-mono font-bold text-emerald-300 placeholder-slate-600 uppercase
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60
                         hover:border-slate-600 transition-all duration-200 text-center tracking-widest"
            />
          </div>
          <div className="flex-1">
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Course full name…"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5
                         text-sm text-slate-100 placeholder-slate-600
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60
                         hover:border-slate-600 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Schedule: connected time blocks */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
          Schedule
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5
                          focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/25
                          transition-all duration-200">
            <div className="text-[10px] text-slate-500 mb-0.5">Start</div>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={timeInputClass}
            />
          </div>

          <div className="shrink-0 flex items-center text-slate-700">
            <div className="h-px w-4 bg-slate-700" />
            <svg className="h-3.5 w-3.5 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <div className="h-px w-4 bg-slate-700" />
          </div>

          <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5
                          focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/25
                          transition-all duration-200">
            <div className="text-[10px] text-slate-500 mb-0.5">End</div>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={timeInputClass}
            />
          </div>
        </div>
      </div>

      {/* Rules: stepper rows */}
      <div className="divide-y divide-slate-800/60">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <div className="text-sm text-slate-300">Grace window</div>
            <div className="text-[11px] text-slate-600 mt-0.5">How late an arrival still counts on time</div>
          </div>
          <Stepper value={graceMinutes} onChange={setGraceMinutes} min={0} step={5} />
        </div>
        <div className="flex items-center justify-between px-5 py-3.5">
          <div>
            <div className="text-sm text-slate-300">Minimum to count</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Minutes present before marking as attended</div>
          </div>
          <Stepper value={minMinutesPresent} onChange={setMinMinutesPresent} min={5} step={5} />
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="px-5 pt-3">
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="p-5 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold py-2.5
                     hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30
                     active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create Course"}
        </button>
      </div>
    </form>
  );
}
