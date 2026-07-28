# Auction Photo App — Follow-Up Fixes: Discard Session & Complete Status

**Date:** 2026-07-28
**Status:** Approved
**Relates to:** `docs/superpowers/specs/2026-07-27-auction-photo-app-design.md`, `docs/superpowers/plans/2026-07-27-auction-photo-app.md`

## Background

A final whole-system review of the completed 19-task auction photo app implementation surfaced two gaps:

1. There is no way to discard or restart a session once started — a coworker who mis-taps Vehicle vs. Other Item, or fat-fingers the identifier, has no in-app recovery path short of actually sending the (wrong) session.
2. `Session.status: 'complete'` is defined in `src/types.ts` but never assigned by any real code path. `checklistHub.ts`'s Finish action never transitions status, and `sessionStore.ts`'s `getActiveSession()` only ever matches `'in-progress'`. The original design spec describes a `started → in-progress → complete → sent` lifecycle that isn't actually wired up.

This spec covers both as a small, self-contained follow-up.

## 1. Discard / Start Over

**Where:** Checklist Hub only (`src/screens/checklistHub.ts`). An in-progress session is only ever shown to the user on this screen — the Identifier screen only appears before a session exists, and a `'complete'` session (see part 2) resumes straight to Review & Send, bypassing the Hub.

**Interaction:** A "Start Over" action is added to the hub, always available regardless of Finish Session's gating state. Tapping it swaps the hub's rendered content into a confirm step:

> "Discard session? All photos will be lost."
> [Cancel] [Discard]

This matches the codebase's existing in-DOM confirm pattern (no native `confirm()`/`alert()` is used anywhere else in the app). Cancel returns to the normal hub view (category rows + Finish button). Discard calls `clearSession(session.id)` (already implemented in `src/session/sessionStore.ts`) and then invokes a new `onDiscard()` callback.

**Interface change:** `renderChecklistHub` gains a 5th parameter:

```ts
export function renderChecklistHub(
  container: HTMLElement,
  session: Session,
  onOpenCategory: (categoryKey: string) => void,
  onFinish: (session: Session) => void, // see part 2 for this signature change
  onDiscard: () => void
): void
```

`src/app.ts` wires `onDiscard` to `navigate({ screen: 'start' })`.

**Out of scope:** No blob-URL cleanup is needed for this change — `checklistHub.ts` never creates object URLs (only `captureScreen.ts` does, and those are already scoped/cleaned up per its own render lifecycle, per the existing implementation).

**Known consequence (accepted):** Since a `'complete'` session (post-Finish) resumes directly to Review & Send and Discard lives only on the Hub, there is no way to discard a session after Finish has been tapped — only before. Given Finish is already gated behind all required categories having photos, this is accepted as a reasonable edge case rather than something this follow-up needs to solve.

## 2. Wiring Up `Session.status: 'complete'`

**On Finish:** In `checklistHub.ts`, the Finish button's click handler currently just calls `onFinish()` with no arguments when `canFinish` is true. It will instead:
1. Build an updated session: `{ ...session, status: 'complete' }`.
2. Persist it via `saveSession` (from `src/session/sessionStore.ts`, already used the same way in `captureScreen.ts`).
3. Call `onFinish(updatedSession)`.

**Signature change:** `onFinish: () => void` → `onFinish: (session: Session) => void`.

**In `app.ts`:** The `hub` case's `onFinish` wiring changes from:
```ts
() => navigate({ screen: 'review', session: state.session })
```
to:
```ts
(updatedSession) => navigate({ screen: 'review', session: updatedSession })
```
so the persisted `'complete'` status flows into the Review & Send screen's session object (used only for display/zip contents there — `reviewSendScreen.ts` doesn't itself branch on `status`).

**Resume behavior:** `sessionStore.ts`'s `getActiveSession()` currently:
```ts
return all.find((s) => s.status === 'in-progress');
```
changes to:
```ts
return all.find((s) => s.status === 'in-progress' || s.status === 'complete');
```

**`app.ts`'s `resolveInitialState`** gains a third branch:
```ts
export function resolveInitialState(existing: Session | undefined): AppState {
  if (!existing) return { screen: 'start' };
  if (existing.status === 'complete') return { screen: 'review', session: existing };
  return { screen: 'hub', session: existing };
}
```

**Clearing:** Unchanged — `reviewSendScreen.ts` already calls `clearSession(session.id)` once every attempted send action succeeds, regardless of the session's `status` field. A `'complete'` session that's fully sent is cleared exactly as an `'in-progress'` one would be today.

## Testing

- `tests/screens/checklistHub.test.ts`: add cases for the discard flow (initial state has no confirm UI; clicking Start Over shows the confirm step; Cancel returns to normal view without calling `clearSession`; confirming Discard calls `clearSession(session.id)` and `onDiscard`). Existing `onFinish` tests updated for the new call signature (`onFinish` now called with the updated, `status: 'complete'` session) and to assert `saveSession` is called.
- `tests/sessionStore.test.ts`: add a case asserting `getActiveSession()` returns a session with `status: 'complete'`.
- `tests/app.test.ts`: add a case asserting `resolveInitialState` routes a `'complete'` session to `{ screen: 'review', session }`.
- Full existing suite must continue to pass (76 tests prior to this follow-up).

## Non-Goals

- No changes to `reviewSendScreen.ts`'s own logic — it doesn't need to branch on `status`.
- No generic "screen lifecycle" abstraction — this follows the existing per-screen callback-wiring pattern already used throughout the app.
- No Discard action added to the Review & Send screen (see accepted consequence above).
