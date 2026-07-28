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
  if (!existing) return { screen: 'start' };
  if (existing.status === 'complete') return { screen: 'review', session: existing };
  return { screen: 'hub', session: existing };
}

export function createApp(container: HTMLElement) {
  function navigate(state: AppState): void {
    container.innerHTML = '';
    switch (state.screen) {
      case 'start':
        renderStartScreen(container, (sessionType) => navigate({ screen: 'identifier', sessionType }));
        break;
      case 'identifier':
        renderIdentifierScreen(
          container,
          state.sessionType,
          (session) => navigate({ screen: 'hub', session }),
          () => navigate({ screen: 'start' })
        );
        break;
      case 'hub':
        renderChecklistHub(
          container,
          state.session,
          (categoryKey) => navigate({ screen: 'capture', session: state.session, categoryKey }),
          (updatedSession) => navigate({ screen: 'review', session: updatedSession }),
          () => navigate({ screen: 'start' })
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
