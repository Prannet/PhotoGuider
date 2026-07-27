# Auction Photo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, offline-capable Progressive Web App that guides coworkers through photographing auction vehicles/items, then sends the finished photo set to SharePoint and/or email.

**Architecture:** A single static PWA (no backend server). Photos are captured via the phone's native camera (through a file input), held in IndexedDB until a session is finished, zipped client-side, and sent either straight to SharePoint via Microsoft Graph (user's own M365 login) or handed to the phone's native share sheet for email. See `docs/superpowers/specs/2026-07-27-auction-photo-app-design.md` for the full rationale.

**Tech Stack:** Vite + TypeScript, Vitest + jsdom for tests, `idb` (IndexedDB wrapper), `jszip` (client-side zip), `@azure/msal-browser` (Microsoft login), `vite-plugin-pwa` (installable app manifest/service worker), `fake-indexeddb` (test double for IndexedDB).

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/styles.css`
- Create: `src/main.ts`
- Create: `tests/setup.ts`
- Create: `tests/smoke.test.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "auction-photo-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@azure/msal-browser": "^3.18.0",
    "idb": "^8.0.0",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "@types/jszip": "^3.4.1",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^24.1.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

- [ ] **Step 4: Create `tests/setup.ts`**

```ts
import 'fake-indexeddb/auto';
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Auction Photo Capture</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/styles.css`**

```css
:root {
  color-scheme: light dark;
  font-family: system-ui, sans-serif;
}

body {
  margin: 0;
  padding: 0;
}

#app {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

button {
  font-size: 1rem;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #888;
  background: #f5f5f5;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

.thumb-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.thumb {
  position: relative;
  width: 64px;
}

.thumb img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 4px;
}

.thumb button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  font-size: 0.75rem;
  line-height: 1;
}

.thumb input {
  width: 64px;
  font-size: 0.65rem;
  margin-top: 4px;
}
```

- [ ] **Step 7: Create `src/main.ts` (scaffold placeholder, replaced in Task 16)**

```ts
import './styles.css';

const app = document.getElementById('app')!;
app.innerHTML = '<h1>Auction Photo Capture</h1><p>Setup complete.</p>';
```

- [ ] **Step 8: Create `tests/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('test runner is working', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 9: Install dependencies and verify**

Run: `npm install`
Expected: installs without error.

Run: `npx vitest run`
Expected: `tests/smoke.test.ts` passes (1 test, 1 passed).

Run: `npm run build`
Expected: build completes, `dist/` is created.

- [ ] **Step 10: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/styles.css src/main.ts tests/setup.ts tests/smoke.test.ts package-lock.json
git commit -m "Scaffold Vite/TypeScript/Vitest project"
```

---

## Task 2: Domain Types & Category Constants

**Files:**
- Create: `src/types.ts`
- Create: `src/constants.ts`
- Test: `tests/constants.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/constants.test.ts
import { describe, it, expect } from 'vitest';
import { categoriesFor } from '../src/constants';

describe('categoriesFor', () => {
  it('returns vehicle categories including tire, interior, and speedometer', () => {
    const categories = categoriesFor('vehicle');
    const keys = categories.map((c) => c.key);
    expect(keys).toEqual([
      'front',
      'leftSide',
      'rightSide',
      'back',
      'tire',
      'interior',
      'speedometer',
      'damages',
      'additional',
    ]);
    expect(categories.filter((c) => c.required)).toHaveLength(7);
  });

  it('returns other-item categories with detail instead of vehicle-specific angles', () => {
    const categories = categoriesFor('other');
    const keys = categories.map((c) => c.key);
    expect(keys).toEqual(['front', 'leftSide', 'rightSide', 'back', 'detail', 'damages', 'additional']);
    expect(categories.filter((c) => c.required)).toHaveLength(5);
  });

  it('marks damages and additional as optional and note-taking', () => {
    const categories = categoriesFor('vehicle');
    const damages = categories.find((c) => c.key === 'damages')!;
    const additional = categories.find((c) => c.key === 'additional')!;
    expect(damages.required).toBe(false);
    expect(damages.allowNotes).toBe(true);
    expect(additional.required).toBe(false);
    expect(additional.allowNotes).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/constants.test.ts`
Expected: FAIL — cannot find module `../src/constants`.

- [ ] **Step 3: Create `src/types.ts`**

```ts
export type SessionType = 'vehicle' | 'other';
export type IdentifierType = 'unit' | 'lot';

export interface Photo {
  id: string;
  categoryKey: string;
  shotNumber: number;
  blob: Blob;
  note?: string;
  takenAt: string;
}

export interface Session {
  id: string;
  sessionType: SessionType;
  identifierType: IdentifierType;
  identifier: string;
  createdAt: string;
  photos: Photo[];
  status: 'in-progress' | 'complete';
}
```

- [ ] **Step 4: Create `src/constants.ts`**

```ts
import type { SessionType } from './types';

export interface CategoryDef {
  key: string;
  label: string;
  required: boolean;
  allowNotes: boolean;
}

export const VEHICLE_CATEGORIES: CategoryDef[] = [
  { key: 'front', label: 'Front', required: true, allowNotes: false },
  { key: 'leftSide', label: 'Left Side', required: true, allowNotes: false },
  { key: 'rightSide', label: 'Right Side', required: true, allowNotes: false },
  { key: 'back', label: 'Back', required: true, allowNotes: false },
  { key: 'tire', label: 'Tire', required: true, allowNotes: false },
  { key: 'interior', label: 'Interior', required: true, allowNotes: false },
  { key: 'speedometer', label: 'Speedometer', required: true, allowNotes: false },
  { key: 'damages', label: 'Damages', required: false, allowNotes: true },
  { key: 'additional', label: 'Additional', required: false, allowNotes: true },
];

export const OTHER_ITEM_CATEGORIES: CategoryDef[] = [
  { key: 'front', label: 'Front', required: true, allowNotes: false },
  { key: 'leftSide', label: 'Left Side', required: true, allowNotes: false },
  { key: 'rightSide', label: 'Right Side', required: true, allowNotes: false },
  { key: 'back', label: 'Back', required: true, allowNotes: false },
  { key: 'detail', label: 'Detail/Close-up', required: true, allowNotes: false },
  { key: 'damages', label: 'Damages', required: false, allowNotes: true },
  { key: 'additional', label: 'Additional', required: false, allowNotes: true },
];

export function categoriesFor(sessionType: SessionType): CategoryDef[] {
  return sessionType === 'vehicle' ? VEHICLE_CATEGORIES : OTHER_ITEM_CATEGORIES;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/constants.test.ts`
Expected: PASS (3 tests passed).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/constants.ts tests/constants.test.ts
git commit -m "Add domain types and per-session-type category lists"
```

---

## Task 3: Identifier & Filename Naming Logic

**Files:**
- Create: `src/naming.ts`
- Test: `tests/naming.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/naming.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeIdentifier, dateOnly, photoFilename, zipFilename } from '../src/naming';

describe('sanitizeIdentifier', () => {
  it('strips spaces', () => {
    expect(sanitizeIdentifier('11802 ')).toBe('11802');
  });

  it('strips dashes and other punctuation', () => {
    expect(sanitizeIdentifier('LOT-A22')).toBe('LOTA22');
  });

  it('preserves alphanumeric characters and case as typed', () => {
    expect(sanitizeIdentifier('Lot A22')).toBe('LotA22');
  });
});

describe('dateOnly', () => {
  it('extracts the date portion of an ISO timestamp', () => {
    expect(dateOnly('2026-07-27T14:03:00.000Z')).toBe('2026-07-27');
  });
});

