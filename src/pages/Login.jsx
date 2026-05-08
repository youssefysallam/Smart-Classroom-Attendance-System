import { useState } from "react";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import { MOCK_STUDENTS } from "../data/mockStudents.js";

function lookupMockStudent(uid) {
  return (
    MOCK_STUDENTS.find(
      (s) => s.uid.toUpperCase() === uid.toUpperCase()
    ) || null
  );
}

export default function Login({ onLogin }) {
  const [role, setRole] = useState("student");
  const [uid, setUid] = useState("");
  const [profId, setProfId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (role === "professor") {
        const profTrimmed = profId.trim();
        if (!profTrimmed) {
          setError("Please enter your professor ID.");
          return;
        }
        onLogin({ role: "professor", user: { profId: profTrimmed } });
        return;
      }

      const trimmed = uid.trim();
      if (!trimmed) {
        setError("Please enter your card UID.");
        return;
      }

      const uidUpper = trimmed.toUpperCase();

      // No Firebase config — skip Firestore and use mock data directly
      if (!import.meta.env.VITE_PROJECT_ID) {
        const mock = lookupMockStudent(uidUpper);
        if (mock) {
          onLogin({
            role: "student",
            user: { id: mock.uid, uid: mock.uid, name: mock.name, ...mock },
          });
        } else {
          setError("No student found with that UID.");
        }
        return;
      }

      const ref = doc(db, "students", uidUpper);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const mock = lookupMockStudent(uidUpper);
        if (mock) {
          onLogin({
            role: "student",
            user: { id: mock.uid, uid: mock.uid, name: mock.name, ...mock },
          });
          return;
        }
        setError("No student found with that UID.");
        return;
      }

      const data = snap.data();
      onLogin({
        role: "student",
        user: { id: uidUpper, uid: uidUpper, name: data.name || uidUpper, ...data },
      });
    } catch (err) {
      console.error("[Login] Error:", err);
      const mock = lookupMockStudent(uid.trim().toUpperCase());
      if (mock) {
        onLogin({
          role: "student",
          user: { id: mock.uid, uid: mock.uid, name: mock.name, ...mock },
        });
        return;
      }
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-4">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Smart Classroom</h1>
          <p className="text-sm text-slate-500 mt-1">NFC-powered attendance tracking</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 backdrop-blur-sm"
        >
          {/* Role selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Sign in as</label>
            <div className="flex gap-2">
              {["student", "professor"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium capitalize transition-all duration-200 cursor-pointer
                    ${role === r
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-500/20"
                      : "border-slate-700 bg-slate-950/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Input field */}
          {role === "student" ? (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">NFC Card UID</label>
              <input
                type="text"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="e.g. 04:A3:BC:91"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                           hover:border-slate-600 transition-all duration-200"
              />
              <p className="text-[11px] text-slate-600 mt-1.5">
                Scan your NFC card or enter the UID manually.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Professor ID</label>
              <input
                type="text"
                value={profId}
                onChange={(e) => setProfId(e.target.value)}
                placeholder="e.g. Fletcher01"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                           hover:border-slate-600 transition-all duration-200"
              />
              <p className="text-[11px] text-slate-600 mt-1.5">
                Your ID namespaces your courses — only you see them.
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold py-2.5
                       hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30
                       active:scale-[0.98]
                       transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
