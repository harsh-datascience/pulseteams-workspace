# 01 — Architecture & UI Specification: Clean-Room Collaboration Workspace

**Document Status**: Phase 1 Specification (Pending Review before Next.js 14 Scaffolding)  
**Target Stack**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Node.js + Socket.io, MongoDB (Mongoose), WebRTC / LiveKit SDK  
**Inspection Context**: Clean-room reference architecture and Fluent v9 / modern workspace layout standards (Note: `rea` MCP server and `localhost:9222` target were not attached to this sandbox session; specification is grounded in standard 3-pane workspace geometry, design tokens, and state machine contracts required by the prompt).

---

## 1. Layout & Grid Geometry

The application uses a strict **full-viewport (`100vw x 100vh`) 3-pane CSS Flex/Grid shell** with `overflow: hidden` at the root level and independent scroll containers inside the secondary list pane and main stage.

### 1.1 Root Viewport Structure

| Region | Component Name | Dimensions | Flex / Grid Behavior | Overflow & Z-Index |
| :--- | :--- | :--- | :--- | :--- |
| **Top Global Bar** | `GlobalHeaderBar` | Height: `48px`, Width: `100%` | `flex items-center justify-between px-4 shrink-0` | `z-30`, fixed at top of shell |
| **Pane 1: Far-Left App Rail** | `AppNavigationRail` | Width: `68px`, Height: `calc(100vh - 48px)` | `w-[68px] shrink-0 flex flex-col items-center justify-between py-2` | `overflow-y-auto overflow-x-hidden z-20` |
| **Pane 2: Secondary List Pane** | `SecondaryListPane` | Width: `280px` – `320px` (default `290px`, min `240px`, max `400px`) | Resizable via drag handle (`4px` hit target) or collapsible (`0px` when collapsed) | `overflow-y-auto shrink-0 z-10` |
| **Pane 3: Main Stage** | `MainStageContainer` | Width: `flex-1` (`min-w-0`), Height: `calc(100vh - 48px)` | `flex-1 flex flex-col min-w-0 h-full` | `overflow-hidden` outer; inner feed `overflow-y-auto` |
| **Pane 4: Contextual Drawer** | `RightSideDrawer` | Width: `320px` – `360px` (closed by default) | Conditional slide-over / docked right panel for Thread details, Info, or In-Call Chat | `shrink-0 border-l z-20` |

### 1.2 Main Stage Internal Geometry

| Sub-Region | Height / Spacing | Layout & Alignment |
| :--- | :--- | :--- |
| **Main Stage Header** | `60px` fixed height (`shrink-0`) | Left: Channel/Chat Avatar (`32px`), Title, & Tabs (`Posts`, `Files`). Right: Member avatars, `Meet Now` CTA button, Info toggle |
| **Message Feed Viewport** | `flex-1 min-h-0` | Vertical flex column (`px-6 py-4 space-y-4 overflow-y-auto`), centered max content width `960px` (`mx-auto w-full`) |
| **Bottom Composer Area** | Auto-height (`min-h-[84px]`, `max-h-[260px]`) | Padded bottom container (`px-6 pb-5 pt-2 shrink-0`), max width `960px` (`mx-auto w-full`) |

### 1.3 Responsive Breakpoints

| Breakpoint | Viewport Range | Layout Adaptation |
| :--- | :--- | :--- |
| **Desktop Wide (`xl` / `2xl`)** | `>= 1280px` | Full 3-pane layout (`68px` Rail + `290px` Secondary Pane + `flex-1` Main Stage + optional `340px` Right Drawer) |
| **Desktop / Laptop (`lg`)** | `1024px – 1279px` | Secondary Pane fixed at `260px`; Right Drawer overlays Main Stage when opened |
| **Tablet (`md`)** | `768px – 1023px` | Secondary Pane collapses into a toggleable slide-over drawer (`280px`); `68px` Rail remains persistent |
| **Mobile (`< 768px`)** | `< 768px` | App Rail moves to bottom navigation bar (`height: 56px`); Secondary Pane and Main Stage act as stacked full-screen views |

