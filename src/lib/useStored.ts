"use client";

import { useSyncExternalStore } from "react";
import { BRAND_KEY } from "@/lib/brand";

const EVENT = `${BRAND_KEY}:storage`;

export const storageKey = (name: string) => `${BRAND_KEY}.${name}`;

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

// Reads a localStorage key without a setState-in-effect; null on the server and when storage is blocked.
export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
}

export function setStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
