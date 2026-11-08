'use client';
import { useCallback,useSyncExternalStore } from 'react';
const eventName='parola-preferences';
function subscribe(listener:()=>void) {window.addEventListener('storage',listener);window.addEventListener(eventName,listener);return ()=>{window.removeEventListener('storage',listener);window.removeEventListener(eventName,listener);};}
export function usePreference<T extends string>(key:string,fallback:T,allowed:readonly T[]) {
  const getSnapshot=()=>{try {const value=localStorage.getItem(key);return allowed.includes(value as T)?value as T:fallback;}catch{return fallback;}};
  const value=useSyncExternalStore(subscribe,getSnapshot,()=>fallback);
  const set=useCallback((next:T)=>{try{localStorage.setItem(key,next);window.dispatchEvent(new Event(eventName));}catch{/* Storage may be unavailable. */}},[key]);
  return [value,set] as const;
}
