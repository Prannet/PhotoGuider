import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { photoCountFor } from '../session/session';
import { buildSessionZip } from '../zip/buildZip';
import { zipFilename, dateOnly } from '../naming';
import { uploadZipToSharePoint } from '../upload/sharepointUpload';
import { shareZipViaEmail } from '../upload/shareEmail';
import { clearSession, recordIdentifierSent } from '../session/sessionStore';
import { isSessionReadyToClear, type SendStatusMap, type SendActionKey } from '../session/sendStatus';
import { escapeHtml } from '../html';

export function renderReviewSendScreen(container: HTMLElement, session: Session, onDone: () => void): void {
  const statuses: SendStatusMap = { sharepoint: 'idle', email: 'idle' };
  let zipPromise: Promise<{ blob: Blob; filename: string }> | null = null;
  let confirmingDiscard = false;
  let discarding = false;

  function anySending(): boolean {
    return statuses.sharepoint === 'sending' || statuses.email === 'sending';
  }

  function getZip(): Promise<{ blob: Blob; filename: string }> {
    if (!zipPromise) {
      zipPromise = (async () => {
        const blob = await buildSessionZip(session);
        const filename = zipFilename(session.identifier, session.sessionType, session.createdAt);
        return { blob, filename };
      })();
    }
    return zipPromise;
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
    if (confirmingDiscard) {
      container.innerHTML = `
        <h1>Review Session — ${escapeHtml(session.identifier)}</h1>
        <p>Discard session? All photos will be lost.</p>
        <button id="cancel-discard-button">Cancel</button>
        <button id="confirm-discard-button">Discard</button>
      `;

      container.querySelector<HTMLButtonElement>('#cancel-discard-button')!.addEventListener('click', () => {
        if (discarding) return;
        confirmingDiscard = false;
        draw();
      });

      container.querySelector<HTMLButtonElement>('#confirm-discard-button')!.addEventListener('click', async () => {
        if (discarding) return;
        discarding = true;
        try {
          await clearSession(session.id);
          onDone();
        } finally {
          discarding = false;
        }
      });

      return;
    }

    const summary = categoriesFor(session.sessionType)
      .map((c) => `<li>${escapeHtml(c.label)}: ${photoCountFor(session, c.key)}</li>`)
      .join('');

    const anyFailed = statuses.sharepoint === 'failed' || statuses.email === 'failed';

    container.innerHTML = `
      <h1>Review Session — ${escapeHtml(session.identifier)}</h1>
      <ul>${summary}</ul>
      ${
        anyFailed
          ? '<p style="color:#b00020;">Send failed — check your connection and tap the button again to retry.</p>'
          : ''
      }
      <button id="send-sharepoint" ${statuses.sharepoint === 'sending' ? 'disabled' : ''}>
        Send to SharePoint ${statusLabel(statuses.sharepoint)}
      </button>
      <button id="send-email" ${statuses.email === 'sending' ? 'disabled' : ''}>
        Send via Email ${statusLabel(statuses.email)}
      </button>
      <button id="start-over-button" ${anySending() ? 'disabled' : ''}>Start Over</button>
    `;

    container.querySelector<HTMLButtonElement>('#send-sharepoint')!.addEventListener('click', () => {
      handleAction('sharepoint');
    });
    container.querySelector<HTMLButtonElement>('#send-email')!.addEventListener('click', () => {
      handleAction('email');
    });
    container.querySelector<HTMLButtonElement>('#start-over-button')!.addEventListener('click', () => {
      if (anySending()) return;
      confirmingDiscard = true;
      draw();
    });
  }

  draw();
}
