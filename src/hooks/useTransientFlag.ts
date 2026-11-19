import { useCallback, useEffect, useRef, useState } from 'react';

/** A boolean that turns on when triggered and switches itself off after `duration` ms. */
export function useTransientFlag(duration = 1500): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const trigger = useCallback(() => {
    setActive(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), duration);
  }, [duration]);

  return [active, trigger];
}
