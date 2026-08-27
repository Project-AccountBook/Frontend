import { useEffect, useRef } from 'react';

type BackHandler = () => boolean;

const stack: BackHandler[] = [];

export function pushBackHandler(handler: BackHandler): () => void {
  stack.push(handler);
  return () => {
    const idx = stack.lastIndexOf(handler);
    if (idx >= 0) stack.splice(idx, 1);
  };
}

/** Returns true if a handler consumed the back press. */
export function consumeBack(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i]()) return true;
  }
  return false;
}

/**
 * Register a hardware-back handler while `enabled` is true.
 * Return true to consume (stay in app), false to let the next handler / exit run.
 */
export function useBackHandler(enabled: boolean, handler: () => boolean) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    return pushBackHandler(() => handlerRef.current());
  }, [enabled]);
}
