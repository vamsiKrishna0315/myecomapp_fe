import { useState, useCallback } from 'react';
import unitConversionService from '../utils/unitConversion';

/**
 * Custom hook for managing unit selection and price calculation
 */
export const useUnitSelection = (product) => {
  const [selectedUnit, setSelectedUnit] = useState(
    product?.base_price_unit || 
    (Array.isArray(product?.allowed_units) && product?.allowed_units[0]) ||
    'kg'
  );
  
  const [displayPrice, setDisplayPrice] = useState(
    calculatePrice(product, product?.base_price_unit || product?.allowed_units?.[0] || 'kg')
  );

  function calculatePrice(prod, unit) {
    if (!prod) return 0;

    try {
        // Ensure numeric types
        const basePrice = parseFloat(prod.price || 0);
        const baseUnit = prod.base_price_unit;
        const gramsPerPiece = prod.grams_per_piece != null ? parseFloat(prod.grams_per_piece) : null;

        let price = basePrice;

        // If the unit is different from base_price_unit, convert the price using the canonical service
        if (unit && baseUnit && unit !== baseUnit) {
          price = unitConversionService.calculatePrice(basePrice, String(baseUnit), String(unit), gramsPerPiece);
      }

        return parseFloat(Number(price).toFixed(2));
    } catch (error) {
      console.error("Error calculating price:", error);
        return parseFloat(prod.price || 0);
    }
  }

  const handleUnitChange = useCallback((newUnit) => {
    setSelectedUnit(newUnit);
    setDisplayPrice(calculatePrice(product, newUnit));
  }, [product]);

  const allowedUnits = Array.isArray(product?.allowed_units) 
    ? product?.allowed_units 
    : ['kg'];

  return {
    selectedUnit,
    displayPrice,
    allowedUnits,
    handleUnitChange,
  };
};

export default useUnitSelection;
