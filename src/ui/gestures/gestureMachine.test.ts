import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGestureMachine, GESTURE, type GestureCallbacks } from './gestureMachine';

function setup() {
  const callbacks: GestureCallbacks = {
    onRate: vi.fn(),
    onReveal: vi.fn(),
    onDrag: vi.fn(),
  };
  return { callbacks, machine: createGestureMachine(callbacks) };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Wischen', () => {
  it('wertet eine Wischgeste nach rechts als "gewusst"', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerMove({ x: 100 + GESTURE.swipeThresholdPx, y: 200, time: 50 });
    machine.pointerUp({ x: 100 + GESTURE.swipeThresholdPx, y: 200, time: 60 });

    expect(callbacks.onRate).toHaveBeenCalledExactlyOnceWith('known');
  });

  it('wertet eine Wischgeste nach links als "nicht gewusst"', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 300, y: 200, time: 0 });
    machine.pointerMove({ x: 300 - GESTURE.swipeThresholdPx, y: 200, time: 50 });
    machine.pointerUp({ x: 300 - GESTURE.swipeThresholdPx, y: 200, time: 60 });

    expect(callbacks.onRate).toHaveBeenCalledExactlyOnceWith('unknown');
  });

  it('folgt dem Finger während der Bewegung', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerMove({ x: 140, y: 200, time: 30 });

    expect(callbacks.onDrag).toHaveBeenCalledWith(40);
  });
});

describe('abgebrochene Wischgeste', () => {
  it('bewertet unterhalb der Auslöseschwelle nicht und setzt die Karte zurück', () => {
    const { callbacks, machine } = setup();
    const belowThreshold = GESTURE.swipeThresholdPx - 1;

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerMove({ x: 100 + belowThreshold, y: 200, time: 40 });
    machine.pointerUp({ x: 100 + belowThreshold, y: 200, time: 50 });

    expect(callbacks.onRate).not.toHaveBeenCalled();
    expect(callbacks.onDrag).toHaveBeenLastCalledWith(0);
  });

  it('bewertet nach einem Abbruch der Geste nicht', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerMove({ x: 250, y: 200, time: 40 });
    machine.cancel();

    expect(callbacks.onRate).not.toHaveBeenCalled();
    expect(callbacks.onDrag).toHaveBeenLastCalledWith(0);
  });
});

describe('langer Druck', () => {
  it('deckt nach der Haltedauer auf', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    vi.advanceTimersByTime(GESTURE.longPressMs);

    expect(callbacks.onReveal).toHaveBeenCalledOnce();
  });

  it('deckt kurz vor Ablauf der Haltedauer noch nicht auf', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    vi.advanceTimersByTime(GESTURE.longPressMs - 1);

    expect(callbacks.onReveal).not.toHaveBeenCalled();
  });

  it('verwirft den Timer, sobald die Bewegung die Tipp-Toleranz überschreitet', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerMove({ x: 100 + GESTURE.swipeThresholdPx, y: 200, time: 100 });
    vi.advanceTimersByTime(GESTURE.longPressMs);

    expect(callbacks.onReveal).not.toHaveBeenCalled();
  });

  it('deckt bei einer Bewegung innerhalb der Tipp-Toleranz weiterhin auf', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerMove({ x: 100 + GESTURE.tapTolerancePx, y: 200, time: 100 });
    vi.advanceTimersByTime(GESTURE.longPressMs);

    expect(callbacks.onReveal).toHaveBeenCalledOnce();
  });

  it('wertet das Loslassen nach einem langen Druck nicht als Tipp', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    vi.advanceTimersByTime(GESTURE.longPressMs);
    machine.pointerUp({ x: 100, y: 200, time: GESTURE.longPressMs });
    machine.pointerDown({ x: 100, y: 200, time: GESTURE.longPressMs + 10 });
    machine.pointerUp({ x: 100, y: 200, time: GESTURE.longPressMs + 20 });

    expect(callbacks.onReveal).toHaveBeenCalledOnce();
  });
});

describe('Doppeltipp', () => {
  it('deckt bei zwei Tipps ohne nennenswerte Bewegung auf', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });
    machine.pointerDown({ x: 102, y: 201, time: 120 });
    machine.pointerUp({ x: 102, y: 201, time: 160 });

    expect(callbacks.onReveal).toHaveBeenCalledOnce();
  });

  it('deckt bei einem einzelnen Tipp nicht auf', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });

    expect(callbacks.onReveal).not.toHaveBeenCalled();
  });

  it('deckt nicht auf, wenn der zweite Tipp zu spät kommt', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });
    const tooLate = 40 + GESTURE.doubleTapWindowMs + 1;
    machine.pointerDown({ x: 100, y: 200, time: tooLate - 10 });
    machine.pointerUp({ x: 100, y: 200, time: tooLate });

    expect(callbacks.onReveal).not.toHaveBeenCalled();
  });

  it('deckt nicht auf, wenn zwischen den Tipps gewischt wurde', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });
    machine.pointerDown({ x: 100, y: 200, time: 80 });
    machine.pointerMove({ x: 100 + GESTURE.swipeThresholdPx, y: 200, time: 100 });
    machine.pointerUp({ x: 100 + GESTURE.swipeThresholdPx, y: 200, time: 120 });
    machine.pointerDown({ x: 100, y: 200, time: 140 });
    machine.pointerUp({ x: 100, y: 200, time: 160 });

    expect(callbacks.onReveal).not.toHaveBeenCalled();
  });
});
