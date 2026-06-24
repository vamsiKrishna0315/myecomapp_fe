'use client';

import React from 'react';
import { Box, Text, Select } from '@chakra-ui/react';
import unitConversionService from '../../utils/unitConversion';

/**
 * Reusable Unit Selector Component
 * 
 * @param {Array} allowedUnits - List of allowed units (e.g., ['kg', 'gram', 'piece'])
 * @param {string} selectedUnit - Currently selected unit
 * @param {Function} onChange - Callback when unit changes
 * @param {Object} options - Additional options
 */
const UnitSelector = ({ 
  allowedUnits, 
  selectedUnit, 
  onChange,
  options = {}
}) => {
  const {
    label = 'Select Unit:',
    showLabel = true,
    borderColor = '#D11243',
    size = 'md',
    isDisabled = false,
  } = options;

  // Only show selector if there are multiple units
  if (!Array.isArray(allowedUnits) || allowedUnits.length <= 1) {
    return null;
  }

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <Box>
      {showLabel && (
        <Text fontWeight="600" mb="8px">
          {label}
        </Text>
      )}
      <Select
        value={selectedUnit}
        onChange={handleChange}
        width="100%"
        borderColor={borderColor}
        focusBorderColor={borderColor}
        size={size}
        isDisabled={isDisabled}
      >
        {allowedUnits.map((unit) => (
          <option key={unit} value={unit}>
            {unitConversionService.getUnitLabel(unit)}
          </option>
        ))}
      </Select>
    </Box>
  );
};

export default UnitSelector;
