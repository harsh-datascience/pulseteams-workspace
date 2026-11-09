# PulseTeams — Clean-Room Real-Time Collaboration Workspace

A production-grade, clean-room collaboration workspace built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, **Socket.io**, **MongoDB (Mongoose)**, and **WebRTC / LiveKit SDK**.

## Architecture & Features

- **3-Pane Workspace Shell**:
  - `68px` Far-Left App Navigation Rail (`Activity`, `Chat`, `Teams`, `Calendar`) with `Ctrl+1`–`Ctrl+4` shortcuts.
  - `240px–400px` Resizable & Collapsible Secondary List Pane.
  - `MainStageContainer` with `Posts`, `Files`, and `Mongoose & Socket Spec` tabs.
  - Global `Ctrl+E` (`Cmd+E`) Command Palette supporting `/available`, `/busy`, `/dnd`, and `/meet` slash commands.
  - Full Dark Mode (`#141414` / `#1F1F1F` / `#292929`) and Light Mode surface token system.
- **Teams, Channels & Threaded Conversations**:
  - Expandable Teams -> Channels accordion tree (`public` `#` and `private` lock channels).
  - Root thread post cards with automatic inline display for 1–2 replies, summary toggle bar for 3+ replies, inline reply composer (`parentMessageId`), and rich Markdown root post composer.
- **Real-Time 1:1 & Group Chat Engine (`Socket.io` + `Mongoose`)**:
  - Instant message delivery, optimistic `tempId -> _id` acknowledgments, idempotent emoji reaction maps (`Map<string, string[]>`), real-time presence broadcasting, and throttled `"User is typing..."` indicators.
- **WebRTC / LiveKit "Meet Now" Call Stage**:
  - Multi-participant video grid with local camera (`getUserMedia`), microphone mute, screen sharing (`getDisplayMedia`), active speaker highlight ring, and an in-call chat drawer.

---

## Quick Start (Local Development)

```bash
# 1. Copy environment variables
cp .env.example .env.local

# 2. Install dependencies
npm install

# 3. Start the unified Next.js 14 + Socket.io server
npm run dev
```

Open `http://localhost:3000` in your browser. (If MongoDB is not running locally, `server.ts` automatically falls back to the in-memory state store so the app works out of the box.)

---

## Run with Docker Compose (Next.js + MongoDB 7 + LiveKit SFU)

```bash
docker compose up --build -d
```

---

## Push to GitHub

This bundle is already initialized as a Git repository with all files committed on the `main` branch. To push to your GitHub account:

```bash
# Option A: Using GitHub CLI (creates repo and pushes in one command)
gh repo create pulseteams-workspace --public --source=. --remote=origin --push

# Option B: Using a standard GitHub remote URL
git remote add origin https://github.com/<your-username>/pulseteams-workspace.git
git branch -M main
git push -u origin main
```
