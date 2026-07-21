# Implementation Plan — Pomodoro Focus-Lock & Home Screen Exam Nav Update

We have thoroughly investigated the codebase to design a robust, clean solution that integrates seamlessly into the existing LiveKit room infrastructure, Pomodoro DataChannel events, and owner `mute-all` mechanisms.

---

## User Review Required & Open Questions

> [!NOTE]
> **Existing Owner Mute-All Hook**: Our investigation confirmed that owner `mute-all` is currently implemented via `micDisabled` on `roomData`. When `micDisabled` turns `true`, `MediaControls.tsx` automatically invokes the local participant's mic toggle (`micProps.onClick`) if `micEnabled` is currently true, turning off the mic track and disabling the UI button. We will hook into this exact mechanism when `focusLockEnabled` engages during a focus session, without creating redundant audio disabling logic.

> [!TIP]
> **Automatic Unmute on Break/Reset**: When focus lock disengages (break start (`phase === 'BREAK'`), mid-session toggle OFF by owner, or `RESET` event), we will automatically call `micProps.onClick` to unmute participants (provided their mic is not permanently disabled by host `micDisabled`).

No breaking changes or external dependencies are required. All UI additions will adhere strictly to the minimalist dark workspace theme (`bg-surface-raised`, `border-border-default`, `text-text-secondary`).

---

## Proposed Changes

### Component 1: Room Metadata & Backend Parity
#### [MODIFY] [index.ts](file:///c:/Users/srmkh/Desktop/crackit/src/types/index.ts)
- Add `focusLockEnabled?: boolean;` to the `Room` interface.
- Remove `'JEE'` from the `ExamTag` union type (`'JEE Main/Advanced'` remains the single canonical tag).

#### [MODIFY] [route.ts (create)](file:///c:/Users/srmkh/Desktop/crackit/src/app/api/rooms/create/route.ts)
#### [MODIFY] [route.ts (update)](file:///c:/Users/srmkh/Desktop/crackit/src/app/api/rooms/update/route.ts)
#### [MODIFY] [route.ts (list/get)](file:///c:/Users/srmkh/Desktop/crackit/src/app/api/rooms/route.ts)
- Ensure `focusLockEnabled` is persisted in Supabase (`focus_lock_enabled` column if present) and LiveKit room metadata (`metadata` JSON string), defaulting to `true` (`roomDetails.focusLockEnabled ?? true`).

---

### Component 2: Room Creation & Settings Toggles
#### [MODIFY] [CreateRoomModal.tsx](file:///c:/Users/srmkh/Desktop/crackit/src/components/landing/CreateRoomModal.tsx)
- Add state `focusLockEnabled` (`useState(true)`).
- Render a minimalist toggle row below `Welcome Message`: `"Lock mic & chat during focus sessions"`, default `ON`.
- Pass `focusLockEnabled` inside the POST payload to `/api/rooms/create`.

#### [MODIFY] [RoomSettingsApp.tsx](file:///c:/Users/srmkh/Desktop/crackit/src/components/room/RoomSettingsApp.tsx)
- Add state `focusLockEnabled` initialized from `roomData.focusLockEnabled ?? true`.
- Render `"Lock mic & chat during focus sessions"` toggle inside Room Settings sidebar.
- On toggle or save (`handleSave`), broadcast `SETTINGS_UPDATED` via `'room-settings'` DataChannel and persist to `/api/rooms/update` so mid-session changes apply immediately across all clients.

---

### Component 3: Pomodoro Timer & Focus-Lock Core Logic
#### [MODIFY] [PomodoroTimer.tsx](file:///c:/Users/srmkh/Desktop/crackit/src/components/room/PomodoroTimer.tsx)
- Accept `focusLockEnabled?: boolean` and `onPomodoroStateChange?: (state: { isRunning: boolean; phase: 'FOCUS' | 'BREAK'; lastEventType?: string }) => void`.
- When `isRunning`, `phase`, or `externalEvent` changes, notify parent (`page.tsx`) of current timer phase and events (`START`, `PAUSE`, `RESET`, `SYNC`).
- Render inline minimalist text below the timer display: `"Mic and chat are disabled during focus"` (only shown when `focusLockEnabled !== false`).

#### [MODIFY] [page.tsx (room)](file:///c:/Users/srmkh/Desktop/crackit/src/app/room/[id]/page.tsx)
- Maintain `pomodoroState` (`isRunning`, `phase`, `lastEventType`) reported by `PomodoroTimer`.
- Compute `isFocusLocked = pomodoroState.isRunning && pomodoroState.phase === 'FOCUS' && (roomData.focusLockEnabled !== false)`.
- **System Bubbles (Chat Flash Messages)**:
  - Track transitions of `isFocusLocked`:
    - When `isFocusLocked` becomes `true` (on engage): append `systemBubbles` entry `🔇 Mic & chat are locked during focus sessions.`
    - When `isFocusLocked` becomes `false` (break start or mid-session toggle OFF) or when `lastEventType === 'RESET'` (owner safety unlock): append `systemBubbles` entry `🔓 Mic & chat unlocked.`
