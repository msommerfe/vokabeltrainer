import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Rating } from '../../domain/types';
import { createGestureMachine, GESTURE } from './gestureMachine';

export interface CardGestureHandlers {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
}

export interface CardGestures {
  dragX: number;
  handlers: CardGestureHandlers;
}

/** Bindet die Gestenmaschine an Pointer-Events einer Karte. */
export function useCardGestures(options: {
  onRate: (rating: Rating) => void;
  onHold: (held: boolean) => void;
  onPin: () => void;
}): CardGestures {
  const [dragX, setDragX] = useState(0);

  // Die Maschine wird einmal erzeugt; die jeweils aktuellen Callbacks liegen in einer Ref.
  const latest = useRef(options);
  latest.current = options;

  const machine = useMemo(
    () =>
      createGestureMachine({
        onRate: (rating) => latest.current.onRate(rating),
        onHold: (held) => latest.current.onHold(held),
        onPin: () => latest.current.onPin(),
        onDrag: setDragX,
      }),
    [],
  );

  useEffect(() => machine.dispose, [machine]);

  const sample = (event: React.PointerEvent<HTMLElement>) => ({
    x: event.clientX,
    y: event.clientY,
    time: event.timeStamp,
  });

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Pointer Capture fehlt in manchen Umgebungen (z. B. jsdom) und ist nicht zwingend.
      event.currentTarget.setPointerCapture?.(event.pointerId);
      machine.pointerDown(sample(event));
    },
    [machine],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      machine.pointerMove(sample(event));
    },
    [machine],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const target = event.currentTarget;
      if (target.hasPointerCapture?.(event.pointerId) === true) {
        target.releasePointerCapture(event.pointerId);
      }
      machine.pointerUp(sample(event));
    },
    [machine],
  );

  const onPointerCancel = useCallback(() => {
    machine.cancel();
  }, [machine]);

  // Verhindert das Systemmenü, das sonst die gehaltene Berührung unterbricht.
  const onContextMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  return {
    dragX,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu },
  };
}

export { GESTURE };
