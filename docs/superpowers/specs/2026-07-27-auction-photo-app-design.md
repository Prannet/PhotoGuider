# Auction Photo App — Design

**Date:** 2026-07-27
**Status:** Approved for planning

## Summary

A guided photo-capture web app for auction lot documentation. Coworkers open it on their phone, choose a session type (Vehicle or Other Item), enter a Unit or Lot identifier, and are walked through a checklist of required photo angles plus optional damage/additional shots. Finished sessions are zipped on the phone and sent to SharePoint and/or email, entirely from the phone — no VPN or backend server required.

## Goals

- Standardize and speed up auction photo capture across a small internal team.
- Guarantee consistent file naming and required-angle coverage per session.
- Work reliably regardless of network conditions at the time of capture (office VPN, cellular, wifi).
- Avoid building/maintaining a backend server or native app distribution pipeline.

## Non-Goals

- Multi-session concurrency on one device (one active session at a time is sufficient).
- Support for very old/uncommon mobile browsers lacking modern Web APIs.
- A fully automated, no-tap email send (the one-tap share-sheet confirmation is an accepted tradeoff for avoiding a backend).

## Architecture

A single Progressive Web App (PWA) — installable to the home screen, no app-store distribution. No custom backend server.

```
┌─────────────────────────────┐
│         Phone Browser        │
│  ┌─────────────────────────┐ │
│  │   PWA (HTML/JS/CSS)      │ │
│  │  - Capture UI            │ │
│  │  - IndexedDB (offline    │ │
│  │    photo storage)        │ │
│  │  - Zip builder (JSZip)   │ │
│  └───────────┬──────────────┘ │
└──────────────┼────────────────┘
               │ (only needed at send-time)
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
Microsoft Graph API   Native Share Sheet
(direct upload to      (hand off zip to
 SharePoint, user's     Mail app / any
 M365 login)            app the phone offers)
```

- **Hosting**: static files on a simple, cheap static host (e.g., Azure Static Web Apps free tier). No server to patch or scale.
- **No VPN dependency**: the PWA and SharePoint Online are both public-internet endpoints. The phone only needs *some* internet connection (cellular or wifi) at send-time — never the office VPN.
- **IT prerequisite**: an Azure AD (Microsoft Entra) admin must register this app once (see "SharePoint Upload & Auth" below).

### Approaches considered

| Approach | Verdict |
|---|---|
| **A. Static PWA, no backend (chosen)** | Matches small team / no existing infra / VPN-independent requirements; simplest to build and maintain. |
| B. PWA + small backend service (service-account SharePoint upload, automated email via SendGrid) | More "hands-off" sending, but adds a server to host/secure/maintain and credentials to manage — disproportionate for a small team at low volume. |
| C. Native app (React Native/Flutter) | Better raw camera/background-upload control, but requires app-store/TestFlight/Play distribution, developer accounts, and per-update redistribution — too much overhead for this scale. |

## Session Flow & Screens

1. **Start screen** — "New Session": choose **Vehicle** or **Other Item**.
2. **Identifier entry** — a type toggle, asked fresh every session (no remembered default):
   - **Unit #** → numeric keypad input (e.g., `11802`)
   - **Lot #** → standard text keyboard input, alphanumeric (e.g., `LOT-A22`)
3. **Checklist Hub** — categories depend on session type:
   - **Vehicle**: Front, Left Side, Right Side, Back, Tire, Interior, Speedometer, Damages *(optional)*, Additional *(optional)*
   - **Other Item**: Front, Left Side, Right Side, Back, Detail/Close-up, Damages *(optional)*, Additional *(optional)*
   - Tapping a category opens the camera; multiple photos per category are allowed. Returns to the hub with an updated checkmark/count after each shot.
   - "Finish Session" enables once every *required* (non-optional) category has at least one photo.
4. **Review & Send screen**:
   - Summary: identifier, session type, photo count per category.
   - Two independent actions: **Send to SharePoint** and **Send via Email** (either or both).
   - Per-action status: "Uploading…", "Sent ✓", or "Failed — Retry".

## Data Model & File Naming

**Per-photo filename:** `{Identifier}_{category}_{shotNumber}.jpg`

- `{Identifier}`: exactly what was entered (Unit or Lot value), with spaces stripped — e.g. `11802`, `LOTA22`.
- `{category}`: camelCase — `front`, `leftSide`, `rightSide`, `back`, `tire`, `interior`, `speedometer`, `damages`, `additional` (Other Item sessions use `detail` in place of `tire`/`interior`/`speedometer`).
- `{shotNumber}`: 1, 2, 3… **per category**, resetting for each new category (not global across the session).

