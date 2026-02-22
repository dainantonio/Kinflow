Sources: landing page content + feature flow + learning paths :contentReference[oaicite:3]{index=3}

---


# Kinflow (Kins) — The AI-Powered Family Command Center

Kins is a high-performance, mobile-first command center designed to eliminate the **mental load** of modern parenting.

Unlike standard checklist apps, Kins acts as a central operating system for the home—combining role-based task management, calendar coordination, and AI-driven meal planning into a single premium experience.

---

## Key Features
- **Role-based dashboards** for Parents, Teens, and Kids
- **AI Daily Planner** (Gemini) to generate age-appropriate chores and learning tasks
- **AI Kitchen** for meal planning + interactive shopping lists
- **Smart Rewards System** (points ledger → real-life rewards like screen time)
- **Notifications** via browser Notification API
- **Calendar connection simulation** (Google/Outlook OAuth-style flows)
- **Tiered plans simulation** (PLUS / PRO mock checkout)

---

## Tech Stack (Current Direction)
- React (SPA)
- Tailwind CSS (glassmorphic UI)
- State engine: `useReducer` patterns
- Firebase/Firestore (planned/option for realtime sync)
- Gemini hooks (planned/option for AI)

---

## Getting Started
```bash
npm install
npm run dev
