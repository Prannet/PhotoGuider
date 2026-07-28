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
