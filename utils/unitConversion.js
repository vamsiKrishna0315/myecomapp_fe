/**
 * Unit Conversion Service for Frontend
 * Mirrors the Laravel backend UnitConversionService
 */

export const unitConversionService = {
  /**
   * Convert quantity from one unit to another
   */
  convert(quantity, fromUnit, toUnit, gramsPerPiece = null) {
    if (fromUnit === toUnit) {
      return quantity;
    }

    // Convert to grams as intermediate unit
    const grams = this.toGrams(quantity, fromUnit, gramsPerPiece);

    // Convert from grams to target unit
    return this.fromGrams(grams, toUnit, gramsPerPiece);
  },

  /**
   * Calculate unit price based on base price unit and requested unit
   */
  calculatePrice(basePrice, baseUnit, requestedUnit, gramsPerPiece = null) {
    if (baseUnit === requestedUnit) {
      return basePrice;
    }

    // If base is kg and requested is gram: price per gram = price per kg / 1000
    if (baseUnit === 'kg' && requestedUnit === 'gram') {
      return basePrice / 1000;
    }

    // If base is gram and requested is kg: price per kg = price per gram * 1000
    if (baseUnit === 'gram' && requestedUnit === 'kg') {
      return basePrice * 1000;
    }

    // If base is kg and requested is piece: use grams per piece
    if (baseUnit === 'kg' && requestedUnit === 'piece') {
      if (gramsPerPiece === null) {
        throw new Error('grams_per_piece is required for piece conversion');
      }
      return (basePrice / 1000) * gramsPerPiece;
    }

    // If base is gram and requested is piece: use grams per piece
    if (baseUnit === 'gram' && requestedUnit === 'piece') {
      if (gramsPerPiece === null) {
        throw new Error('grams_per_piece is required for piece conversion');
      }
      return basePrice * gramsPerPiece;
    }

    // If base is piece and requested is kg: convert via grams
    if (baseUnit === 'piece' && requestedUnit === 'kg') {
      if (gramsPerPiece === null) {
        throw new Error('grams_per_piece is required for piece conversion');
      }
      return (basePrice / gramsPerPiece) * 1000;
    }

    // If base is piece and requested is gram: convert via grams
    if (baseUnit === 'piece' && requestedUnit === 'gram') {
      if (gramsPerPiece === null) {
        throw new Error('grams_per_piece is required for piece conversion');
      }
      return basePrice / gramsPerPiece;
    }

    throw new Error(`Unsupported unit conversion: ${baseUnit} to ${requestedUnit}`);
  },

  /**
   * Convert any unit to grams (private helper)
   */
  toGrams(quantity, unit, gramsPerPiece = null) {
    switch (unit) {
      case 'kg':
        return quantity * 1000;
      case 'gram':
        return quantity;
      case 'piece':
        if (gramsPerPiece === null) {
          throw new Error('grams_per_piece required for piece unit');
        }
        return quantity * gramsPerPiece;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  },

  /**
   * Convert grams to any unit (private helper)
   */
  fromGrams(grams, unit, gramsPerPiece = null) {
    switch (unit) {
      case 'kg':
        return grams / 1000;
      case 'gram':
        return grams;
      case 'piece':
        if (gramsPerPiece === null) {
          throw new Error('grams_per_piece required for piece unit');
        }
        return grams / gramsPerPiece;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  },

  /**
   * Get human-readable unit label
   */
  getUnitLabel(unit) {
    const labels = {
      'kg': 'Kilogram (kg)',
      'gram': 'Gram (g)',
      'piece': 'Piece',
    };
    return labels[unit] || unit;
  },
};

export default unitConversionService;
