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
