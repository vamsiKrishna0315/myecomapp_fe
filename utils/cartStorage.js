"use client";

const CART_STORAGE_KEY = "cartData";
const CART_METADATA_KEY = "cartDataMeta";

function parseStoredCart(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function parseStoredMetadata(raw) {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function readStoredMetadata() {
  if (typeof window === "undefined") return {};
  return parseStoredMetadata(localStorage.getItem(CART_METADATA_KEY));
}

function writeStoredMetadata(metadata) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_METADATA_KEY, JSON.stringify(metadata));
  } catch (_) {
    // ignore storage failures
  }
}

function mergeCartMetadata(items, metadata = readStoredMetadata()) {
  return (Array.isArray(items) ? items : []).map((item) => {
    const meta = metadata?.[item?.id];

    if (!meta) {
      return item;
    }

    return {
      ...item,
      is_combo_item: meta.isCombo === true || item?.is_combo_item === true,
      combo_group_key: meta.comboGroupKey || item?.combo_group_key || null,
    };
  });
}

export function readStoredCart() {
  if (typeof window === "undefined") return [];
  const items = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
  return mergeCartMetadata(items);
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
    const normalizedItems = Array.isArray(items) ? items : [];
    const metadata = readStoredMetadata();
    const nextMetadata = {};

    normalizedItems.forEach((item) => {
      if (item?.id == null) return;

      if (metadata[item.id]) {
        nextMetadata[item.id] = metadata[item.id];
      }
    });

    writeStoredMetadata(nextMetadata);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mergeCartMetadata(normalizedItems, nextMetadata)));
    window.dispatchEvent(new Event("cartStorageUpdated"));
  } catch (_) {
    // ignore storage failures
  }
}

export function markStoredCartItemsAsCombo(matchers, comboGroupKey) {
  if (typeof window === "undefined") return [];

  const items = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
  const metadata = readStoredMetadata();
  const usedIds = new Set();
  const matchedIds = [];

  (Array.isArray(matchers) ? matchers : []).forEach((matcher) => {
    const matchedItem = items.find((item) => {
      if (item?.id == null || usedIds.has(item.id)) return false;

      return (
        Number(item.product_id) === Number(matcher.product_id) &&
        Number(item.quantity || 0) === Number(matcher.quantity || 0) &&
        String(item.quantity_unit || item.unit || "") === String(matcher.quantity_unit || matcher.unit || "")
      );
    });

    if (!matchedItem?.id) {
      return;
    }

    usedIds.add(matchedItem.id);
    matchedIds.push(matchedItem.id);
    metadata[matchedItem.id] = {
      ...(metadata[matchedItem.id] || {}),
      isCombo: true,
      comboGroupKey: comboGroupKey || null,
    };
  });

  writeStoredMetadata(metadata);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mergeCartMetadata(items, metadata)));
  window.dispatchEvent(new Event("cartStorageUpdated"));

  return matchedIds;
}

export function isComboCartItem(item) {
  return Boolean(item?.is_combo_item || item?.is_combo || item?.combo_group_key || item?.combo_id);
}

export function clearStoredCart() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_METADATA_KEY);
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
