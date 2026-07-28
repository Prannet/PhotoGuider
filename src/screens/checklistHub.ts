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
