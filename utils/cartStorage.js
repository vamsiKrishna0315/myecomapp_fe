"use client";

const CART_STORAGE_KEY = "cartData";

function parseStoredCart(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export function readStoredCart() {
  if (typeof window === "undefined") return [];
  return parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
}

export function getCartCount(items) {
  return items.length;
}

export function getCartTotal(items) {
  return items.reduce(
    (acc, item) => acc + parseFloat(item?.total_price || item?.line_total || item?.price || 0),
    0
  );
}

export function writeStoredCart(items) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(Array.isArray(items) ? items : []));
    window.dispatchEvent(new Event("cartStorageUpdated"));
  } catch (_) {
    // ignore storage failures
  }
}

export function clearStoredCart() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event("cartStorageUpdated"));
  } catch (_) {
    // ignore storage failures
  }
}

export function readCartSnapshot() {
  const items = readStoredCart();

  return {
    items,
    count: getCartCount(items),
    total: getCartTotal(items),
  };
}
