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
