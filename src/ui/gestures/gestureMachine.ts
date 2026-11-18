import type { Rating } from '../../domain/types';

/** Schwellenwerte der Gestensteuerung, bewusst an einer Stelle gebündelt. */
export const GESTURE = {
  /** Horizontale Strecke in Pixeln, ab der eine Wischgeste auslöst. */
  swipeThresholdPx: 90,
  /** Zeitfenster in Millisekunden zwischen zwei Tipps eines Doppeltipps. */
  doubleTapWindowMs: 300,
  /** Bewegung in Pixeln, bis zu der ein Kontakt noch als Tipp gilt. */
  tapTolerancePx: 10,
} as const;

export interface PointerSample {
  x: number;
  y: number;
  time: number;
}

export interface GestureCallbacks {
  onRate: (rating: Rating) => void;
  /** Meldet, ob die Karte gerade berührt wird. */
  onHold: (held: boolean) => void;
  /** Doppeltipp: Übersetzung dauerhaft zeigen. */
  onPin: () => void;
  onDrag: (deltaX: number) => void;
}

export interface GestureMachine {
  pointerDown: (sample: PointerSample) => void;
  pointerMove: (sample: PointerSample) => void;
  pointerUp: (sample: PointerSample) => void;
  cancel: () => void;
  dispose: () => void;
}

interface Contact {
  startX: number;
  startY: number;
  moved: boolean;
}

/**
 * Wischen, Berühren und Doppeltipp als reine Zustandsmaschine.
 * Die Berührung wird unabhängig von Bewegung gemeldet, damit die Übersetzung
 * auch während des Wischens sichtbar bleibt.
 */
export function createGestureMachine(callbacks: GestureCallbacks): GestureMachine {
  let contact: Contact | undefined;
  let lastTapTime: number | undefined;

  const reset = (): void => {
    contact = undefined;
  };

  return {
    pointerDown(sample) {
      contact = { startX: sample.x, startY: sample.y, moved: false };
      callbacks.onHold(true);
    },

    pointerMove(sample) {
      if (contact === undefined) {
        return;
      }
      const deltaX = sample.x - contact.startX;
      const deltaY = sample.y - contact.startY;

      if (Math.abs(deltaX) > GESTURE.tapTolerancePx || Math.abs(deltaY) > GESTURE.tapTolerancePx) {
        contact.moved = true;
      }
      if (contact.moved) {
        callbacks.onDrag(deltaX);
      }
    },

    pointerUp(sample) {
      if (contact === undefined) {
        return;
      }
      const current = contact;
      const deltaX = sample.x - current.startX;

      if (Math.abs(deltaX) >= GESTURE.swipeThresholdPx) {
        callbacks.onHold(false);
        callbacks.onDrag(0);
        callbacks.onRate(deltaX > 0 ? 'known' : 'unknown');
        lastTapTime = undefined;
        reset();
        return;
      }

      // Unterhalb der Auslöseschwelle springt die Karte zurück, ohne zu bewerten.
      callbacks.onDrag(0);

      if (!current.moved) {
        const previous = lastTapTime;
        if (previous !== undefined && sample.time - previous <= GESTURE.doubleTapWindowMs) {
          lastTapTime = undefined;
          callbacks.onPin();
        } else {
          lastTapTime = sample.time;
        }
      } else {
        lastTapTime = undefined;
      }

      callbacks.onHold(false);
      reset();
    },

    cancel() {
      if (contact !== undefined) {
        callbacks.onDrag(0);
        callbacks.onHold(false);
      }
      lastTapTime = undefined;
      reset();
    },

    dispose() {
      reset();
    },
  };
}