---

## 2. Design System Tokens

All tokens map cleanly to CSS custom properties (`--surface-*`, `--brand-*`) in `app/globals.css` and Tailwind utility aliases in `tailwind.config.ts`.

### 2.1 Color Palette (Dark & Light Mode Surfaces)

| Token Semantic Role | CSS Variable | Light Mode Hex | Dark Mode Hex | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **App Bar / Rail Surface** | `--bg-app-rail` | `#EBEBEB` | `#141414` | Far-left `68px` rail & top `48px` global bar |
| **Secondary Sidebar Surface** | `--bg-secondary-pane` | `#F5F5F5` | `#1F1F1F` | Teams tree / Chat list background |
| **Main Stage Canvas** | `--bg-main-stage` | `#FFFFFF` | `#292929` | Primary conversation and tab viewport |
| **Elevated Card / Message** | `--bg-card-surface` | `#FFFFFF` | `#333333` | Root thread post cards, hover toolbars, modals |
| **Subtle Hover Surface** | `--bg-surface-hover` | `#EAEAEA` | `#383838` | Channel row hover, rail button hover |
| **Active Selection Surface** | `--bg-surface-selected` | `#E0E2F8` | `#33344A` | Active channel or chat row background |
| **Primary Brand Accent** | `--accent-primary` | `#5B5FC7` | `#7B83EB` | Active rail indicator, primary buttons, links |
| **Brand Accent Hover** | `--accent-primary-hover` | `#4F52B2` | `#8B93F7` | Primary CTA hover state |
| **Primary Text** | `--text-primary` | `#242424` | `#FFFFFF` | Message body, headings, active labels |
| **Secondary Text** | `--text-secondary` | `#616161` | `#ADADAD` | Timestamps, channel names, secondary metadata |
| **Muted / Disabled Text** | `--text-muted` | `#8A8A8A` | `#707070` | Placeholders, disabled controls |
| **Structural Hairline Border** | `--border-subtle` | `#E0E0E0` | `#3D3D3D` | Pane dividers, header borders, card outlines |

### 2.2 Status & Semantic Tokens

| Status State | Badge Color | Hex Value | Icon / Indicator Shape |
| :--- | :--- | :--- | :--- |
| **Available (Online)** | Emerald Green | `#13A10E` (Light) / `#6BB700` (Dark) | Solid circle with white checkmark |
| **Busy / In a Call** | Crimson Red | `#C50F1F` (Light) / `#D13438` (Dark) | Solid red circle |
| **Do Not Disturb (DND)** | Crimson Red | `#C50F1F` | Red circle with horizontal white minus bar |
| **Away / Idle** | Amber Gold | `#EAA300` | Solid amber circle with clock hand |
| **Offline** | Neutral Slate | `#8A8A8A` | Hollow ring (`1.5px` stroke) |

### 2.3 Typography Scale, Radii & Elevation

| Element | Font Size / Line Height | Font Weight | Letter Spacing |
| :--- | :--- | :--- | :--- |
| **Stage Title (`h1`)** | `18px / 24px` (`text-lg`) | `600` (SemiBold) | `-0.01em` |
| **Section / Team Header** | `14px / 20px` (`text-sm`) | `600` (SemiBold) | `0` |
| **Message Body / List Item** | `14px / 20px` (`text-sm`) | `400` (Regular) | `0` |
| **Unread Channel Item** | `14px / 20px` (`text-sm`) | `600` (SemiBold) | `0` |
| **Metadata / Timestamp / Rail Label** | `11px / 14px` or `12px / 16px` (`text-xs`) | `400` – `500` | `0.01em` |

* **Border Radii**:
  * Avatar circles & presence dots: `9999px` (`rounded-full`)
  * Team squircle icons & buttons: `6px` (`rounded-md`)
  * Message cards, composers & modals: `8px` (`rounded-lg`)
  * Floating emoji reaction bar: `9999px` pill (`rounded-full`)
