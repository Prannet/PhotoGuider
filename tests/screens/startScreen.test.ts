import { describe, it, expect, vi } from 'vitest';
import { renderStartScreen } from '../../src/screens/startScreen';

describe('renderStartScreen', () => {
  it('renders Vehicle and Other Item choices', () => {
    const container = document.createElement('div');
    renderStartScreen(container, vi.fn());

    expect(container.querySelector('[data-choice="vehicle"]')).not.toBeNull();
    expect(container.querySelector('[data-choice="other"]')).not.toBeNull();
  });

  it('calls onChoose with "vehicle" when the Vehicle button is clicked', () => {
    const container = document.createElement('div');
    const onChoose = vi.fn();
    renderStartScreen(container, onChoose);

    container.querySelector<HTMLButtonElement>('[data-choice="vehicle"]')!.click();

    expect(onChoose).toHaveBeenCalledWith('vehicle');
  });

  it('calls onChoose with "other" when the Other Item button is clicked', () => {
    const container = document.createElement('div');
    const onChoose = vi.fn();
    renderStartScreen(container, onChoose);

    container.querySelector<HTMLButtonElement>('[data-choice="other"]')!.click();

    expect(onChoose).toHaveBeenCalledWith('other');
  });
});
