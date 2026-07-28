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