describe('photoFilename', () => {
  it('builds Identifier_category_shotNumber.jpg', () => {
    expect(photoFilename('11802', 'leftSide', 1)).toBe('11802_leftSide_1.jpg');
    expect(photoFilename('11802', 'leftSide', 2)).toBe('11802_leftSide_2.jpg');
  });

  it('sanitizes the identifier before building the filename', () => {
    expect(photoFilename('LOT-A22', 'damages', 1)).toBe('LOTA22_damages_1.jpg');
  });
});

describe('zipFilename', () => {
  it('builds Identifier_sessionType_date.zip', () => {
    expect(zipFilename('11802', 'vehicle', '2026-07-27T14:03:00.000Z')).toBe('11802_vehicle_2026-07-27.zip');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/naming.test.ts`
Expected: FAIL — cannot find module `../src/naming`.

- [ ] **Step 3: Create `src/naming.ts`**

```ts
import type { SessionType } from './types';

export function sanitizeIdentifier(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '');
}

export function dateOnly(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

export function photoFilename(identifier: string, categoryKey: string, shotNumber: number): string {
  return `${sanitizeIdentifier(identifier)}_${categoryKey}_${shotNumber}.jpg`;
}

export function zipFilename(identifier: string, sessionType: SessionType, createdAt: string): string {
  return `${sanitizeIdentifier(identifier)}_${sessionType}_${dateOnly(createdAt)}.zip`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/naming.test.ts`
Expected: PASS (6 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/naming.ts tests/naming.test.ts
git commit -m "Add filename and zip-name generation logic"
```

---

## Task 4: Session Model Logic

**Files:**
- Create: `src/id.ts`
- Create: `src/session/session.ts`
- Test: `tests/session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/session.test.ts
import { describe, it, expect } from 'vitest';
import { createSession, addPhoto, nextShotNumber, photoCountFor, requiredCategoriesComplete } from '../src/session/session';

function fakeBlob(): Blob {
  return new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
}

describe('createSession', () => {
  it('creates an in-progress session with no photos', () => {
    const session = createSession('vehicle', 'unit', '11802');
    expect(session.sessionType).toBe('vehicle');
    expect(session.identifierType).toBe('unit');
    expect(session.identifier).toBe('11802');
    expect(session.status).toBe('in-progress');
    expect(session.photos).toEqual([]);
    expect(session.id).toBeTruthy();
    expect(session.createdAt).toBeTruthy();
  });

  it('gives each session a unique id', () => {
    const a = createSession('vehicle', 'unit', '11802');
    const b = createSession('vehicle', 'unit', '11803');
    expect(a.id).not.toBe(b.id);
  });
});

describe('nextShotNumber and addPhoto', () => {
  it('numbers shots starting at 1 per category, independent of other categories', () => {
    let session = createSession('vehicle', 'unit', '11802');
    expect(nextShotNumber(session, 'front')).toBe(1);

    session = addPhoto(session, 'front', fakeBlob());
    expect(photoCountFor(session, 'front')).toBe(1);
    expect(nextShotNumber(session, 'front')).toBe(2);
    expect(nextShotNumber(session, 'leftSide')).toBe(1);

    session = addPhoto(session, 'front', fakeBlob());
    session = addPhoto(session, 'leftSide', fakeBlob());
    expect(photoCountFor(session, 'front')).toBe(2);
    expect(photoCountFor(session, 'leftSide')).toBe(1);
  });

  it('attaches an optional note to a photo', () => {
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'damages', fakeBlob(), 'scratch on rear bumper');
    expect(session.photos[0].note).toBe('scratch on rear bumper');
  });
});

describe('requiredCategoriesComplete', () => {
  it('is false until every required vehicle category has a photo', () => {
    let session = createSession('vehicle', 'unit', '11802');
    expect(requiredCategoriesComplete(session)).toBe(false);

    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior']) {
      session = addPhoto(session, key, fakeBlob());
    }
    expect(requiredCategoriesComplete(session)).toBe(false);

    session = addPhoto(session, 'speedometer', fakeBlob());
    expect(requiredCategoriesComplete(session)).toBe(true);
  });

  it('does not require damages or additional', () => {
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    expect(requiredCategoriesComplete(session)).toBe(true);
  });

  it('uses the shorter other-item required list', () => {
    let session = createSession('other', 'lot', 'LOTA22');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'detail']) {
      session = addPhoto(session, key, fakeBlob());
    }
    expect(requiredCategoriesComplete(session)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/session.test.ts`
Expected: FAIL — cannot find module `../src/session/session`.

- [ ] **Step 3: Create `src/id.ts`**

```ts
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
```

- [ ] **Step 4: Create `src/session/session.ts`**

```ts
import type { Session, SessionType, IdentifierType, Photo } from '../types';
import { categoriesFor } from '../constants';
import { generateId } from '../id';

export function createSession(sessionType: SessionType, identifierType: IdentifierType, identifier: string): Session {
  return {
    id: generateId(),
    sessionType,
    identifierType,
    identifier,
    createdAt: new Date().toISOString(),
    photos: [],
    status: 'in-progress',
  };
}

export function nextShotNumber(session: Session, categoryKey: string): number {
  return session.photos.filter((p) => p.categoryKey === categoryKey).length + 1;
}

export function addPhoto(session: Session, categoryKey: string, blob: Blob, note?: string): Session {
  const photo: Photo = {
    id: generateId(),
    categoryKey,
    shotNumber: nextShotNumber(session, categoryKey),
    blob,
    note,
    takenAt: new Date().toISOString(),
  };
  return { ...session, photos: [...session.photos, photo] };
}

export function photoCountFor(session: Session, categoryKey: string): number {
  return session.photos.filter((p) => p.categoryKey === categoryKey).length;
}

export function requiredCategoriesComplete(session: Session): boolean {
  return categoriesFor(session.sessionType)
    .filter((c) => c.required)
    .every((c) => photoCountFor(session, c.key) > 0);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/session.test.ts`
Expected: PASS (7 tests passed).

- [ ] **Step 6: Commit**

```bash
git add src/id.ts src/session/session.ts tests/session.test.ts
git commit -m "Add session model logic: photo tracking and required-category checks"
```

---

## Task 5: Send-Status Helper

**Files:**
- Create: `src/session/sendStatus.ts`
- Test: `tests/sendStatus.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sendStatus.test.ts
import { describe, it, expect } from 'vitest';
import { isSessionReadyToClear, type SendStatusMap } from '../src/session/sendStatus';

describe('isSessionReadyToClear', () => {
  it('is false when nothing has been attempted yet', () => {
    const statuses: SendStatusMap = { sharepoint: 'idle', email: 'idle' };
    expect(isSessionReadyToClear(statuses)).toBe(false);
  });

  it('is true when the only attempted action succeeded', () => {
    const statuses: SendStatusMap = { sharepoint: 'sent', email: 'idle' };
    expect(isSessionReadyToClear(statuses)).toBe(true);
  });

  it('is false while an attempted action is still sending', () => {
    const statuses: SendStatusMap = { sharepoint: 'sending', email: 'idle' };
    expect(isSessionReadyToClear(statuses)).toBe(false);
  });

  it('is false when an attempted action failed, even if the other succeeded', () => {
    const statuses: SendStatusMap = { sharepoint: 'sent', email: 'failed' };
    expect(isSessionReadyToClear(statuses)).toBe(false);
  });

  it('is true once both attempted actions succeed', () => {
    const statuses: SendStatusMap = { sharepoint: 'sent', email: 'sent' };
    expect(isSessionReadyToClear(statuses)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sendStatus.test.ts`
Expected: FAIL — cannot find module `../src/session/sendStatus`.

- [ ] **Step 3: Create `src/session/sendStatus.ts`**

```ts
export type SendActionStatus = 'idle' | 'sending' | 'sent' | 'failed';
export type SendActionKey = 'sharepoint' | 'email';
export type SendStatusMap = Record<SendActionKey, SendActionStatus>;

export function isSessionReadyToClear(statuses: SendStatusMap): boolean {
  const attempted = Object.values(statuses).filter((s) => s !== 'idle');
  if (attempted.length === 0) return false;
  return attempted.every((s) => s === 'sent');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sendStatus.test.ts`
Expected: PASS (5 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/session/sendStatus.ts tests/sendStatus.test.ts
git commit -m "Add send-status helper deciding when a sent session can be cleared"
```

---

## Task 6: Zip + Metadata Builder

**Files:**
- Create: `src/zip/buildZip.ts`
- Test: `tests/buildZip.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/buildZip.test.ts
import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { createSession, addPhoto } from '../src/session/session';
import { buildSessionZip, buildMetadata } from '../src/zip/buildZip';

function fakeBlob(content: string): Blob {
  return new Blob([content], { type: 'image/jpeg' });
}

describe('buildMetadata', () => {
  it('includes identifier, session type, and per-photo details', () => {
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob('a'));
    session = addPhoto(session, 'damages', fakeBlob('b'), 'scratch on bumper');

    const metadata = buildMetadata(session);
    expect(metadata.identifier).toBe('11802');
    expect(metadata.sessionType).toBe('vehicle');
    expect(metadata.photos).toHaveLength(2);
    expect(metadata.photos[0].filename).toBe('11802_front_1.jpg');
    expect(metadata.photos[1].filename).toBe('11802_damages_1.jpg');
    expect(metadata.photos[1].note).toBe('scratch on bumper');
    expect(metadata.photos[0].note).toBeNull();
  });
});

describe('buildSessionZip', () => {
  it('produces a zip containing one file per photo plus metadata.json', async () => {
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob('a'));
    session = addPhoto(session, 'leftSide', fakeBlob('b'));
    session = addPhoto(session, 'leftSide', fakeBlob('c'));

    const zipBlob = await buildSessionZip(session);
    const zip = await JSZip.loadAsync(zipBlob);
    const filenames = Object.keys(zip.files).sort();

    expect(filenames).toEqual(['11802_front_1.jpg', '11802_leftSide_1.jpg', '11802_leftSide_2.jpg', 'metadata.json']);

    const metadataText = await zip.files['metadata.json'].async('string');
    const metadata = JSON.parse(metadataText);
    expect(metadata.photos).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/buildZip.test.ts`
Expected: FAIL — cannot find module `../src/zip/buildZip`.

- [ ] **Step 3: Create `src/zip/buildZip.ts`**

```ts
import JSZip from 'jszip';
import type { Session } from '../types';
import { photoFilename } from '../naming';

export function buildMetadata(session: Session) {
  return {
    identifier: session.identifier,
    identifierType: session.identifierType,
    sessionType: session.sessionType,
    createdAt: session.createdAt,
    photos: session.photos.map((p) => ({
      filename: photoFilename(session.identifier, p.categoryKey, p.shotNumber),
      category: p.categoryKey,
      shotNumber: p.shotNumber,
      takenAt: p.takenAt,
      note: p.note ?? null,
    })),
  };
}

export async function buildSessionZip(session: Session): Promise<Blob> {
  const zip = new JSZip();
  for (const photo of session.photos) {
    zip.file(photoFilename(session.identifier, photo.categoryKey, photo.shotNumber), photo.blob);
  }
  zip.file('metadata.json', JSON.stringify(buildMetadata(session), null, 2));
  return zip.generateAsync({ type: 'blob' });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/buildZip.test.ts`
Expected: PASS (2 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/zip/buildZip.ts tests/buildZip.test.ts
git commit -m "Add zip and metadata.json builder for finished sessions"
```

---

## Task 7: IndexedDB Session Store

**Files:**
- Create: `src/session/sessionStore.ts`
- Test: `tests/sessionStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sessionStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createSession } from '../src/session/session';
import {
  saveSession,
  getActiveSession,
  clearSession,
  wasIdentifierUsedToday,
  recordIdentifierSent,
  __resetForTests,
} from '../src/session/sessionStore';

beforeEach(async () => {
  await __resetForTests();
});

describe('saveSession / getActiveSession', () => {
  it('returns undefined when no session has been saved', async () => {
    expect(await getActiveSession()).toBeUndefined();
  });

  it('returns the saved in-progress session', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    await saveSession(session);
    const active = await getActiveSession();
    expect(active?.id).toBe(session.id);
    expect(active?.identifier).toBe('11802');
  });

  it('does not return a session marked complete', async () => {
    const session = { ...createSession('vehicle', 'unit', '11802'), status: 'complete' as const };
    await saveSession(session);
    expect(await getActiveSession()).toBeUndefined();
  });
});

describe('clearSession', () => {
  it('removes the session so it is no longer active', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    await saveSession(session);
    await clearSession(session.id);
    expect(await getActiveSession()).toBeUndefined();
  });
});

describe('wasIdentifierUsedToday / recordIdentifierSent', () => {
  it('is false until an identifier has been recorded for that day', async () => {
    expect(await wasIdentifierUsedToday('11802', '2026-07-27')).toBe(false);
    await recordIdentifierSent('11802', '2026-07-27');
    expect(await wasIdentifierUsedToday('11802', '2026-07-27')).toBe(true);
  });

  it('is scoped per day', async () => {
    await recordIdentifierSent('11802', '2026-07-27');
    expect(await wasIdentifierUsedToday('11802', '2026-07-28')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sessionStore.test.ts`
Expected: FAIL — cannot find module `../src/session/sessionStore`.

- [ ] **Step 3: Create `src/session/sessionStore.ts`**

```ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Session } from '../types';

interface SentIdentifierRecord {
  key: string;
  date: string;
  identifier: string;
  sentAt: string;
}

interface AppDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
  };
  sentIdentifiers: {
    key: string;
    value: SentIdentifierRecord;
  };
}

const DB_NAME = 'auction-photo-app';
let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('sessions', { keyPath: 'id' });
        db.createObjectStore('sentIdentifiers', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getActiveSession(): Promise<Session | undefined> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.find((s) => s.status === 'in-progress');
}

export async function clearSession(sessionId: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', sessionId);
}

export async function wasIdentifierUsedToday(identifier: string, dateStr: string): Promise<boolean> {
  const db = await getDB();
  const record = await db.get('sentIdentifiers', `${dateStr}_${identifier}`);
  return record !== undefined;
}

export async function recordIdentifierSent(identifier: string, dateStr: string): Promise<void> {
  const db = await getDB();
  const key = `${dateStr}_${identifier}`;
  await db.put('sentIdentifiers', { key, date: dateStr, identifier, sentAt: new Date().toISOString() });
}

export async function __resetForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/sessionStore.test.ts`
Expected: PASS (7 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/session/sessionStore.ts tests/sessionStore.test.ts
git commit -m "Add IndexedDB-backed session persistence and per-day duplicate tracking"
```

---

## Task 8: Microsoft Auth Wrapper

**Files:**
- Create: `src/upload/auth.ts`
- Create: `.env.example`
- Modify: `.gitignore`
- Test: `tests/auth.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const loginPopupMock = vi.fn();
const acquireTokenSilentMock = vi.fn();
const getAllAccountsMock = vi.fn();

vi.mock('@azure/msal-browser', () => {
  return {
    PublicClientApplication: vi.fn().mockImplementation(() => ({
      loginPopup: loginPopupMock,
      acquireTokenSilent: acquireTokenSilentMock,
      getAllAccounts: getAllAccountsMock,
    })),
  };
});

beforeEach(() => {
  vi.resetModules();
  loginPopupMock.mockReset();
  acquireTokenSilentMock.mockReset();
  getAllAccountsMock.mockReset();
});

describe('getAccessToken', () => {
  it('logs in via popup when no account is signed in yet', async () => {
    getAllAccountsMock.mockReturnValue([]);
    loginPopupMock.mockResolvedValue({ accessToken: 'token-from-login' });

    const { getAccessToken } = await import('../src/upload/auth');
    const token = await getAccessToken();

    expect(token).toBe('token-from-login');
    expect(loginPopupMock).toHaveBeenCalledWith({ scopes: ['Sites.ReadWrite.All'] });
  });

  it('uses a silent token when an account is already signed in', async () => {
    getAllAccountsMock.mockReturnValue([{ username: 'coworker@company.com' }]);
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'token-from-silent' });

    const { getAccessToken } = await import('../src/upload/auth');
    const token = await getAccessToken();

    expect(token).toBe('token-from-silent');
    expect(loginPopupMock).not.toHaveBeenCalled();
  });

  it('falls back to popup login when the silent token acquisition fails', async () => {
    getAllAccountsMock.mockReturnValue([{ username: 'coworker@company.com' }]);
    acquireTokenSilentMock.mockRejectedValue(new Error('interaction required'));
    loginPopupMock.mockResolvedValue({ accessToken: 'token-from-fallback' });

    const { getAccessToken } = await import('../src/upload/auth');
    const token = await getAccessToken();

    expect(token).toBe('token-from-fallback');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/auth.test.ts`
Expected: FAIL — cannot find module `../src/upload/auth`.

- [ ] **Step 3: Create `src/upload/auth.ts`**

```ts
import { PublicClientApplication, type AuthenticationResult } from '@azure/msal-browser';

const GRAPH_SCOPES = ['Sites.ReadWrite.All'];

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID ?? 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
  },
};

let msalInstance: PublicClientApplication | null = null;

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

export async function login(): Promise<AuthenticationResult> {
  return getMsalInstance().loginPopup({ scopes: GRAPH_SCOPES });
}

export async function getAccessToken(): Promise<string> {
  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();

  if (accounts.length === 0) {
    const result = await login();
    return result.accessToken;
  }

  try {
    const result = await instance.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: accounts[0] });
    return result.accessToken;
  } catch {
    const result = await login();
    return result.accessToken;
  }
}
```

- [ ] **Step 4: Create `.env.example`**

```
VITE_AZURE_CLIENT_ID=
VITE_AZURE_TENANT_ID=
```

- [ ] **Step 5: Modify `.gitignore` to exclude real environment values**

```
.superpowers/
.env
node_modules/
dist/
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/auth.test.ts`
Expected: PASS (3 tests passed).

- [ ] **Step 7: Commit**

```bash
git add src/upload/auth.ts .env.example .gitignore tests/auth.test.ts
git commit -m "Add Microsoft login wrapper for Graph API access tokens"
```

---

## Task 9: SharePoint Upload

**Files:**
- Create: `src/upload/sharepointUpload.ts`
- Modify: `.env.example`
- Test: `tests/sharepointUpload.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/sharepointUpload.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/upload/auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('fake-token'),
}));

import { uploadZipToSharePoint } from '../src/upload/sharepointUpload';

function fakeZipBlob(): Blob {
  return new Blob(['fake-zip-bytes'], { type: 'application/zip' });
}

describe('uploadZipToSharePoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an upload session then PUTs the file to the returned URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uploadUrl: 'https://upload.example.com/session-123' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await uploadZipToSharePoint('11802_vehicle_2026-07-27.zip', fakeZipBlob());

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [createUrl, createOptions] = fetchMock.mock.calls[0];
    expect(createUrl).toContain('createUploadSession');
    expect(createUrl).toContain('11802_vehicle_2026-07-27.zip');
    expect(createOptions.headers.Authorization).toBe('Bearer fake-token');

    const [uploadUrl, uploadOptions] = fetchMock.mock.calls[1];
    expect(uploadUrl).toBe('https://upload.example.com/session-123');
    expect(uploadOptions.method).toBe('PUT');
    expect(uploadOptions.headers['Content-Range']).toMatch(/^bytes 0-\d+\/\d+$/);
  });

  it('throws when creating the upload session fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 403 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadZipToSharePoint('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow(
      'Failed to create upload session: 403'
    );
  });

  it('throws when the file PUT fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uploadUrl: 'https://upload.example.com/session-123' }) })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadZipToSharePoint('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow(
      'Upload failed: 500'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/sharepointUpload.test.ts`
Expected: FAIL — cannot find module `../src/upload/sharepointUpload`.

- [ ] **Step 3: Create `src/upload/sharepointUpload.ts`**

```ts
import { getAccessToken } from './auth';

const SITE_ID = import.meta.env.VITE_SHAREPOINT_SITE_ID ?? '';
const FOLDER_PATH = import.meta.env.VITE_SHAREPOINT_FOLDER_PATH ?? 'Auction Photos';

export async function uploadZipToSharePoint(filename: string, zipBlob: Blob): Promise<void> {
  const token = await getAccessToken();

  const createSessionResp = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drive/root:/${FOLDER_PATH}/${filename}:/createUploadSession`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'rename' } }),
    }
  );

  if (!createSessionResp.ok) {
    throw new Error(`Failed to create upload session: ${createSessionResp.status}`);
  }

  const { uploadUrl } = await createSessionResp.json();
  const size = zipBlob.size;

  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(size),
      'Content-Range': `bytes 0-${size - 1}/${size}`,
    },
    body: zipBlob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Upload failed: ${uploadResp.status}`);
  }
}
```

- [ ] **Step 4: Append SharePoint variables to `.env.example`**

```
VITE_AZURE_CLIENT_ID=
VITE_AZURE_TENANT_ID=
VITE_SHAREPOINT_SITE_ID=
VITE_SHAREPOINT_FOLDER_PATH=Auction Photos
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/sharepointUpload.test.ts`
Expected: PASS (3 tests passed).

- [ ] **Step 6: Commit**

```bash
git add src/upload/sharepointUpload.ts .env.example tests/sharepointUpload.test.ts
git commit -m "Add SharePoint upload via Microsoft Graph upload sessions"
```

---

## Task 10: Email Share Wrapper

**Files:**
- Create: `src/upload/shareEmail.ts`
- Test: `tests/shareEmail.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/shareEmail.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canShareFiles, shareZipViaEmail } from '../src/upload/shareEmail';

function fakeZipBlob(): Blob {
  return new Blob(['fake-zip-bytes'], { type: 'application/zip' });
}

describe('canShareFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when navigator.canShare is unavailable', () => {
    expect(canShareFiles([new File(['a'], 'a.zip')])).toBe(false);
  });

  it('reflects navigator.canShare when available', () => {
    vi.stubGlobal('navigator', { canShare: () => true, share: vi.fn() });
    expect(canShareFiles([new File(['a'], 'a.zip')])).toBe(true);
  });
});

