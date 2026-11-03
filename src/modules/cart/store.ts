"use client";
import { useSyncExternalStore } from "react";
import {
  addLine,
  CART_KEY,
  readCart,
  serializeCart,
  type CartLine,
} from "./model";
const EMPTY = '{"version":1,"lines":[]}';
let fallback = EMPTY;
let writable = true;
const EVENT = "greenstore:cart";
function snapshot() {
  if (!writable) return fallback;
  try {
    return localStorage.getItem(CART_KEY) ?? EMPTY;
  } catch {
    return fallback;
  }
}
function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
function save(lines: CartLine[]) {
  fallback = serializeCart(lines);
  try {
    localStorage.setItem(CART_KEY, fallback);
    writable = true;
  } catch {
    writable = false;
  }
  window.dispatchEvent(new Event(EVENT));
}
export function useCart() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const persistent = useSyncExternalStore(
    subscribe,
    () => writable,
    () => true,
  );
  const lines = readCart(raw);
  return {
    lines,
    persistent,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    add: (id: string, quantity = 1) =>
      save(addLine(readCart(snapshot()), id, quantity)),
    setQuantity: (id: string, quantity: number) =>
      save(
        readCart(snapshot()).flatMap((line) =>
          line.variantId !== id
            ? [line]
            : quantity > 0
              ? [{ ...line, quantity }]
              : [],
        ),
      ),
    remove: (id: string) =>
      save(readCart(snapshot()).filter((line) => line.variantId !== id)),
  };
}