- Pass `isFocusLocked` and `focusLockEnabled` down to `<MediaControls>` and `<ChatSidebar>`.

---

### Component 4: Controls & Chat Sidebar Integration
#### [MODIFY] [MediaControls.tsx](file:///c:/Users/srmkh/Desktop/crackit/src/components/room/MediaControls.tsx)
- Accept `isFocusLocked?: boolean` along with existing `micDisabled`.
- **Engage (Lock)**: When `isFocusLocked && !isOwner` becomes `true`, invoke existing auto-mute logic (`micProps.onClick`) if mic is on, and disable the mic toggle button (`disabled={micDisabled || (isFocusLocked && !isOwner)}`).
- **Disengage (Unlock / Break / Reset)**: When `isFocusLocked` transitions from `true` to `false` (or on safety reset), if the participant was muted and host `micDisabled` is `false`, automatically trigger `micProps.onClick` to unmute.

#### [MODIFY] [ChatSidebar.tsx](file:///c:/Users/srmkh/Desktop/crackit/src/components/room/ChatSidebar.tsx)
- Accept `isFocusLocked?: boolean`, `focusLockEnabled?: boolean`, and `systemBubbles?: Array<{ id: string; text: string; timestamp: number }>`.
- **New Joiner Welcome Message Bubble**: If `welcomeMessageText` is present and `focusLockEnabled !== false`, append `"\n\n• Mic & chat will be locked during focus sessions."` to the top system rules bubble.
- **Dynamic System Bubbles**: Render `systemBubbles` inside the chat feed reusing the existing welcome-message system-bubble card style (`border border-accent-green/30 bg-accent-green/5...`).
- **Chat Input Lock**: When `isFocusLocked` is `true`, disable the input field and submit button (`disabled={chatDisabled || isFocusLocked}`) and update placeholder to `"Chat is disabled during focus"`.

---

### Component 5: Home Screen Exam Navigation (Prompt 5)
#### [MODIFY] [mockData.ts](file:///c:/Users/srmkh/Desktop/crackit/src/lib/mockData.ts)
- Update mock room `'r1'` (`examTag: 'JEE'`) to use canonical `'JEE Main/Advanced'`.

#### [MODIFY] [page.tsx (landing)](file:///c:/Users/srmkh/Desktop/crackit/src/app/page.tsx)
- In `activeTabs` computation and exam filter bar logic, filter out any legacy standalone `'JEE'` tag so only `'JEE Main/Advanced'` appears on the home screen navigation bar.

---

## Verification Plan

### Automated Tests
- Run `npm run build` (`next build`) to verify zero TypeScript errors across all modified types, API routes, and components.

### Manual Verification
1. **Prompt 5 (Remove JEE Tag)**:
   - Load home screen (`/`). Verify that standalone `"JEE"` is gone from the exam tab navigation bar and `"JEE Main/Advanced"` remains.
2. **Prompt 4 (Pomodoro Focus-Lock)**:
   - **Creation & Defaults**: Open `Create Study Room`. Verify `"Lock mic & chat during focus sessions"` toggle exists and defaults `ON`. Create room.
   - **UI Hint & Welcome Bubble**: Verify `"Mic and chat are disabled during focus"` appears under the Pomodoro timer. Verify top chat welcome bubble includes `"• Mic & chat will be locked during focus sessions."`.
   - **Focus Engage (Lock)**: Join with a second participant (`user2`). Start Pomodoro timer (`25/5` Focus phase) as owner. Verify `user2`'s mic auto-mutes, `user2`'s mic button is disabled, chat input is greyed out (`"Chat is disabled during focus"`), and chat displays bubble `🔇 Mic & chat are locked during focus sessions.`.
   - **Mid-Session Toggle**: In owner's Room Settings, toggle `Lock mic & chat` to `OFF`. Verify `user2` immediately uninhibits, receives bubble `🔓 Mic & chat unlocked.`, and can unmute/chat. Toggle back `ON`.
   - **Break Transition**: Let timer transition or reset to Break phase. Verify automatic unmute and chat unlock bubble.
   - **Safety Reset**: While in Focus (`isFocusLocked = true`), click `Reset` as owner. Verify `user2` unlocks immediately (`🔓 Mic & chat unlocked.`).
