# Auction Photo App Follow-Ups: Discard Session & Complete Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Start Over" (discard session) action to the Checklist Hub screen, and wire up the previously-unused `Session.status: 'complete'` value so Finish Session persists it and the app resumes a finished-but-unsent session straight to Review & Send.

**Architecture:** Two small, related changes to the existing static PWA (no new files, no new dependencies). `src/session/sessionStore.ts`'s `getActiveSession()` starts treating `'complete'` sessions as active/resumable (not just `'in-progress'`). `src/screens/checklistHub.ts`'s Finish action persists `status: 'complete'` before handing the updated session to its caller, and gains a confirm-gated "Start Over" action that clears the session. `src/app.ts` routes a `'complete'` session to the Review & Send screen on resume, and wires the new/changed callbacks.

**Tech Stack:** Same as the existing app — Vite + TypeScript, Vitest + jsdom, `idb`, no new dependencies.

See `docs/superpowers/specs/2026-07-28-auction-photo-app-followups-design.md` for the full design rationale.

---

## Task 1: `getActiveSession` Resumes `'complete'` Sessions

**Files:**
- Modify: `src/session/sessionStore.ts:42-46`
- Modify: `tests/sessionStore.test.ts:29-33`

- [ ] **Step 1: Update the existing test to expect the new behavior**

Replace this existing test in `tests/sessionStore.test.ts` (currently lines 29-33):

```ts
  it('does not return a session marked complete', async () => {
    const session = { ...createSession('vehicle', 'unit', '11802'), status: 'complete' as const };
    await saveSession(session);
    expect(await getActiveSession()).toBeUndefined();
  });
```

with:

```ts
  it('returns a session marked complete (finished but not yet sent)', async () => {
    const session = { ...createSession('vehicle', 'unit', '11802'), status: 'complete' as const };
    await saveSession(session);
    const active = await getActiveSession();
    expect(active?.id).toBe(session.id);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/sessionStore.test.ts`
Expected: FAIL — the new test's `expect(active?.id).toBe(session.id)` fails because `getActiveSession()` currently only matches `'in-progress'` and returns `undefined` for a `'complete'` session.

- [ ] **Step 3: Update `getActiveSession` in `src/session/sessionStore.ts`**

Replace (line 45):
```ts
  return all.find((s) => s.status === 'in-progress');
```
with:
```ts
  return all.find((s) => s.status === 'in-progress' || s.status === 'complete');
```

- [ ] **Step 4: Run the full sessionStore test file to verify it passes**

Run: `npx vitest run tests/sessionStore.test.ts`
Expected: PASS (7 tests passed).

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: all 17 test files pass (76 tests, same count as before this task — one test was replaced, not added).

- [ ] **Step 6: Commit**

```bash
git add src/session/sessionStore.ts tests/sessionStore.test.ts
git commit -m "Resume 'complete' sessions as active, not just 'in-progress' ones"
```

---

## Task 2: Finish Session Persists `status: 'complete'`

**Files:**
- Modify: `src/screens/checklistHub.ts`
- Modify: `tests/screens/checklistHub.test.ts`

This task changes `onFinish`'s signature from `() => void` to `(session: Session) => void`, and makes the Finish button handler persist the session as `'complete'` via `saveSession` before calling it. The Discard/"Start Over" feature (a 5th parameter, `onDiscard`) is added separately in Task 3 — do not add it here.

- [ ] **Step 1: Write the failing test**

Replace the entire contents of `tests/screens/checklistHub.test.ts` with:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, addPhoto } from '../../src/session/session';
import { renderChecklistHub } from '../../src/screens/checklistHub';
import { saveSession } from '../../src/session/sessionStore';

vi.mock('../../src/session/sessionStore', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
}));