* **Shadow Elevations**:
  * **Level 1 (Thread Card)**: `0 1px 2px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)`
  * **Level 2 (Floating Reaction Bar / Dropdown)**: `0 4px 12px rgba(0, 0, 0, 0.14), 0 0 2px rgba(0, 0, 0, 0.1)`
  * **Level 3 (Command Palette / Call Modal)**: `0 16px 36px rgba(0, 0, 0, 0.24), 0 0 4px rgba(0, 0, 0, 0.12)`

---

## 3. Interactive State Rules & Behavioral Contracts

### 3.1 App Bar Navigation State Machine (`activeAppModule`)

Switching the primary navigation module in the `68px` App Rail mutates both the **Secondary List Pane** and **Main Stage** deterministically:

| Active Module | Keyboard Shortcut | URL Route Pattern | Secondary List Pane View | Main Stage View |
| :--- | :--- | :--- | :--- | :--- |
| **Activity** | `Ctrl+1` (`Cmd+1`) | `/activity` | Chronological feed of `@mentions`, thread replies, and reaction notifications with Unread filter toggle | Jumps directly to the target Channel thread or Direct Message conversation highlighted by the selected activity item |
| **Chat** | `Ctrl+2` (`Cmd+2`) | `/chat/[conversationId]` | Filterable list of Pinned & Recent 1:1 and Group DMs with live presence badges, last message snippet, and unread badge | 1:1 or Group Chat stream (continuous chronological message bubbles), header presence status, and `Meet Now` call action |
| **Teams** | `Ctrl+3` (`Cmd+3`) | `/teams/[teamId]/channels/[channelId]` | Collapsible accordion tree of joined Teams (`Workspace`) and their child `Channels` (`public` hash `#` or `private` lock icon) | Channel Header with `Posts` and `Files` tabs, threaded root post cards, inline reply expanders, and "Start a new post" composer |
| **Calendar** | `Ctrl+4` (`Cmd+4`) | `/calendar` | Mini month date picker + upcoming scheduled meetings list | Day / Work-Week / Week time-grid calendar with instant "Meet Now" and "New Meeting" creation modal |
| **Command / Search** | `Ctrl+E` (`Cmd+E`) | Global Modal Overlay | Unchanged (retains background context) | Opens centered top Command Palette (`560px` wide) supporting `/available`, `/busy`, `/dnd`, `@user` quick jump, and message/channel search |

* **Active Rail Indicator**: The active rail button renders a `3px x 24px` vertical pill in `--accent-primary` on its left edge, transitions icon fill from outline to solid/accent, and highlights text label in `--text-primary`.

### 3.2 Channel Threads & Inline Reply Composer State Machine

Unlike 1:1 Chat (which uses a single fixed bottom input), the **Teams -> Channel (`Posts` tab)** view operates as a **collection of independent root thread cards**:

1. **Root Post Card (`parentMessageId: null`)**:
   * Rendered as an elevated card (`rounded-lg border border-[--border-subtle] bg-[--bg-card-surface] p-4 shadow-sm`).
   * Displays author avatar + live presence dot, display name, timestamp, optional subject line (`font-semibold text-base`), Markdown-rendered body, attachment chips, and aggregated reaction pills.
   * Hovering a card reveals a top-right floating action bar (`bg-[--bg-card-surface] shadow-md rounded-full border px-2 py-1`) with quick emojis (`👍`, `❤️`, `🎉`, `🚀`, `👀`) and a Reply trigger.
2. **Thread Reply Collapse / Expansion (`expandedThreads: Record<string, boolean>`)**:
   * **0 Replies**: Card footer shows a compact `Reply` action button (`text-xs text-[--accent-primary] hover:underline`).
   * **1–2 Replies**: Replies render inline directly beneath the root post inside a subtle tinted footer container (`bg-[--bg-secondary-pane]/50 border-t px-4 py-2`).
   * **3+ Replies (Collapsed Default)**: Shows a summary toggle bar (`"X replies from User A, User B — Last reply 4m ago"`) alongside the latest single reply preview. Clicking the summary bar toggles `expandedThreads[rootMessageId] = true` to reveal the full chronological list of replies.
