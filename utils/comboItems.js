"use client";

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveNumber(value, fallback = null) {
  const parsed = toNumber(value);
  return parsed != null && parsed > 0 ? parsed : fallback;
}

function toText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function pickNumber(source, keys) {
  for (const key of keys) {
    const parsed = toNumber(source?.[key]);
    if (parsed != null) {
      return parsed;
    }
  }

  return null;
}

function pickText(source, keys) {
  for (const key of keys) {
    const value = toText(source?.[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeComboItemObject(item, index) {
  const productId = pickNumber(item, ["product_id", "productId", "id"]);

  if (!Number.isInteger(productId)) {
    return null;
  }

  return {
    id: item?.id ?? `${productId}-${index}`,
    product_id: productId,
    name: pickText(item, ["name", "product_name", "title"]),
    weight: pickNumber(item, ["weight", "fixed_weight", "weight_value"]),
    weight_unit: pickText(item, ["weight_unit", "weightUnit", "unit"]),
    quantity: toPositiveNumber(pickNumber(item, ["quantity", "count", "qty"]), 1),
    price: pickNumber(item, ["price", "fixed_price", "combo_price"]),
    price_per_unit: pickNumber(item, ["price_per_unit", "unit_price"]),
    total_price: pickNumber(item, ["total_price", "line_total", "amount"]),
  };
}

export function normalizeComboItems(combo, fallbackProductIds = []) {
  if (!combo || typeof combo !== "object") {
    return [];
  }

  if (Array.isArray(combo.combo_items) && combo.combo_items.length > 0) {
    return combo.combo_items
      .map((item, index) => normalizeComboItemObject(item, index))
      .filter(Boolean);
  }

  const productIds = Array.isArray(combo.product_ids) && combo.product_ids.length > 0 ? combo.product_ids : fallbackProductIds;
  const weights = Array.isArray(combo.weights) ? combo.weights : [];
  const weightUnits = Array.isArray(combo.weight_units) ? combo.weight_units : [];
  const quantities = Array.isArray(combo.quantities) ? combo.quantities : [];
  const prices =
    (Array.isArray(combo.prices) && combo.prices) ||
    (Array.isArray(combo.product_prices) && combo.product_prices) ||
    (Array.isArray(combo.combo_prices) && combo.combo_prices) ||
    [];
  const unitPrices =
    (Array.isArray(combo.price_per_unit) && combo.price_per_unit) ||
    (Array.isArray(combo.unit_prices) && combo.unit_prices) ||
    [];
  const totalPrices =
    (Array.isArray(combo.total_prices) && combo.total_prices) ||
    (Array.isArray(combo.line_totals) && combo.line_totals) ||
    [];

  return productIds
    .map((productId, index) => {
      const parsedProductId = toNumber(productId);
      if (!Number.isInteger(parsedProductId)) {
        return null;
      }

      return {
        id: `${parsedProductId}-${index}`,
        product_id: parsedProductId,
        name: "",
        weight: pickNumber({ value: weights[index] }, ["value"]),
        weight_unit: pickText({ value: weightUnits[index] }, ["value"]),
        quantity: toPositiveNumber(pickNumber({ value: quantities[index] }, ["value"]), 1),
        price: pickNumber({ value: prices[index] }, ["value"]),
        price_per_unit: pickNumber({ value: unitPrices[index] }, ["value"]),
        total_price: pickNumber({ value: totalPrices[index] }, ["value"]),
      };
    })
    .filter(Boolean);
}

export function getComboItemUnit(comboItem, productFallbackUnit = "kg") {
  return comboItem?.weight_unit || productFallbackUnit;
}

export function getComboItemCartQuantity(comboItem) {
  const quantityCount = toPositiveNumber(comboItem?.quantity, 1);
  const weight = toPositiveNumber(comboItem?.weight, null);

  if (weight != null) {
    return quantityCount * weight;
  }

  return quantityCount;
}

export function getComboItemDisplayText(comboItem) {
  const quantityCount = toPositiveNumber(comboItem?.quantity, 1);
  const weight = toPositiveNumber(comboItem?.weight, null);
  const unit = toText(comboItem?.weight_unit);

  if (weight != null && unit) {
    return `${quantityCount} x ${weight.toFixed(2)} ${unit}`;
  }

  if (weight != null) {
    return `${quantityCount} x ${weight.toFixed(2)}`;
  }

  return `${quantityCount} item${quantityCount > 1 ? "s" : ""}`;
}