function fakeBlob(): Blob {
  return new Blob(['x'], { type: 'image/jpeg' });
}

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('renderChecklistHub', () => {
  beforeEach(() => {
    vi.mocked(saveSession).mockClear().mockResolvedValue(undefined);
  });

  it('disables Finish Session until every required category has a photo', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(true);
  });

  it('enables Finish Session once all required categories are covered', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    renderChecklistHub(container, session, vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(false);
  });

  it('shows the photo count for a category that has photos', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob());
    session = addPhoto(session, 'front', fakeBlob());
    renderChecklistHub(container, session, vi.fn(), vi.fn());

    const row = container.querySelector('[data-category="front"]')!;
    expect(row.textContent).toContain('2 photos');
  });

  it('calls onOpenCategory with the category key when a row is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onOpenCategory = vi.fn();
    renderChecklistHub(container, session, onOpenCategory, vi.fn());

    container.querySelector<HTMLDivElement>('[data-category="leftSide"]')!.click();

    expect(onOpenCategory).toHaveBeenCalledWith('leftSide');
  });

  it('persists the session as complete and calls onFinish with the updated session when Finish Session is clicked while enabled', async () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    const onFinish = vi.fn();
    renderChecklistHub(container, session, vi.fn(), onFinish);

    container.querySelector<HTMLButtonElement>('#finish-button')!.click();
    await flushMicrotasks();

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ id: session.id, status: 'complete' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0].status).toBe('complete');
  });
});
```

This replaces the old `'calls onFinish when Finish Session is clicked while enabled'` test (which asserted `onFinish` was called with no arguments) with the one above, and adds the `saveSession` mock plus a `beforeEach` reset.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/screens/checklistHub.test.ts`
Expected: FAIL — the new "persists the session as complete..." test fails: `saveSession` is asserted to have been called once but was never called, because the current implementation calls `onFinish()` with no arguments and never imports or calls `saveSession`. `vitest run` transpiles but does not type-check, so the test runs despite `checklistHub.ts` not yet importing from `sessionStore.ts`. The other 4 pre-existing tests still pass.

- [ ] **Step 3: Update `src/screens/checklistHub.ts`**

Replace the entire file with:

```ts
import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { photoCountFor, requiredCategoriesComplete } from '../session/session';
import { saveSession } from '../session/sessionStore';

export function renderChecklistHub(
  container: HTMLElement,
  session: Session,
  onOpenCategory: (categoryKey: string) => void,
  onFinish: (session: Session) => void
): void {
  const categories = categoriesFor(session.sessionType);
  const canFinish = requiredCategoriesComplete(session);

  const rows = categories
    .map((category) => {
      const count = photoCountFor(session, category.key);
      const check = count > 0 ? '✅' : '⬜';
      const optionalLabel = category.required ? '' : ' (optional)';
      const countLabel = count > 0 ? `${count} photo${count > 1 ? 's' : ''}` : 'tap to shoot';
      return `
        <div class="category-row" data-category="${category.key}">
          <span>${check} ${category.label}${optionalLabel}</span>
          <span>${countLabel}</span>
        </div>
      `;
    })
    .join('');

  container.innerHTML = `
    <h1>${session.identifier}</h1>
    <div id="category-list">${rows}</div>
    <button id="finish-button" ${canFinish ? '' : 'disabled'}>Finish Session</button>
  `;

  container.querySelectorAll<HTMLDivElement>('.category-row').forEach((row) => {
    row.addEventListener('click', () => {
      onOpenCategory(row.dataset.category!);
    });
  });

  container.querySelector<HTMLButtonElement>('#finish-button')!.addEventListener('click', async () => {
    if (!canFinish) return;
    const updated: Session = { ...session, status: 'complete' };
    await saveSession(updated);
    onFinish(updated);
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/screens/checklistHub.test.ts`
Expected: PASS (5 tests passed).

- [ ] **Step 5: Update `app.ts`'s call site so the build still type-checks**

`src/app.ts`'s `hub` case currently calls `renderChecklistHub` with a 4th argument of `() => navigate({ screen: 'review', session: state.session })`, which no longer matches the new `(session: Session) => void` signature. Update it now so the project keeps compiling (this is a minimal signature-compatibility fix only — the full resume/routing behavior for `'complete'` sessions is done in Task 4).

In `src/app.ts`, inside `navigate()`'s `case 'hub':` block, replace:
```ts
          (categoryKey) => navigate({ screen: 'capture', session: state.session, categoryKey }),
          () => navigate({ screen: 'review', session: state.session })
```
with:
```ts
          (categoryKey) => navigate({ screen: 'capture', session: state.session, categoryKey }),
          (updatedSession) => navigate({ screen: 'review', session: updatedSession })
```

