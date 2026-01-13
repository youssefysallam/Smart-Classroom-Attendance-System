# 🎓 Smart-Classroom-Attendance-System  
An EPIC classroom-ready solution that records student attendance via RFID.

---

## ⚡ Quick Info

**esp32-bridge**  
Folder that contains the server code to be hosted online using services such as Render.

**Smart_Classroom_Attendance**  
Folder that contains Arduino code for the ESP32-S.

**Everything else**  
Vite + React + JavaScript SWC website. Can run `npm run build` after setting up the repository locally to host online using services such as Netlify.

---

## 🔧 How It Works

An ESP32-S is connected on a breadboard connected to a RFID reader, a LED, and a buzzer using jumper wires. Then, the Arduino code inside **Smart_Classroom_Attendance** is uploaded to the ESP32-S. The user would modify the Arduino Code to connect to their specific WiFi. The user would also include the course doc id from the database after the professor already created a course in the website. Thus, the attendance system only works for one course per professor.

Then, the server code inside the **esp32-bridge** folder is hosted online using services such as Render.

Then, the website is hosted on a service such as Netlify, or ran locally using Vite + React + JavaScript SWC.

---

## 🧠 Attendance Flow

Now, how does the attendance system works?

The professor would buy NFC cards / NFC tags. Each NFC card has a UID (which is unique for every student).

Once the ESP32 project is powered, it would connect to the selected WiFi. Then, students would tap their card to the RFID reader. If the scan was successfull, the LED will blink and the buzzer will make a sound. Then, the ESP32 would send a request to the server, which would then communicate to the database and back to the ESP32. The ESP32 would use the status code returned by the server to see if the scan was successful or not, and would display that in the Arduino IDE’s Serial Monitor (for debugging).

If the student is already in the course, the student's arrival or leave time would be updated on the database based on if their last tap was an arrival or leave. If the student taps their card for arrival when they already have an arrival and leave, the students arrival would be updated on the databse, and their leave and totalSeconds would be reset. Regardless, sucessful leave and arrival times are displayed on the Arduino IDE serial monitor.

If the student is not in the course, the ESP32 would let the user know the card UID is not valid.

Now, if the student taps their card and they are in the course, but their arrival or leave time failed, then the ESP32 would not count that arrival / leave. That way, when the student taps their card again for arrival / leave, the ESP32 will pick off where they left off.  
For example, if a student taps for arrival but there was a network issue, the student can tap their card again and it would be logged as arrival.

---

## 👨‍🏫 Professor & Student Workflow

Now, the professor has to open up the website and enter whatever ID they want. They should remember this ID since this is where their created courses will be saved.

Then, the professor can create courses. Then, the professor can click into the course. They can also modify the course if needed to be.

Then, the professor can add a student by adding the students UID and name. Only when the student is added, can students scan their card and have their arrival and leave times saved to the database.

To figure out the course doc id, the professor would need to go to the database and find it there.

To figure out student UIDs, the professor can simply scan each students' card, and the Arduino IDE Serial Monitor would display the scanned cards' UID.

When the website creates courses, modifies the courses (including deleting), creates students, or modifies students (including deleting), it's all saved / updated on the database.

When the student knows their UID, they can login to the website to see all their courses they've been added to by the professor.

---

## 📊 Attendance Logic

Now, the website calculates each students today's status based on their arrival and leave time, and based on if the class ended. The professor can also override students' current attendance.

The professor and student can see their attendance history for past attendances as well.

If the attendance has not been finalized for the day, the student and professor sees changes live.

When the professor is done for the day, they can click on the **finalize attendance** button. What this does is it saves each student's current attendance information to the database, which would be saved to the student's attendance history.

Now, regardless of what the professor updates on each student, the students would only see their finalized attendance data. The professor can still see local changes if they want to see what would happen if they modify the course (but not save it to the database) or what if they override a students' attendance.

The professor can re-finalize student attendances.

Lastly, once the professor is done for the day, and they are sure the attendance has been finalized and they clicked on the finalize attendance button, the professor can click on **clear today's attendance**. What this would do is reset every student's attendance for today (not the finalized one). That way, for next class, every student's attendance is already reset, ready for new arrival / leave scans and new statuses.

---

## 🧰 What We Used

**Arduino IDE**  
Used to upload the Arduino code inside the Smart_Classroom_Attendance folder to the ESP32-S.

**Firebase / Firestore**  
Database to store student attendance information, courses created (alongside course information), student UIDs, students added in each course, and professor IDs for different professors to store different courses they created.

**Render**  
Contains the esp32-bridge folder, which contains server code. This code is hosted on Render for the ESP32 to send requests to, which then the server communicates with the database and the ESP32.

**Vite + React**  
Website framework to create the website. The website retrieves data from the database to show changes in live time.

**Netlify**  
Hosts the website so anyone can actually visit it on their devices without neededing to set it up locally.

---

## ▶️ How to Run Program Locally

Clone this repository and install Node.js to use npm. Then, run:

```bash
npm create vite@latest
```


Select **React + JavaScript SWC**. Choose default options for remaining options.

Then, run:

```bash
npm run dev
```


to see the website in localhost.

---

## 🚀 How to Host Program

First run the program locally by installing Node.js (to install npm), running:

```bash
npm create vite@latest
```

and selecting **React + JavaScript SWC**, and default options for remaining options.

Then, run:

```bash
npm run build
```

and upload the **dist** folder to an online hosting service (such as Netlify).

