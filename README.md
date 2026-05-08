# Smart Classroom Attendance System

An NFC-powered attendance tracking system for college classrooms. Students tap their NFC card at an ESP32-based reader; the React frontend updates in real time via Firestore and lets professors configure grace periods, finalize records, and override individual statuses.

---

## Key Features

- **NFC card login** — students authenticate with their physical card UID; no passwords
- **Real-time Firestore sync** — `onSnapshot` listeners push arrival, leave, and status updates to every connected client instantly
- **Automatic status computation** — ON_TIME / LATE / ABSENT / SKIPPED / PENDING calculated from configurable start time, end time, and grace period
- **Manual overrides** — professors can lock any student to EXCUSED or another status, bypassing automatic rules
- **Attendance finalization** — one-click snapshot of today's session appended to each student's `attendanceRecords` history
- **Attendance history** — per-student session log with dates, arrival/leave times, durations, and override markers
- **Visual progress bars** — per-card and class-level attendance bars for at-a-glance health
- **Professor-only controls** — add/delete students, configure course settings, clear live state for next session

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS v4 |
| Database | Firebase Firestore (real-time) |
| Hardware | ESP32 + RFID-RC522 (Arduino) |
| Bridge | Node.js Express server (`esp32-bridge/`) |
| Language | JavaScript (JSX) |

---

## Architecture

```
ESP32 + RC522
     │  HTTP POST /tap {uid}
     ▼
esp32-bridge (Node/Express)
     │  writes to Firestore
     ▼
Firestore (cloud)
     │  onSnapshot listeners
     ▼
React frontend (professor + student views)
```

The ESP32 reader posts each card scan to the bridge server. The bridge writes to Firestore; all open browser tabs receive the update via Firestore's real-time listeners within ~200ms.

---

## Project Structure

```
Smart_Classroom_Attendance/
  Smart_Classroom_Attendance.ino   ESP32 Arduino sketch (RFID reader)
esp32-bridge/
  server.js                        Node.js bridge: /tap → Firestore write
src/
  pages/
    Login.jsx                      Role selector (student / professor)
    ProfessorDashboard.jsx         Full dashboard with config + student grid
    StudentDashboard.jsx           Student's own attendance view
  components/
    StudentCard.jsx                Status badge + attendance mini-bar
    ClassAttendanceOverview.jsx    Class-level progress bar
    StudentDetailsPanel.jsx        Session history + override controls
    CourseConfigPanel.jsx          Grace period, start/end time config
  layout/
    DashboardLayout.jsx            Sticky header, max-width container
  utils/
    firebase.js                    Firestore client init
    attendance.js                  Status computation + summary helpers
```

---

## Getting Started

### Prerequisites

- Firebase project with Firestore enabled
- Node.js 18+

### Frontend

```bash
npm install
npm run dev
```

Set your Firebase config in `src/utils/firebase.js`.

### ESP32 Bridge

```bash
cd esp32-bridge
npm install
node server.js
```

Set the Firestore service account credentials via environment variable.

### ESP32 Hardware

Flash `Smart_Classroom_Attendance.ino` with Arduino IDE. Configure the WiFi SSID, password, and bridge server URL at the top of the sketch.

---

## Status Reference

| Status | Meaning |
|---|---|
| `ON_TIME` | Arrived within grace period, stayed long enough |
| `LATE` | Arrived after grace period |
| `ABSENT` | Class ended, never arrived |
| `SKIPPED` | Arrived but left before minimum present time |
| `EXCUSED` | Manually set by professor |
| `PENDING` | Class in session, not yet arrived |
| `UNKNOWN` | Data missing or error — review manually |
