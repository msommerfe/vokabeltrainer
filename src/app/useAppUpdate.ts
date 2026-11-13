import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/** Meldet, wenn eine neue Version bereitsteht, und übernimmt sie auf Wunsch. */
export function useAppUpdate(): { updateReady: boolean; applyUpdate: () => void } {
  const [updateReady, setUpdateReady] = useState(false);
  const [update, setUpdate] = useState<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateReady(true);
        setUpdate(() => () => updateSW(true));
      },
    });
  }, []);

  return {
    updateReady,
    applyUpdate: () => {
      void update?.();
    },
  };
}