describe('shareZipViaEmail', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shares the zip as a file via navigator.share', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { canShare: () => true, share: shareMock });

    await shareZipViaEmail('11802_vehicle_2026-07-27.zip', fakeZipBlob());

    expect(shareMock).toHaveBeenCalledTimes(1);
    const call = shareMock.mock.calls[0][0];
    expect(call.files).toHaveLength(1);
    expect(call.files[0].name).toBe('11802_vehicle_2026-07-27.zip');
  });

  it('throws SHARE_NOT_SUPPORTED when file sharing is unavailable', async () => {
    vi.stubGlobal('navigator', {});

    await expect(shareZipViaEmail('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow(
      'SHARE_NOT_SUPPORTED'
    );
  });

  it('propagates rejection when the user cancels the share sheet', async () => {
    const shareMock = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    vi.stubGlobal('navigator', { canShare: () => true, share: shareMock });

    await expect(shareZipViaEmail('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shareEmail.test.ts`
Expected: FAIL — cannot find module `../src/upload/shareEmail`.

- [ ] **Step 3: Create `src/upload/shareEmail.ts`**

```ts
export function canShareFiles(files: File[]): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files });
}

export async function shareZipViaEmail(filename: string, zipBlob: Blob): Promise<void> {
  const file = new File([zipBlob], filename, { type: 'application/zip' });

  if (!canShareFiles([file])) {
    throw new Error('SHARE_NOT_SUPPORTED');
  }

  await navigator.share({
    files: [file],
    title: 'Auction Photo Session',
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shareEmail.test.ts`
Expected: PASS (4 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/upload/shareEmail.ts tests/shareEmail.test.ts
git commit -m "Add Web Share API wrapper for handing the zip to a mail app"
```

---

## Task 11: Start Screen

**Files:**
- Create: `src/screens/startScreen.ts`
- Test: `tests/screens/startScreen.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/screens/startScreen.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderStartScreen } from '../../src/screens/startScreen';

describe('renderStartScreen', () => {
  it('renders Vehicle and Other Item choices', () => {
    const container = document.createElement('div');
    renderStartScreen(container, vi.fn());

    expect(container.querySelector('[data-choice="vehicle"]')).not.toBeNull();
    expect(container.querySelector('[data-choice="other"]')).not.toBeNull();
  });

  it('calls onChoose with "vehicle" when the Vehicle button is clicked', () => {
    const container = document.createElement('div');
    const onChoose = vi.fn();
    renderStartScreen(container, onChoose);

    container.querySelector<HTMLButtonElement>('[data-choice="vehicle"]')!.click();

    expect(onChoose).toHaveBeenCalledWith('vehicle');
  });

  it('calls onChoose with "other" when the Other Item button is clicked', () => {
    const container = document.createElement('div');
    const onChoose = vi.fn();
    renderStartScreen(container, onChoose);

    container.querySelector<HTMLButtonElement>('[data-choice="other"]')!.click();

    expect(onChoose).toHaveBeenCalledWith('other');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/screens/startScreen.test.ts`
Expected: FAIL — cannot find module `../../src/screens/startScreen`.

- [ ] **Step 3: Create `src/screens/startScreen.ts`**

```ts
import type { SessionType } from '../types';

export function renderStartScreen(container: HTMLElement, onChoose: (sessionType: SessionType) => void): void {
  container.innerHTML = `
    <h1>New Session</h1>
    <p>Choose what you're photographing.</p>
    <div style="display:flex; flex-direction:column; gap:12px;">
      <button data-choice="vehicle">Vehicle</button>
      <button data-choice="other">Other Item</button>
    </div>
  `;

  container.querySelectorAll<HTMLButtonElement>('button[data-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      onChoose(button.dataset.choice as SessionType);
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/screens/startScreen.test.ts`
Expected: PASS (3 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/screens/startScreen.ts tests/screens/startScreen.test.ts
git commit -m "Add start screen: Vehicle vs Other Item choice"
```

---

## Task 12: Identifier Screen

**Files:**
- Create: `src/screens/identifierScreen.ts`
- Test: `tests/screens/identifierScreen.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/screens/identifierScreen.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/session/sessionStore', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
  wasIdentifierUsedToday: vi.fn().mockResolvedValue(false),
}));

import { renderIdentifierScreen } from '../../src/screens/identifierScreen';
import { saveSession, wasIdentifierUsedToday } from '../../src/session/sessionStore';

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('renderIdentifierScreen', () => {
  beforeEach(() => {
    vi.mocked(saveSession).mockClear();
    vi.mocked(wasIdentifierUsedToday).mockReset().mockResolvedValue(false);
  });

  it('defaults to Unit # with a numeric input', () => {
    const container = document.createElement('div');
    renderIdentifierScreen(container, 'vehicle', vi.fn());

    const input = container.querySelector<HTMLInputElement>('#identifier-input')!;
    expect(input.type).toBe('tel');
  });

  it('switches to a text input when Lot # is selected', () => {
    const container = document.createElement('div');
    renderIdentifierScreen(container, 'vehicle', vi.fn());

    container.querySelector<HTMLButtonElement>('[data-type="lot"]')!.click();

    const input = container.querySelector<HTMLInputElement>('#identifier-input')!;
    expect(input.type).toBe('text');
  });

  it('shows a warning and does not create a session when the field is empty', async () => {
    const container = document.createElement('div');
    const onCreated = vi.fn();
    renderIdentifierScreen(container, 'vehicle', onCreated);

    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(onCreated).not.toHaveBeenCalled();
    expect(container.querySelector('#identifier-warning')!.textContent).toContain('enter an identifier');
  });

  it('creates and saves a session when a fresh identifier is entered', async () => {
    const container = document.createElement('div');
    const onCreated = vi.fn();
    renderIdentifierScreen(container, 'vehicle', onCreated);

    container.querySelector<HTMLInputElement>('#identifier-input')!.value = '11802';
    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(onCreated).toHaveBeenCalledTimes(1);
    const created = onCreated.mock.calls[0][0];
    expect(created.identifier).toBe('11802');
    expect(created.identifierType).toBe('unit');
    expect(created.sessionType).toBe('vehicle');
  });

  it('warns once and requires a second click when the identifier was already used today', async () => {
    vi.mocked(wasIdentifierUsedToday).mockResolvedValue(true);
    const container = document.createElement('div');
    const onCreated = vi.fn();
    renderIdentifierScreen(container, 'vehicle', onCreated);

    container.querySelector<HTMLInputElement>('#identifier-input')!.value = '11802';
    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(onCreated).not.toHaveBeenCalled();
    expect(container.querySelector('#identifier-warning')!.textContent).toContain('already exists today');

    container.querySelector<HTMLButtonElement>('#continue-button')!.click();
    await flushMicrotasks();

    expect(onCreated).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/screens/identifierScreen.test.ts`
Expected: FAIL — cannot find module `../../src/screens/identifierScreen`.

- [ ] **Step 3: Create `src/screens/identifierScreen.ts`**

```ts
import type { Session, SessionType, IdentifierType } from '../types';
import { createSession } from '../session/session';
import { saveSession, wasIdentifierUsedToday } from '../session/sessionStore';
import { sanitizeIdentifier, dateOnly } from '../naming';

export function renderIdentifierScreen(
  container: HTMLElement,
  sessionType: SessionType,
  onCreated: (session: Session) => void
): void {
  let identifierType: IdentifierType = 'unit';

  function draw() {
    container.innerHTML = `
      <h1>Enter ${sessionType === 'vehicle' ? 'Vehicle' : 'Item'} Identifier</h1>
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <button data-type="unit" aria-pressed="${identifierType === 'unit'}">Unit #</button>
        <button data-type="lot" aria-pressed="${identifierType === 'lot'}">Lot #</button>
      </div>
      <input
        id="identifier-input"
        type="${identifierType === 'unit' ? 'tel' : 'text'}"
        placeholder="${identifierType === 'unit' ? 'e.g. 11802' : 'e.g. LOT-A22'}"
      />
      <p id="identifier-warning" style="color:#b00020; display:none;"></p>
      <button id="continue-button">Continue</button>
    `;

    container.querySelector<HTMLButtonElement>('[data-type="unit"]')!.addEventListener('click', () => {
      identifierType = 'unit';
      draw();
    });
    container.querySelector<HTMLButtonElement>('[data-type="lot"]')!.addEventListener('click', () => {
      identifierType = 'lot';
      draw();
    });

    container.querySelector<HTMLButtonElement>('#continue-button')!.addEventListener('click', async () => {
      const input = container.querySelector<HTMLInputElement>('#identifier-input')!;
      const warning = container.querySelector<HTMLParagraphElement>('#identifier-warning')!;
      const raw = input.value.trim();

      if (!raw) {
        warning.textContent = 'Please enter an identifier.';
        warning.style.display = 'block';
        return;
      }

      const clean = sanitizeIdentifier(raw);
      const today = dateOnly(new Date().toISOString());
      const alreadyConfirmed = warning.dataset.confirmed === 'true';
      const usedToday = await wasIdentifierUsedToday(clean, today);

      if (usedToday && !alreadyConfirmed) {
        warning.textContent = `A session for ${clean} already exists today. Click Continue again to proceed anyway.`;
        warning.style.display = 'block';
        warning.dataset.confirmed = 'true';
        return;
      }

      const session = createSession(sessionType, identifierType, clean);
      await saveSession(session);
      onCreated(session);
    });
  }

  draw();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/screens/identifierScreen.test.ts`
Expected: PASS (5 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/screens/identifierScreen.ts tests/screens/identifierScreen.test.ts
git commit -m "Add identifier screen with Unit/Lot toggle and same-day duplicate warning"
```

---

## Task 13: Checklist Hub Screen

**Files:**
- Create: `src/screens/checklistHub.ts`
- Test: `tests/screens/checklistHub.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/screens/checklistHub.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createSession, addPhoto } from '../../src/session/session';
import { renderChecklistHub } from '../../src/screens/checklistHub';

function fakeBlob(): Blob {
  return new Blob(['x'], { type: 'image/jpeg' });
}

describe('renderChecklistHub', () => {
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

  it('calls onFinish when Finish Session is clicked while enabled', () => {
    const container = document.createElement('div');
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    const onFinish = vi.fn();
    renderChecklistHub(container, session, vi.fn(), onFinish);

    container.querySelector<HTMLButtonElement>('#finish-button')!.click();

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/screens/checklistHub.test.ts`
Expected: FAIL — cannot find module `../../src/screens/checklistHub`.

- [ ] **Step 3: Create `src/screens/checklistHub.ts`**

```ts
import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { photoCountFor, requiredCategoriesComplete } from '../session/session';

export function renderChecklistHub(
  container: HTMLElement,
  session: Session,
  onOpenCategory: (categoryKey: string) => void,
  onFinish: () => void
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

  container.querySelector<HTMLButtonElement>('#finish-button')!.addEventListener('click', () => {
    if (canFinish) onFinish();
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/screens/checklistHub.test.ts`
Expected: PASS (5 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/screens/checklistHub.ts tests/screens/checklistHub.test.ts
git commit -m "Add checklist hub screen with per-category progress and Finish gating"
```

---

## Task 14: Capture Screen

**Files:**
- Create: `src/screens/captureScreen.ts`
- Test: `tests/screens/captureScreen.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/screens/captureScreen.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/session/sessionStore', () => ({
  saveSession: vi.fn().mockResolvedValue(undefined),
}));

import { createSession } from '../../src/session/session';
import { renderCaptureScreen } from '../../src/screens/captureScreen';
import { saveSession } from '../../src/session/sessionStore';

function fakeFile(name = 'photo.jpg'): File {
  return new File(['fake-bytes'], name, { type: 'image/jpeg' });
}

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function selectFile(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, 'files', { value: [file], writable: false, configurable: true });
  input.dispatchEvent(new Event('change'));
  await flushMicrotasks();
}

describe('renderCaptureScreen', () => {
  beforeEach(() => {
    vi.mocked(saveSession).mockClear().mockResolvedValue(undefined);
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  it('shows no note input for a category that does not allow notes', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    expect(container.querySelector('[data-note]')).toBeNull();
  });

  it('adds a photo and re-renders a thumbnail when a file is selected', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());

    expect(container.querySelectorAll('.thumb')).toHaveLength(1);
    expect(saveSession).toHaveBeenCalledTimes(1);
  });

  it('shows a note input per photo for a category that allows notes', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'damages', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());

    expect(container.querySelector('[data-note]')).not.toBeNull();
  });

  it('removes a photo when its delete button is clicked', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());
    expect(container.querySelectorAll('.thumb')).toHaveLength(1);

    container.querySelector<HTMLButtonElement>('[data-remove]')!.click();
    await flushMicrotasks();

    expect(container.querySelectorAll('.thumb')).toHaveLength(0);
  });

  it('calls onDone with the latest session when Done is clicked', async () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    renderCaptureScreen(container, session, 'front', onDone);

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());
    container.querySelector<HTMLButtonElement>('#done-button')!.click();

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0][0].photos).toHaveLength(1);
  });

  it('shows a hint about enabling camera permission in phone settings', () => {
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    expect(container.textContent).toContain('check your phone’s camera permission');
  });

  it('shows a storage warning but keeps the photo visible when saving fails', async () => {
    vi.mocked(saveSession).mockRejectedValueOnce(new Error('QuotaExceededError'));
    const container = document.createElement('div');
    const session = createSession('vehicle', 'unit', '11802');
    renderCaptureScreen(container, session, 'front', vi.fn());

    await selectFile(container.querySelector<HTMLInputElement>('#camera-input')!, fakeFile());

    expect(container.querySelectorAll('.thumb')).toHaveLength(1);
    expect(container.textContent).toContain('may not have been saved');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/screens/captureScreen.test.ts`
Expected: FAIL — cannot find module `../../src/screens/captureScreen`.

- [ ] **Step 3: Create `src/screens/captureScreen.ts`**

```ts
import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { addPhoto } from '../session/session';
import { saveSession } from '../session/sessionStore';

export function renderCaptureScreen(
  container: HTMLElement,
  initialSession: Session,
  categoryKey: string,
  onDone: (session: Session) => void
): void {
  let session = initialSession;
  let storageWarning = false;
  const category = categoriesFor(session.sessionType).find((c) => c.key === categoryKey)!;

  function photosInCategory() {
    return session.photos.filter((p) => p.categoryKey === categoryKey);
  }

  async function persist() {
    try {
      await saveSession(session);
      storageWarning = false;
    } catch {
      storageWarning = true;
    }
  }

  function draw() {
    const photos = photosInCategory();

    const thumbs = photos
      .map(
        (photo) => `
          <div class="thumb" data-photo-id="${photo.id}">
            <img src="${URL.createObjectURL(photo.blob)}" alt="${category.label} photo" />
            <button data-remove="${photo.id}" aria-label="Remove photo">&times;</button>
            ${
              category.allowNotes
                ? `<input data-note="${photo.id}" placeholder="Note (optional)" value="${photo.note ?? ''}" />`
                : ''
            }
          </div>
        `
      )
      .join('');

    container.innerHTML = `
      <h1>${category.label}</h1>
      <p>${photos.length} photo${photos.length === 1 ? '' : 's'} taken</p>
      <p style="font-size:0.8rem; color:#666;">
        If the camera doesn't open, check your phone’s camera permission for this app/site in Settings.
      </p>
      ${
        storageWarning
          ? '<p style="color:#b00020;">This photo may not have been saved — your phone may be low on storage.</p>'
          : ''
      }
      <div class="thumb-row">${thumbs}</div>
      <input id="camera-input" type="file" accept="image/*" capture="environment" style="display:none" />
      <button id="take-photo-button">Take Photo</button>
      <button id="done-button">Done</button>
    `;

    const cameraInput = container.querySelector<HTMLInputElement>('#camera-input')!;

    container.querySelector<HTMLButtonElement>('#take-photo-button')!.addEventListener('click', () => {
      cameraInput.click();
    });

    cameraInput.addEventListener('change', async () => {
      const file = cameraInput.files?.[0];
      if (!file) return;
      session = addPhoto(session, categoryKey, file);
      await persist();
      draw();
    });

    container.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((button) => {
      button.addEventListener('click', async () => {
        const photoId = button.dataset.remove!;
        session = { ...session, photos: session.photos.filter((p) => p.id !== photoId) };
        await persist();
        draw();
      });
    });

    container.querySelectorAll<HTMLInputElement>('[data-note]').forEach((input) => {
      input.addEventListener('change', async () => {
        const photoId = input.dataset.note!;
        session = {
          ...session,
          photos: session.photos.map((p) => (p.id === photoId ? { ...p, note: input.value } : p)),
        };
        await persist();
      });
    });

    container.querySelector<HTMLButtonElement>('#done-button')!.addEventListener('click', () => {
      onDone(session);
    });
  }

  draw();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/screens/captureScreen.test.ts`
Expected: PASS (7 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/screens/captureScreen.ts tests/screens/captureScreen.test.ts
git commit -m "Add capture screen: native camera trigger, thumbnails, delete, and notes"
```

---

## Task 15: Review & Send Screen

**Files:**
- Create: `src/screens/reviewSendScreen.ts`
- Test: `tests/screens/reviewSendScreen.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/screens/reviewSendScreen.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/zip/buildZip', () => ({
  buildSessionZip: vi.fn().mockResolvedValue(new Blob(['zip'])),
}));
vi.mock('../../src/upload/sharepointUpload', () => ({
  uploadZipToSharePoint: vi.fn(),
}));
vi.mock('../../src/upload/shareEmail', () => ({
  shareZipViaEmail: vi.fn(),
}));
vi.mock('../../src/session/sessionStore', () => ({
  clearSession: vi.fn().mockResolvedValue(undefined),
  recordIdentifierSent: vi.fn().mockResolvedValue(undefined),
}));

import { createSession } from '../../src/session/session';
import { renderReviewSendScreen } from '../../src/screens/reviewSendScreen';
import { uploadZipToSharePoint } from '../../src/upload/sharepointUpload';
import { shareZipViaEmail } from '../../src/upload/shareEmail';
import { clearSession } from '../../src/session/sessionStore';

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('renderReviewSendScreen', () => {
  beforeEach(() => {
    vi.mocked(uploadZipToSharePoint).mockReset().mockResolvedValue(undefined);
    vi.mocked(shareZipViaEmail).mockReset().mockResolvedValue(undefined);
    vi.mocked(clearSession).mockClear();
  });

  it('clears the session and calls onDone once the only attempted send succeeds', async () => {
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(uploadZipToSharePoint).toHaveBeenCalledTimes(1);
    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('shows Failed and does not clear the session when the send fails', async () => {
    vi.mocked(uploadZipToSharePoint).mockRejectedValue(new Error('network down'));
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(container.querySelector('#send-sharepoint')!.textContent).toContain('Failed');
    expect(clearSession).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('waits for both attempted actions before clearing when both are used', async () => {
    vi.mocked(shareZipViaEmail).mockRejectedValue(new Error('share cancelled'));
    const session = createSession('vehicle', 'unit', '11802');
    const onDone = vi.fn();
    const container = document.createElement('div');
    renderReviewSendScreen(container, session, onDone);

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.click();
    await flushMicrotasks();
    await flushMicrotasks();
    container.querySelector<HTMLButtonElement>('#send-email')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(clearSession).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();

    vi.mocked(shareZipViaEmail).mockResolvedValue(undefined);
    container.querySelector<HTMLButtonElement>('#send-email')!.click();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(clearSession).toHaveBeenCalledWith(session.id);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/screens/reviewSendScreen.test.ts`
Expected: FAIL — cannot find module `../../src/screens/reviewSendScreen`.

- [ ] **Step 3: Create `src/screens/reviewSendScreen.ts`**

```ts
import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { photoCountFor } from '../session/session';
import { buildSessionZip } from '../zip/buildZip';
import { zipFilename, dateOnly } from '../naming';
import { uploadZipToSharePoint } from '../upload/sharepointUpload';
import { shareZipViaEmail } from '../upload/shareEmail';
import { clearSession, recordIdentifierSent } from '../session/sessionStore';
import { isSessionReadyToClear, type SendStatusMap, type SendActionKey } from '../session/sendStatus';

export function renderReviewSendScreen(container: HTMLElement, session: Session, onDone: () => void): void {
  const statuses: SendStatusMap = { sharepoint: 'idle', email: 'idle' };
  let zipCache: { blob: Blob; filename: string } | null = null;

  async function getZip() {
    if (!zipCache) {
      const blob = await buildSessionZip(session);
      const filename = zipFilename(session.identifier, session.sessionType, session.createdAt);
      zipCache = { blob, filename };
    }
    return zipCache;
  }

  function statusLabel(status: SendStatusMap[SendActionKey]): string {
    switch (status) {
      case 'idle':
        return '';
      case 'sending':
        return 'Uploading…';
      case 'sent':
        return 'Sent ✓';
      case 'failed':
        return 'Failed — Retry';
    }
  }

  async function handleAction(key: SendActionKey) {
    statuses[key] = 'sending';
    draw();

    try {
      const { blob, filename } = await getZip();
      if (key === 'sharepoint') {
        await uploadZipToSharePoint(filename, blob);
      } else {
        await shareZipViaEmail(filename, blob);
      }
      statuses[key] = 'sent';
      await recordIdentifierSent(session.identifier, dateOnly(session.createdAt));
    } catch {
      statuses[key] = 'failed';
    }

    if (isSessionReadyToClear(statuses)) {
      await clearSession(session.id);
      draw();
      onDone();
      return;
    }

    draw();
  }

  function draw() {
    const summary = categoriesFor(session.sessionType)
      .map((c) => `<li>${c.label}: ${photoCountFor(session, c.key)}</li>`)
      .join('');

    container.innerHTML = `
      <h1>Review Session — ${session.identifier}</h1>
      <ul>${summary}</ul>
      <button id="send-sharepoint" ${statuses.sharepoint === 'sending' ? 'disabled' : ''}>
        Send to SharePoint ${statusLabel(statuses.sharepoint)}
      </button>
      <button id="send-email" ${statuses.email === 'sending' ? 'disabled' : ''}>
        Send via Email ${statusLabel(statuses.email)}
      </button>
    `;

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.addEventListener('click', () => {
      handleAction('sharepoint');
    });
    container.querySelector<HTMLButtonElement>('#send-email')!.addEventListener('click', () => {
      handleAction('email');
    });
  }

  draw();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/screens/reviewSendScreen.test.ts`
Expected: PASS (3 tests passed).

- [ ] **Step 5: Commit**

```bash
git add src/screens/reviewSendScreen.ts tests/screens/reviewSendScreen.test.ts
git commit -m "Add review and send screen with per-action retry and clear-on-success logic"
```

---

## Task 16: App Shell & Navigation

**Files:**
- Create: `src/app.ts`
- Modify: `src/main.ts`
- Test: `tests/app.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/app.test.ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app.test.ts`
Expected: FAIL — cannot find module `../src/app`.

- [ ] **Step 3: Create `src/app.ts`**

```ts
import type { Session, SessionType } from './types';
import { renderStartScreen } from './screens/startScreen';
import { renderIdentifierScreen } from './screens/identifierScreen';
import { renderChecklistHub } from './screens/checklistHub';
import { renderCaptureScreen } from './screens/captureScreen';
import { renderReviewSendScreen } from './screens/reviewSendScreen';

export type AppState =
  | { screen: 'start' }
  | { screen: 'identifier'; sessionType: SessionType }
  | { screen: 'hub'; session: Session }
  | { screen: 'capture'; session: Session; categoryKey: string }
  | { screen: 'review'; session: Session };

export function resolveInitialState(existing: Session | undefined): AppState {
  return existing ? { screen: 'hub', session: existing } : { screen: 'start' };
}

export function createApp(container: HTMLElement) {
  function navigate(state: AppState): void {
    container.innerHTML = '';
    switch (state.screen) {
      case 'start':
        renderStartScreen(container, (sessionType) => navigate({ screen: 'identifier', sessionType }));
        break;
      case 'identifier':
        renderIdentifierScreen(container, state.sessionType, (session) => navigate({ screen: 'hub', session }));
        break;
      case 'hub':
        renderChecklistHub(
          container,
          state.session,
          (categoryKey) => navigate({ screen: 'capture', session: state.session, categoryKey }),
          () => navigate({ screen: 'review', session: state.session })
        );
        break;
      case 'capture':
        renderCaptureScreen(container, state.session, state.categoryKey, (updatedSession) =>
          navigate({ screen: 'hub', session: updatedSession })
        );
        break;
      case 'review':
        renderReviewSendScreen(container, state.session, () => navigate({ screen: 'start' }));
        break;
    }
  }

  return { navigate };
}
```

- [ ] **Step 4: Replace `src/main.ts`**

```ts
import './styles.css';
import { createApp, resolveInitialState } from './app';
import { getActiveSession } from './session/sessionStore';

async function init() {
  const container = document.getElementById('app');
  if (!container) throw new Error('Missing #app container');
  const app = createApp(container);
  const existing = await getActiveSession();
  app.navigate(resolveInitialState(existing));
}

init();
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/app.test.ts`
Expected: PASS (2 tests passed).

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: all test files pass.

- [ ] **Step 7: Commit**

```bash
git add src/app.ts src/main.ts tests/app.test.ts
git commit -m "Wire screens together into a navigable app with session resume"
```

---

## Task 17: PWA Manifest & Icon

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icon.svg`

- [ ] **Step 1: Create `public/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" rx="24" fill="#1a1a1a" />
  <g fill="#ffffff">
    <rect x="36" y="66" width="120" height="80" rx="10" />
    <circle cx="96" cy="106" r="26" fill="#1a1a1a" />
    <rect x="74" y="52" width="44" height="18" rx="4" />
  </g>
</svg>
```

- [ ] **Step 2: Add the PWA plugin to `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Auction Photo Capture',
        short_name: 'AuctionPhotos',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1a1a1a',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

- [ ] **Step 3: Verify the build produces a manifest**

Run: `npm run build`
Expected: build succeeds; `dist/manifest.webmanifest` exists and references `icon.svg`.

Run: `npx vitest run`
Expected: all tests still pass (PWA plugin does not affect test config).

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts public/icon.svg
git commit -m "Add PWA manifest, install icon, and service worker registration"
```

---

## Task 18: Manual Device Test Checklist

**Files:**
- Create: `docs/testing/manual-device-checklist.md`

- [ ] **Step 1: Create `docs/testing/manual-device-checklist.md`**

```markdown
# Manual Device Test Checklist

Run this checklist on a real iPhone and a real Android phone before each release, and before the first rollout to coworkers. Automated tests cover the app's logic but cannot exercise the camera, share sheet, or a real Microsoft/SharePoint login.

## Setup
- [ ] App installed to the home screen from the deployed URL on both an iPhone and an Android phone.

## Vehicle session, happy path
- [ ] Start a new session, choose Vehicle, enter a Unit # using the numeric keypad.
- [ ] Take at least one photo in every required category (Front, Left Side, Right Side, Back, Tire, Interior, Speedometer).
- [ ] Take two photos in Left Side and confirm both appear as separate thumbnails.
- [ ] Add a Damages photo with a note, and confirm the note field appears only for Damages/Additional.
- [ ] Confirm "Finish Session" stays disabled until all required categories have at least one photo, then enables.

## Other Item session
- [ ] Start a new session, choose Other Item, enter a Lot # using the text keyboard (e.g. `LOT-A22`).
- [ ] Confirm the category list shown is Front, Left Side, Right Side, Back, Detail/Close-up, Damages, Additional (no Tire/Interior/Speedometer).

## Offline capture
- [ ] Turn on airplane mode mid-session, continue taking photos in remaining categories, confirm no errors and progress is retained.
- [ ] Close the app (or the tab) mid-session, reopen it, and confirm the in-progress session resumes with photos intact.

## Sending
- [ ] With connectivity restored, tap "Send to SharePoint," sign in with a real work account on first use, and confirm the zip appears in the target SharePoint folder.
- [ ] Tap "Send via Email," confirm the phone's native share sheet opens with the zip attached, and confirm sending completes.
- [ ] Turn on airplane mode, attempt a send, confirm it shows "Failed — Retry" and the session is not lost; turn connectivity back on and retry successfully.

## Duplicate identifier
- [ ] Start a second session on the same phone using an identifier already sent earlier that same day, and confirm the warning appears before a second confirmation is required.

## Cross-device
- [ ] Repeat the "Sending" section on the other phone platform (if the first pass was iPhone, repeat on Android, or vice versa).
```

- [ ] **Step 2: Commit**

```bash
git add docs/testing/manual-device-checklist.md
git commit -m "Add manual real-device test checklist"
```

---

## Task 19: Azure AD Registration Checklist

**Files:**
- Create: `docs/setup/azure-ad-registration.md`

- [ ] **Step 1: Create `docs/setup/azure-ad-registration.md`**

```markdown
# Azure AD App Registration Checklist (for IT)

This app uploads to SharePoint using each coworker's own Microsoft 365 login via Microsoft Graph. Before the app can do that, an Azure AD (Microsoft Entra) admin needs to complete this one-time, free setup.

## Steps

1. Go to the Azure Portal → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name: `Auction Photo Capture`.
3. Supported account types: **Accounts in this organizational directory only** (single tenant).
4. Under **Authentication**:
   - Add a platform of type **Single-page application (SPA)**.
   - Redirect URI: the deployed app's URL (e.g. `https://auction-photos.yourcompany.com`).
5. Under **API permissions**:
   - Add **Microsoft Graph** → **Delegated permissions** → `Sites.ReadWrite.All` (or a narrower permission scoped to the specific SharePoint site, if your security team prefers that).
   - Click **Grant admin consent for [organization]** so individual coworkers are never prompted to approve permissions themselves.
6. Copy the **Application (client) ID** and **Directory (tenant) ID** from the app registration's Overview page.
7. Identify the target SharePoint site and folder (e.g. a document library named "Auction Photos"), and get its **Site ID** via Microsoft Graph Explorer (`GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{site-path}`).

## Values to hand back to the development team

Fill in and return the following, which go into the app's `.env` file (see `.env.example`):

```
VITE_AZURE_CLIENT_ID=<Application (client) ID from step 6>
VITE_AZURE_TENANT_ID=<Directory (tenant) ID from step 6>
VITE_SHAREPOINT_SITE_ID=<Site ID from step 7>
VITE_SHAREPOINT_FOLDER_PATH=<folder path within the site's default drive, e.g. "Auction Photos">
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/setup/azure-ad-registration.md
git commit -m "Add Azure AD app registration checklist for IT"
```
