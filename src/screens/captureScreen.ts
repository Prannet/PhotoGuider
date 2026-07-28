import type { Session } from '../types';
import { categoriesFor } from '../constants';
import { addPhoto } from '../session/session';
import { saveSession } from '../session/sessionStore';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderCaptureScreen(
  container: HTMLElement,
  initialSession: Session,
  categoryKey: string,
  onDone: (session: Session) => void
): void {
  let session = initialSession;
  let storageWarning = false;
  const category = categoriesFor(session.sessionType).find((c) => c.key === categoryKey)!;
  const photoUrls = new Map<string, string>();

  function photosInCategory() {
    return session.photos.filter((p) => p.categoryKey === categoryKey);
  }

  function urlForPhoto(photo: { id: string; blob: Blob }): string {
    let url = photoUrls.get(photo.id);
    if (!url) {
      url = URL.createObjectURL(photo.blob);
      photoUrls.set(photo.id, url);
    }
    return url;
  }

  function revokePhotoUrl(photoId: string): void {
    const url = photoUrls.get(photoId);
    if (url) {
      URL.revokeObjectURL(url);
      photoUrls.delete(photoId);
    }
  }

  function revokeAllPhotoUrls(): void {
    for (const photoId of Array.from(photoUrls.keys())) {
      revokePhotoUrl(photoId);
    }
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
      .map((photo) => {
        const photoId = escapeHtml(photo.id);
        return `
          <div class="thumb" data-photo-id="${photoId}">
            <img src="${urlForPhoto(photo)}" alt="${escapeHtml(category.label)} photo" />
            <button data-remove="${photoId}" aria-label="Remove photo">&times;</button>
            ${
              category.allowNotes
                ? `<input data-note="${photoId}" placeholder="Note (optional)" value="${escapeHtml(photo.note ?? '')}" />`
                : ''
            }
          </div>
        `;
      })
      .join('');

    container.innerHTML = `
      <h1>${escapeHtml(category.label)}</h1>
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
        revokePhotoUrl(photoId);
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
      revokeAllPhotoUrls();
      onDone(session);
    });
  }

  draw();
}
