"use client";

import unitConversionService from "./unitConversion";

const SUPPORTED_UNITS = ["kg", "gram", "piece"];

export function getAllowedUnits(product) {
  const allowedUnits = Array.isArray(product?.allowed_units)
    ? product.allowed_units.filter((unit) => SUPPORTED_UNITS.includes(unit))
    : [];

  if (allowedUnits.length > 0) {
    return allowedUnits;
  }

  if (SUPPORTED_UNITS.includes(product?.base_price_unit)) {
    return [product.base_price_unit];
  }

  return ["kg"];
}

export function getInitialUnit(product) {
  const allowedUnits = getAllowedUnits(product);

  if (allowedUnits.includes(product?.base_price_unit)) {
    return product.base_price_unit;
  }

  return allowedUnits[0] || "kg";
}

export function getDisplayPrice(product, selectedUnit) {
  const basePrice = parseFloat(product?.price || 0);
  const baseUnit = product?.base_price_unit;
  const targetUnit = selectedUnit || getInitialUnit(product);

  if (!baseUnit || baseUnit === targetUnit) {
    return basePrice;
  }

  try {
    return unitConversionService.calculatePrice(
      basePrice,
      baseUnit,
      targetUnit,
      product?.grams_per_piece != null ? parseFloat(product.grams_per_piece) : null
    );
  } catch (_) {
    return basePrice;
  }
}

export function getUnitText(unit) {
  // Use unitConversionService labels for human-friendly display
  try {
    return unitConversionService.getUnitLabel(unit) || unit || "unit";
  } catch (_) {
    return unit || "unit";
  }
}

export function resolveCartProduct(item, productIndex) {
  return item?.product || productIndex?.get?.(item?.product_id) || null;
}

export function getCartUnitPrice(item, productIndex) {
  const product = resolveCartProduct(item, productIndex);
  // Prefer explicit item.unit (new field), then quantity_unit, then weight_unit
  const selectedUnit = item?.quantity_unit || item?.unit || item?.weight_unit || getInitialUnit(product);

  if (product) {
    return getDisplayPrice(product, selectedUnit);
  }

  return parseFloat(item?.unit_price || item?.price || 0);
}

export function getCartLineTotal(item, productIndex) {
  const quantity = parseFloat(item?.quantity || 0);
  const unitPrice = getCartUnitPrice(item, productIndex);

  if (quantity > 0) {
    return quantity * unitPrice;
  }

  return parseFloat(item?.total_price || item?.line_total || item?.price || 0);
}
