import { describe, expect, it, vi } from 'vitest';
import { createGestureMachine, GESTURE, type GestureCallbacks } from './gestureMachine';

function setup() {
  const callbacks = {
    onRate: vi.fn<GestureCallbacks['onRate']>(),
    onHold: vi.fn<GestureCallbacks['onHold']>(),
    onPin: vi.fn<GestureCallbacks['onPin']>(),
    onDrag: vi.fn<GestureCallbacks['onDrag']>(),
  };
  return { callbacks, machine: createGestureMachine(callbacks) };
}

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

describe('Berühren', () => {
  it('meldet die Berührung sofort, ohne Wartezeit', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });

    expect(callbacks.onHold).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('meldet das Loslassen', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 800 });

    expect(callbacks.onHold).toHaveBeenLastCalledWith(false);
    expect(callbacks.onPin).not.toHaveBeenCalled();
  });

  it('meldet das Ende der Berührung auch bei einem Abbruch', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.cancel();

    expect(callbacks.onHold).toHaveBeenLastCalledWith(false);
  });

  it('hält die Berührung während einer Wischbewegung aufrecht und bewertet trotzdem', () => {
    const { callbacks, machine } = setup();
    const end = 100 + GESTURE.swipeThresholdPx;

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerMove({ x: 140, y: 200, time: 20 });
    machine.pointerMove({ x: end, y: 200, time: 40 });

    expect(callbacks.onHold).toHaveBeenCalledExactlyOnceWith(true);

    machine.pointerUp({ x: end, y: 200, time: 50 });

    expect(callbacks.onRate).toHaveBeenCalledExactlyOnceWith('known');
    expect(callbacks.onHold).toHaveBeenLastCalledWith(false);
  });
});

describe('Doppeltipp', () => {
  it('fixiert die Anzeige bei zwei Tipps ohne nennenswerte Bewegung', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });
    machine.pointerDown({ x: 102, y: 201, time: 120 });
    machine.pointerUp({ x: 102, y: 201, time: 160 });

    expect(callbacks.onPin).toHaveBeenCalledOnce();
  });

  it('fixiert bei einem einzelnen Tipp nicht', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });

    expect(callbacks.onPin).not.toHaveBeenCalled();
  });

  it('fixiert nicht, wenn der zweite Tipp zu spät kommt', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });
    const tooLate = 40 + GESTURE.doubleTapWindowMs + 1;
    machine.pointerDown({ x: 100, y: 200, time: tooLate - 10 });
    machine.pointerUp({ x: 100, y: 200, time: tooLate });

    expect(callbacks.onPin).not.toHaveBeenCalled();
  });

  it('fixiert nicht, wenn zwischen den Tipps gewischt wurde', () => {
    const { callbacks, machine } = setup();

    machine.pointerDown({ x: 100, y: 200, time: 0 });
    machine.pointerUp({ x: 100, y: 200, time: 40 });
    machine.pointerDown({ x: 100, y: 200, time: 80 });
    machine.pointerMove({ x: 100 + GESTURE.swipeThresholdPx, y: 200, time: 100 });
    machine.pointerUp({ x: 100 + GESTURE.swipeThresholdPx, y: 200, time: 120 });
    machine.pointerDown({ x: 100, y: 200, time: 140 });
    machine.pointerUp({ x: 100, y: 200, time: 160 });

    expect(callbacks.onPin).not.toHaveBeenCalled();
  });
});
