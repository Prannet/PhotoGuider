import './styles.css';
import { createApp, resolveInitialState } from './app';
import { getActiveSession } from './session/sessionStore';

async function init() {
  const container = document.getElementById('app');
  if (!container) throw new Error('Missing #app container');
  const app = createApp(container);

  let existing;
  let resumeFailed = false;
  try {
    existing = await getActiveSession();
  } catch (error) {
    console.error('Failed to load the active session; starting a new one instead.', error);
    resumeFailed = true;
  }

  app.navigate(resolveInitialState(existing));

  if (resumeFailed) {
    container.insertAdjacentHTML(
      'afterbegin',
      '<p style="color:#b00020;">Could not resume your previous session — starting a new one instead.</p>'
    );
  }
}

init().catch((error) => {
  // Last-resort guard: if anything above still throws, avoid leaving the user
  // staring at a permanently blank screen with no feedback.
  console.error('Failed to initialize app', error);
  const container = document.getElementById('app');
  if (container) {
    container.innerHTML =
      '<p style="color:#b00020;">Something went wrong loading the app. Please reload the page.</p>';
  }
});