Examples: `11802_leftSide_1.jpg`, `11802_leftSide_2.jpg`, `11802_damages_1.jpg`

**Session zip filename:** `{Identifier}_{sessionType}_{date}.zip` — e.g. `11802_vehicle_2026-07-27.zip`. The date guards against the same identifier being reused across different days/events.

**Damages/Additional notes:** each photo taken under these two categories may have an optional short text note (e.g., "scratch on rear bumper"). Notes, plus identifier/session-type/timestamp, are captured in a `metadata.json` file included in the zip.

## Offline Storage & Session Lifecycle

- Every photo is written immediately to IndexedDB — capture never waits on a network connection.
- One active session per phone at a time; a session survives backgrounding, signal loss, or accidental tab close, and resumes where it left off.
- Zipping (JSZip) happens locally on the phone and needs no connection.
- Connectivity is only required at "Send." A failed SharePoint upload or email hand-off leaves the zip queued locally in a "Failed — Retry" state — no photo session is ever lost to a bad connection.
- On successful send, the session clears from local storage. A completed-but-unsent zip is never auto-deleted.

## SharePoint Upload & Auth

- Coworkers sign in once per device with their Microsoft 365 work account (MSAL.js popup login); the app remembers this across sessions.
- The app calls Microsoft Graph API directly from the browser to upload the finished zip into a designated SharePoint document library/folder.
- **One-time IT setup required:**
  - Register this app in Azure AD / Microsoft Entra as an **App registration**, platform type **Single-page application (SPA)**.
  - Grant the Graph API permission `Sites.ReadWrite.All` (delegated), or a more narrowly scoped permission limited to the specific SharePoint site if preferred.
  - Grant admin consent org-wide (so individual coworkers aren't each prompted to approve permissions).
  - Provide the destination SharePoint site/library URL to bake into app config.

## Email/Share Option

- Uses the Web Share API (`navigator.share` with files) — the same mechanism as the phone's native "Share" button.
- "Send via Email" opens the native share sheet with the zip pre-attached; the coworker picks their Mail app, confirms the recipient, and sends.
- No email server, SMTP/API credentials, or size-limit relay to manage.
- **Caveat**: relies on `navigator.share` file support — solid on modern Android Chrome and iOS Safari 15+, but should be verified on real company devices early in implementation.

## Error Handling & Edge Cases

- **Lost connection mid-send**: zip persists locally; "Failed — Retry" state; no data loss.
- **Camera permission denied**: clear in-app message on how to enable it in phone settings.
- **Duplicate identifier same day**: warns rather than silently overwriting ("A session for 11802 already exists today — continue anyway?"), since the date-stamped zip name would otherwise collide. This check is **per-device only** (there's no shared backend to check across coworkers' phones) — if two coworkers photograph the same identifier on two different phones the same day, neither will be warned about the other.
- **Abandoned/incomplete session**: sits as in-progress in local storage; reopening the app resumes it. Never auto-submitted.
- **Storage full on phone**: explicit warning surfaced rather than silently dropping a photo (unlikely at this scale/volume).
- **Login expired/failed**: falls back to re-login prompt; the finished zip stays queued locally regardless.

## Testing Approach

- **Automated unit tests** for pure logic: filename generation, per-category shot numbering, zip contents/structure, `metadata.json` contents, session state transitions (started → in-progress → complete → sent).
- **Not covered by automated tests**: actual camera capture, native share sheet, real Microsoft/SharePoint upload — these depend on real browser/OS behavior impractical to simulate reliably.
- **Manual real-device checklist** (run before each release, and specifically before first rollout): capture/retake in each category; offline capture with airplane mode toggled mid-session; SharePoint send and email send on both an iPhone and an Android phone; full login flow with a real work account.
- This lighter-weight approach (solid unit coverage + manual device checklist) matches the effort warranted by the project's scale (small team, few sessions/day); a full automated E2E suite against real hardware would be disproportionate.

## Open Prerequisites Before Implementation

- [ ] Confirm with IT: Azure AD app registration (SPA platform, `Sites.ReadWrite.All` delegated or site-scoped equivalent, org-wide admin consent).
- [ ] Confirm destination SharePoint site/library URL.
- [ ] Confirm `navigator.share` file-sharing support on the actual company phone models in use.