- [ ] **Step 6: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: all 17 test files pass (76 tests — one test was replaced, not added, so the count is unchanged from Task 1's baseline).

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/screens/checklistHub.ts src/app.ts tests/screens/checklistHub.test.ts
git commit -m "Persist session as complete and pass it through onFinish"
```

---

## Task 3: "Start Over" (Discard Session) on the Checklist Hub

**Files:**
- Modify: `src/screens/checklistHub.ts`
- Modify: `tests/screens/checklistHub.test.ts`

This task adds a 5th parameter, `onDiscard: () => void`, to `renderChecklistHub`, and a confirm-gated "Start Over" action. Since the screen now needs to switch between two views (the normal checklist and the discard-confirm view) without a full re-invocation from the caller, the render logic is restructured into a local `draw()` function with a small piece of module-local state (`confirmingDiscard`) — the same mutable-state-plus-redraw pattern already used in `src/screens/identifierScreen.ts` and `src/screens/captureScreen.ts`.

- [ ] **Step 1: Write the failing test**

Replace the entire contents of `tests/screens/checklistHub.test.ts` with:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, addPhoto } from '../../src/session/session';
import { renderChecklistHub } from '../../src/screens/checklistHub';
import { saveSession, clearSession } from '../../src/session/sessionStore';

vi.mock('../../src/session/sessionStore', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn().mockResolvedValue(undefined),
}));

function fakeBlob(): Blob {
  return new Blob(['x'], { type: 'image/jpeg' });
}

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('renderChecklistHub', () => {
  beforeEach(() => {
    vi.mocked(saveSession).mockClear().mockResolvedValue(undefined);
    vi.mocked(clearSession).mockClear().mockResolvedValue(undefined);
  });

  it('disables Finish Session until every required category has a photo', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(true);
  });

  it('enables Finish Session once all required categories are covered', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    const finishButton = container.querySelector<HTMLButtonElement>('#finish-button')!;
    expect(finishButton.disabled).toBe(false);
  });

  it('shows the photo count for a category that has photos', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob());
    session = addPhoto(session, 'front', fakeBlob());
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    const row = container.querySelector('[data-category="front"]')!;
    expect(row.textContent).toContain('2 photos');
  });

  it('calls onOpenCategory with the category key when a row is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onOpenCategory = vi.fn();
    renderChecklistHub(container, session, onOpenCategory, vi.fn(), vi.fn());

    container.querySelector<HTMLDivElement>('[data-category="leftSide"]')!.click();

    expect(onOpenCategory).toHaveBeenCalledWith('leftSide');
  });

  it('persists the session as complete and calls onFinish with the updated session when Finish Session is clicked while enabled', async () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    const onFinish = vi.fn();
    renderChecklistHub(container, session, vi.fn(), onFinish, vi.fn());

    container.querySelector<HTMLButtonElement>('#finish-button')!.click();
    await flushMicrotasks();

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ id: session.id, status: 'complete' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0][0].status).toBe('complete');
  });

  it('does not show the discard confirmation until Start Over is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    expect(container.querySelector('#confirm-discard-button')).toBeNull();
    expect(container.querySelector('#discard-button')).not.toBeNull();
  });

  it('shows a discard confirmation when Start Over is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    container.querySelector<HTMLButtonElement>('#discard-button')!.click();

    expect(container.textContent).toContain('Discard session? All photos will be lost.');
    expect(container.querySelector('#confirm-discard-button')).not.toBeNull();
  });

  it('returns to the normal hub view without discarding when Cancel is clicked', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderChecklistHub(container, session, vi.fn(), vi.fn(), vi.fn());

    container.querySelector<HTMLButtonElement>('#discard-button')!.click();
    container.querySelector<HTMLButtonElement>('#cancel-discard-button')!.click();

    expect(container.querySelector('#finish-button')).not.toBeNull();
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('clears the session and calls onDiscard when Discard is confirmed', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onDiscard = vi.fn();
    renderChecklistHub(container, session, vi.fn(), vi.fn(), onDiscard);

    container.querySelector<HTMLButtonElement>('#discard-button')!.click();
    container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.click();
    await flushMicrotasks();

    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/screens/checklistHub.test.ts`
Expected: FAIL — the four new discard-related tests fail (`#discard-button` doesn't exist yet, `renderChecklistHub` doesn't accept a 5th argument), and the four pre-existing tests calling `renderChecklistHub(..., vi.fn())` with only 4 arguments will also fail to type-check against the new required 5-argument signature once Step 3 lands — but at this point (before Step 3), they should still pass since the implementation hasn't changed yet. Confirm the 4 new tests fail and the 5 pre-existing ones still pass.

- [ ] **Step 3: Update `src/screens/checklistHub.ts`**

Replace the entire file with:

```ts
import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { photoCountFor, requiredCategoriesComplete } from '../session/session';
import { saveSession, clearSession } from '../session/sessionStore';

export function renderChecklistHub(
  container: HTMLElement,
  session: Session,
  onOpenCategory: (categoryKey: string) => void,
  onFinish: (session: Session) => void,
  onDiscard: () => void
): void {
  let confirmingDiscard = false;

  function draw(): void {
    if (confirmingDiscard) {
      container.innerHTML = `
        <h1>${session.identifier}</h1>
        <p>Discard session? All photos will be lost.</p>
        <button id="cancel-discard-button">Cancel</button>
        <button id="confirm-discard-button">Discard</button>
      `;

      container.querySelector<HTMLButtonElement>('#cancel-discard-button')!.addEventListener('click', () => {
        confirmingDiscard = false;
        draw();
      });

      container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.addEventListener('click', async () => {
        await clearSession(session.id);
        onDiscard();
      });

      return;
    }

    const categories = categoriesFor(session.sessionType);
    const canFinish = requiredCategoriesComplete(session);

    const rows = categories
      .map((category) => {
        const count = photoCountFor(session, category.key);
        const check = count > 0 ? '✅' : '⬜';
        const optionalLabel = category.required ? '' : ' (optional)';
        const countLabel = count > 0 ? `${count} photo${count > 1 ? 's' : ''}` : 'tap to shoot';
        return `
          <div class="category-row" data-category="${category.key}">
            <span>${check} ${category.label}${optionalLabel}</span>
            <span>${countLabel}</span>
          </div>
        `;
      })
      .join('');

    container.innerHTML = `
      <h1>${session.identifier}</h1>
      <div id="category-list">${rows}</div>
      <button id="finish-button" ${canFinish ? '' : 'disabled'}>Finish Session</button>
      <button id="discard-button">Start Over</button>
    `;

    container.querySelectorAll<HTMLDivElement>('.category-row').forEach((row) => {
      row.addEventListener('click', () => {
        onOpenCategory(row.dataset.category!);
      });
    });

    container.querySelector<HTMLButtonElement>('#finish-button')!.addEventListener('click', async () => {
      if (!canFinish) return;
      const updated: Session = { ...session, status: 'complete' };
      await saveSession(updated);
      onFinish(updated);
    });

    container.querySelector<HTMLButtonElement>('#discard-button')!.addEventListener('click', () => {
      confirmingDiscard = true;
      draw();
    });
  }

  draw();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/screens/checklistHub.test.ts`
Expected: PASS (9 tests passed).

- [ ] **Step 5: Update `app.ts`'s call site so the build still type-checks**

`src/app.ts`'s `hub` case now needs a 5th argument for the new `onDiscard` parameter. In `src/app.ts`, inside `navigate()`'s `case 'hub':` block, replace:
```ts
          (categoryKey) => navigate({ screen: 'capture', session: state.session, categoryKey }),
          (updatedSession) => navigate({ screen: 'review', session: updatedSession })
```
with:
```ts
          (categoryKey) => navigate({ screen: 'capture', session: state.session, categoryKey }),
          (updatedSession) => navigate({ screen: 'review', session: updatedSession }),
          () => navigate({ screen: 'start' })
```

- [ ] **Step 6: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: all 17 test files pass (80 tests: 76 from before this task, minus 1 replaced test, plus 4 new discard tests, plus... — to be precise: Task 3's test file has 9 tests total where the prior task's file had 5, a net gain of 4, so total suite count is 76 + 4 = 80).

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/screens/checklistHub.ts src/app.ts tests/screens/checklistHub.test.ts
git commit -m "Add Start Over action to discard an in-progress session"
```

---

## Task 4: Resume a `'complete'` Session to Review & Send

**Files:**
- Modify: `src/app.ts:15-17`
- Modify: `tests/app.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/app.test.ts`, inside the existing `describe('resolveInitialState', ...)` block (after the two existing tests):

```ts
  it('resumes at review & send when a session has been finished but not yet sent', () => {
    const session = { ...createSession('vehicle', 'unit', '11802'), status: 'complete' as const };
    expect(resolveInitialState(session)).toEqual({ screen: 'review', session });
  });
```

The full file should read:

```ts
import { describe, it, expect } from 'vitest';
import { resolveInitialState } from '../src/app';
import { createSession } from '../src/session/session';

describe('resolveInitialState', () => {
  it('starts at the start screen when there is no saved session', () => {
    expect(resolveInitialState(undefined)).toEqual({ screen: 'start' });
  });

  it('resumes at the checklist hub when a session is already in progress', () => {
    const session = createSession('vehicle', 'unit', '11802');
    expect(resolveInitialState(session)).toEqual({ screen: 'hub', session });
  });

  it('resumes at review & send when a session has been finished but not yet sent', () => {
    const session = { ...createSession('vehicle', 'unit', '11802'), status: 'complete' as const };
    expect(resolveInitialState(session)).toEqual({ screen: 'review', session });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/app.test.ts`
Expected: FAIL — `resolveInitialState` currently routes any defined session (including a `'complete'` one) to `{ screen: 'hub', session }`, so the new test's `{ screen: 'review', session }` expectation fails.

- [ ] **Step 3: Update `resolveInitialState` in `src/app.ts`**

Replace (lines 15-17):
```ts
export function resolveInitialState(existing: Session | undefined): AppState {
  return existing ? { screen: 'hub', session: existing } : { screen: 'start' };
}
```
with:
```ts
export function resolveInitialState(existing: Session | undefined): AppState {
  if (!existing) return { screen: 'start' };
  if (existing.status === 'complete') return { screen: 'review', session: existing };
  return { screen: 'hub', session: existing };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/app.test.ts`
Expected: PASS (3 tests passed).

- [ ] **Step 5: Run the full suite and build to confirm no regressions**

Run: `npx vitest run`
Expected: all 17 test files pass (81 tests: 80 from Task 3, plus this task's 1 new test).

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/app.ts tests/app.test.ts
git commit -m "Resume a completed-but-unsent session to Review & Send"
```

---

## Task 5: Manual Verification

**Files:** None (manual check only, no code changes)

- [ ] **Step 1: Confirm the full user flow end-to-end via the test suite and a local dev run**

Run: `npx vitest run`
Expected: all 17 test files pass (81 tests total).

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev` and manually verify in a browser (this is a quick sanity check, not a substitute for the existing `docs/testing/manual-device-checklist.md`, which should still be run on real devices before rollout):
- Start a new Vehicle session, take a couple of photos, and confirm a "Start Over" button appears on the Checklist Hub.
- Click "Start Over", confirm the "Discard session? All photos will be lost." message appears with Cancel/Discard buttons.
- Click Cancel, confirm you're back at the normal checklist view with your photos still there.
- Click "Start Over" again, click Discard, confirm you're returned to the Start screen with no session left (refreshing the page should also land on Start, not resume anything).
- Take enough photos to enable Finish Session, click it, confirm you land on the Review & Send screen. Reload the page (simulating the app being closed) before sending — confirm it resumes directly to Review & Send rather than the Checklist Hub.

- [ ] **Step 2: No commit needed for this task** (verification only).

---

## Self-Review Notes

- **Spec coverage:** Part 1 (Discard/Start Over) is covered by Task 3; Part 2 (`'complete'` status wiring: persist-on-finish, resume-to-review, `getActiveSession` matching) is covered by Tasks 1, 2, and 4. The spec's "Known consequence (accepted)" note (no discard after Finish) requires no code — it's a documented non-goal, not a task.
- **Type consistency:** `onFinish`'s signature (`(session: Session) => void`) is introduced in Task 2 and consistently used in Task 3's rewrite and Task 4's `app.ts` wiring. `onDiscard: () => void` is introduced in Task 3 and consistently wired in the same task's `app.ts` update. `resolveInitialState`'s three-way branch matches the spec exactly.
- **Test count tracking:** 76 (pre-existing) → 76 (Task 1, net 0, one test replaced) → 76 (Task 2, net 0, one test replaced) → 80 (Task 3, net +4) → 81 (Task 4, net +1). Each task's "run full suite" step states the expected count so drift is caught immediately.
