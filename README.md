# Ginie's Planner 📋

Ginie’s Planner is a web-based, personal life planner and tracker designed to organize daily tasks and track long-term goals. The digital tool provides a centralized dashboard for enhancing productivity and managing personal growth. Visit Ginie's Planner to learn more.

<p align="center">
  <img src="https://github.com/GnS004/planner-tracker-web-app/blob/main/ss/SS1.png" alt="Ginie's Planner" width="900">
</p>


<p align="center">
  <img src="https://github.com/GnS004/planner-tracker-web-app/blob/main/ss/SS8.png" alt="Ginie's Planner" width="900">
</p>


<p align="center">
  <img src="https://github.com/GnS004/planner-tracker-web-app/blob/main/ss/SS9.png" alt="Ginie's Planner" width="900">
</p>

---

## Features

- ◈ Dashboard — daily overview, mood chart, top goal
- ◉ Habit Tracker — weekly grid with streaks
- ☐ Tasks & Todos — priority tags, filters, due dates
- ◎ Journal & Mood — daily entries with mood check-in
- ⏱ Focus Timer — Pomodoro with session log
- ◈ Goals & Vision — progress tracking by category
- ▦ Life Calendar — events with monthly view
- ◪ Notes — card grid with edit support
- ♡ Health & Fitness — water, sleep, steps, calories
- ₹ Finance Tracker — income/expense with breakdown
- ◫ Reading List — track books by status
- ✦ Gratitude Log — daily 3-item practice

---

## Project Structure

```
ginies-planner/
├── index.html       ← Main HTML (structure & layout)
├── css/
│   └── style.css    ← All styles & variables
├── js/
│   └── app.js       ← Firebase, auth, all logic
└── README.md
```

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (ES Modules)
- **Database:** Firebase Firestore (real-time sync)
- **Auth:** Firebase Google Sign-In
- **Hosting:** GitHub Pages (free)
- **Fonts:** Google Fonts (Playfair Display, DM Sans, JetBrains Mono)

---

## Setup (for your own copy)

1. Fork this repo
2. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
3. Enable **Firestore Database** (test mode)
4. Enable **Authentication → Google** provider
5. Get your Firebase config from Project Settings → Your apps → Web
6. Replace the `firebaseConfig` object in `js/app.js` with your own
7. Add your GitHub Pages domain to Firebase → Authentication → Authorized domains
8. Update Firestore rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /lifeos/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
9. Enable GitHub Pages in repo Settings → Pages → deploy from `main`

---

## Data & Privacy

- All data is stored in Firebase Firestore under your Google UID
- Only you can read/write your own data (Firestore security rules enforced)
- Export your data anytime using the ⬇ Export button (downloads JSON)

---
## 🔗 Connect With Me

Feel free to reach out for any questions or collaboration opportunities!
