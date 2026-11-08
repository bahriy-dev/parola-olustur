'use client';

import { useEffect,useSyncExternalStore,type RefObject } from 'react';

const subscribe = () => () => {};

/** False while the server-rendered HTML is on screen without React; true once the page is hydrated. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/**
 * Text typed before hydration stays in the DOM, but React keeps the field's initial state, so the box shows one value
 * while the tool would compute with another (e.g. the hash of "" while "abc" is on screen). On mount, replay such a
 * value as a real input event so the component's onChange adopts it.
 */
export function useAdoptPreHydrationValue(ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || el.value === el.defaultValue) return;
    if (el instanceof HTMLInputElement && ['checkbox', 'radio', 'file'].includes(el.type)) return;
    const typed = el.value;
    // The instance setter is React's value tracker: resetting through it makes the replayed event count as a change.
    el.value = el.defaultValue;
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set?.call(el, typed);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, [ref]);
}
