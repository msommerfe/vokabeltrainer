import type { Rating } from '../../domain/types';

/** Schwellenwerte der Gestensteuerung, bewusst an einer Stelle gebündelt. */
export const GESTURE = {
  /** Horizontale Strecke in Pixeln, ab der eine Wischgeste auslöst. */
  swipeThresholdPx: 90,
  /** Haltedauer in Millisekunden, ab der ein langer Druck aufdeckt. */
  longPressMs: 500,
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
  onReveal: () => void;
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
 * Wischen, langer Druck und Doppeltipp als reine Zustandsmaschine.
 * Langer Druck und Wischen schließen sich aus: Sobald die Bewegung die
 * Tipp-Toleranz überschreitet, wird der Timer verworfen.
 */
export function createGestureMachine(callbacks: GestureCallbacks): GestureMachine {
  let contact: Contact | undefined;
  let longPressTimer: ReturnType<typeof setTimeout> | undefined;
  let revealedByLongPress = false;
  let lastTapTime: number | undefined;

  const clearLongPress = (): void => {
    if (longPressTimer !== undefined) {
      clearTimeout(longPressTimer);
      longPressTimer = undefined;
    }
  };

  const reset = (): void => {
    clearLongPress();
    contact = undefined;
    revealedByLongPress = false;
  };

  return {
    pointerDown(sample) {
      contact = { startX: sample.x, startY: sample.y, moved: false };
      revealedByLongPress = false;
      clearLongPress();
      longPressTimer = setTimeout(() => {
        longPressTimer = undefined;
        if (contact !== undefined && !contact.moved) {
          revealedByLongPress = true;
          callbacks.onReveal();
        }
      }, GESTURE.longPressMs);
    },

    pointerMove(sample) {
      if (contact === undefined) {
        return;
      }
      const deltaX = sample.x - contact.startX;
      const deltaY = sample.y - contact.startY;

      if (Math.abs(deltaX) > GESTURE.tapTolerancePx || Math.abs(deltaY) > GESTURE.tapTolerancePx) {
        contact.moved = true;
        clearLongPress();
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
      clearLongPress();

      if (Math.abs(deltaX) >= GESTURE.swipeThresholdPx) {
        callbacks.onDrag(0);
        callbacks.onRate(deltaX > 0 ? 'known' : 'unknown');
        lastTapTime = undefined;
        reset();
        return;
      }

      // Unterhalb der Auslöseschwelle springt die Karte zurück, ohne zu bewerten.
      callbacks.onDrag(0);

      const wasTap = !current.moved && !revealedByLongPress;
      if (wasTap) {
        const previous = lastTapTime;
        if (previous !== undefined && sample.time - previous <= GESTURE.doubleTapWindowMs) {
          lastTapTime = undefined;
          callbacks.onReveal();
        } else {
          lastTapTime = sample.time;
        }
      } else {
        lastTapTime = undefined;
      }

      reset();
    },

    cancel() {
      if (contact !== undefined) {
        callbacks.onDrag(0);
      }
      lastTapTime = undefined;
      reset();
    },

    dispose() {
      reset();
    },
  };
}
