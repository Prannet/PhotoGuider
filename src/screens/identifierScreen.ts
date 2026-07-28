import type { Session, SessionType, IdentifierType } from '../types';
import { createSession } from '../session/session';
import { saveSession, wasIdentifierUsedToday } from '../session/sessionStore';
import { sanitizeIdentifier, dateOnly } from '../naming';

export function renderIdentifierScreen(
  container: HTMLElement,
  sessionType: SessionType,
  onCreated: (session: Session) => void,
  onStartOver: () => void
): void {
  let identifierType: IdentifierType = 'unit';
  let confirmedIdentifier: string | null = null;
  let isSubmitting = false;

  function draw() {
    container.innerHTML = `
      <h1>Enter ${sessionType === 'vehicle' ? 'Vehicle' : 'Item'} Identifier</h1>
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <button data-type="unit" aria-pressed="${identifierType === 'unit'}">Unit #</button>
        <button data-type="lot" aria-pressed="${identifierType === 'lot'}">Name</button>
      </div>
      <input
        id="identifier-input"
        type="${identifierType === 'unit' ? 'tel' : 'text'}"
        placeholder="${identifierType === 'unit' ? 'e.g. 11802' : 'e.g. Oak Dresser'}"
      />
      <p id="identifier-warning" style="color:#b00020; display:none;"></p>
      <button id="continue-button">Continue</button>
      <button id="start-over-button">Start Over</button>
    `;

    container.querySelector<HTMLButtonElement>('[data-type="unit"]')!.addEventListener('click', () => {
      if (isSubmitting) return;
      identifierType = 'unit';
      draw();
    });
    container.querySelector<HTMLButtonElement>('[data-type="lot"]')!.addEventListener('click', () => {
      if (isSubmitting) return;
      identifierType = 'lot';
      draw();
    });

    container.querySelector<HTMLButtonElement>('#start-over-button')!.addEventListener('click', () => {
      if (isSubmitting) return;
      onStartOver();
    });

    container.querySelector<HTMLButtonElement>('#continue-button')!.addEventListener('click', async () => {
      if (isSubmitting) return;
      isSubmitting = true;
      try {
        const input = container.querySelector<HTMLInputElement>('#identifier-input')!;
        const warning = container.querySelector<HTMLParagraphElement>('#identifier-warning')!;
        const raw = input.value.trim();

        // NOTE: check that the SANITIZED value is non-empty, not just the raw
        // input — an input like "---" is non-empty raw text but sanitizes to ''.
        const clean = sanitizeIdentifier(raw);
        if (!clean) {
          warning.textContent = 'Please enter an identifier.';
          warning.style.display = 'block';
          return;
        }

        const today = dateOnly(new Date().toISOString());
        const usedToday = await wasIdentifierUsedToday(clean, today);

        if (usedToday && confirmedIdentifier !== clean) {
          warning.textContent = `A session for ${clean} already exists today. Click Continue again to proceed anyway.`;
          warning.style.display = 'block';
          confirmedIdentifier = clean;
          return;
        }

        const session = createSession(sessionType, identifierType, clean);
        await saveSession(session);
        onCreated(session);
      } finally {
        isSubmitting = false;
      }
    });
  }

  draw();
}