3. **Inline Reply Composer Attachment (`activeReplyThreadId: string | null`)**:
   * Clicking `Reply` on any root post sets `activeReplyThreadId = rootMessage._id`, expanding an inline Markdown/rich-text reply composer directly at the bottom of that specific thread card and auto-focusing its textarea.
   * Submitting a reply emits `message:send` with `parentMessageId: rootMessage._id`, appends the reply optimistically to the thread card, increments `replyCount`, and keeps the inline composer open for follow-up replies until the user presses `Escape` or clicks outside.
4. **New Root Post Composer**:
   * Pinned at the bottom of the Channel stage (`"Start a new post"` button) which expands into a full card composer with an optional **Subject line** input, Markdown formatting toolbar (Bold, Italic, Code, Link, List), attachment uploader, and Send button (`Enter` to send, `Shift+Enter` for newline).

### 3.3 Real-Time Presence & Typing Indicator Lifecycle

1. **Presence State Transitions (`presence:update`)**:
   * On Socket.io connection, the server marks the authenticated user as `available` (or restores their last manual status preference) and broadcasts `presence:changed { userId, status, lastSeen }` to shared workspace/conversation rooms.
   * Users can manually override status via the top-right profile menu or `Ctrl+E` slash commands (`/available`, `/busy`, `/dnd`, `/away`).
   * Starting or joining a WebRTC / LiveKit call automatically transitions the user's effective badge to `busy` ("In a call") and restores their previous status upon `call:leave`.
   * Heartbeat ping (`30s` interval) updates `lastSeen`; disconnect after a `10s` grace window marks the user `offline`.
2. **Typing Indicators (`typing:start` / `typing:stop`)**:
   * Keystrokes in a Channel thread reply composer or 1:1 Chat composer emit `typing:start { channelId | conversationId, parentMessageId?, userId, displayName }` throttled to once per `2000ms`.
   * A client-side and server-side auto-expiry timer (`3500ms` after last keystroke or immediately upon `message:send`) clears the typing state.
   * UI renders an animated 3-dot bounce indicator + `"Alice is typing..."` (or `"Alice and Bob are typing..."`) directly above the active composer without shifting scroll position.

---

## 4. Proposed Project Directory Structure (Phase 2 & 3 Preview)

```text
/
├── docs/
│   └── specs/
│       └── 01-architecture-and-ui-spec.md
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── (workspace)/
│   │   │   ├── activity/
│   │   │   ├── chat/[conversationId]/
│   │   │   ├── teams/[teamId]/channels/[channelId]/
│   │   │   └── calendar/
│   │   ├── api/                  # REST endpoints & LiveKit token generator
│   │   ├── layout.tsx
│   │   └── globals.css           # Design system CSS variables
│   ├── components/
│   │   ├── shell/                # AppNavigationRail, SecondaryListPane, GlobalHeaderBar, CommandPalette
│   │   ├── channel/              # ChannelStage, ThreadCard, InlineReplyComposer, FilesTab
│   │   ├── chat/                 # DirectChatStage, MessageBubble, TypingIndicator
│   │   └── call/                 # MeetNowStage, VideoTileGrid, CallControlsBar, InCallChatDrawer
│   ├── models/                   # Mongoose Schemas (User, Team, Channel, Conversation, Message)
│   ├── types/
│   │   └── socket.ts             # Strictly typed Socket.io ServerToClient & ClientToServer contracts
│   └── lib/
│       ├── db.ts                 # MongoDB connection singleton
│       └── socket-client.ts      # Socket.io client hook & context provider
└── server.ts                     # Custom Node.js + Next.js + Socket.io unified server
```
