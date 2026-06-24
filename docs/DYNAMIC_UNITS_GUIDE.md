# Dynamic Units Implementation - Frontend Guide

## Overview

The frontend has been updated to support dynamic unit selection for products. Units are now fetched from the API and the price is calculated dynamically based on the selected unit.

## Components Created

### 1. Unit Conversion Service (`utils/unitConversion.js`)

A utility service that handles unit conversions and price calculations.

**Key Methods:**
- `convert(quantity, fromUnit, toUnit, gramsPerPiece)` - Convert quantity between units
- `calculatePrice(basePrice, baseUnit, requestedUnit, gramsPerPiece)` - Calculate price for a specific unit
- `getUnitLabel(unit)` - Get human-readable unit labels

**Supported Units:**
- `kg` - Kilogram
- `gram` - Gram
- `piece` - Individual piece

**Example Usage:**
```javascript
import unitConversionService from '@/utils/unitConversion';

// Calculate price per piece if base is per kg
const pricePerPiece = unitConversionService.calculatePrice(
  500,      // base price (₹500 per kg)
  'kg',     // base unit
  'piece',  // target unit
  100       // 100 grams per piece
);
// Result: ₹50 per piece
```

### 2. Unit Selection Hook (`hooks/useUnitSelection.js`)

A React hook that manages unit selection state and price calculation.

**Returns:**
```javascript
{
  selectedUnit: string,      // Currently selected unit
  displayPrice: number,      // Calculated price for selected unit
  allowedUnits: array,       // Available units for the product
  handleUnitChange: function // Callback to change unit
}
```

**Example Usage:**
```javascript
import useUnitSelection from '@/hooks/useUnitSelection';

const MyComponent = ({ product }) => {
  const { selectedUnit, displayPrice, allowedUnits, handleUnitChange } = 
    useUnitSelection(product);

  return (
    <div>
      <select onChange={(e) => handleUnitChange(e.target.value)}>
        {allowedUnits.map(unit => (
          <option key={unit} value={unit}>{unit}</option>
        ))}
      </select>
      <p>Price: ₹{displayPrice}</p>
    </div>
  );
};
```

### 3. Unit Selector Component (`components/UnitSelector.jsx`)

A reusable Chakra UI component for selecting units.

**Props:**
```javascript
{
  allowedUnits: Array,       // ['kg', 'gram', 'piece']
  selectedUnit: string,      // Currently selected unit
  onChange: Function,        // Callback when unit changes
  options: {                 // Optional configuration
    label: string,           // Default: 'Select Unit:'
    showLabel: boolean,      // Default: true
    borderColor: string,     // Default: '#D11243'
    size: string,            // 'sm' | 'md' | 'lg'
    isDisabled: boolean      // Default: false
  }
}
```

**Example Usage:**
```javascript
import UnitSelector from '@/components/UnitSelector';

<UnitSelector 
  allowedUnits={product.allowed_units}
  selectedUnit={selectedUnit}
  onChange={handleUnitChange}
  options={{ 
    label: 'Choose Size:',
    borderColor: '#D11243'
  }}
/>
```

## Updated Components

### ProductDetails Component

The `ProductPage/ProductDetails.jsx` component has been updated to:

1. **Fetch product from API** - Uses the product ID to fetch full product details including `allowed_units`
2. **Display unit selector** - Shows a dropdown when multiple units are available
3. **Calculate dynamic pricing** - Updates price based on selected unit
4. **Send unit with cart request** - Includes `quantity_unit` when adding to cart

**Key Changes:**
- Added `fetchProductDetails()` to get fresh product data from API
- Added unit selection state management
- Added price calculation logic
- Updated `addToCartFunction()` to include `quantity_unit`
- Added loading spinner during data fetch
- Added toast notifications for user feedback

## API Integration

### Expected Product API Response

The API should return products with these fields:

```json
{
  "id": 1,
  "title": "Chicken Mini Bites",
  "category": "Chicken",
  "price": 500,
  "base_price_unit": "kg",
  "allowed_units": ["kg", "gram", "piece"],
  "grams_per_piece": 100,
  "weight_in_grams": 526,
  "pieces_per_pack": "14-16",
  "serves": 4,
  "image": "...",
  "product_cut_id": null
}
```

### Cart API Request

When adding to cart, the frontend now sends:

```json
{
  "customer_id": 1,
  "product_id": 1,
  "quantity": 1,
  "quantity_unit": "kg",
  "product_cut_id": null
}
```

## Integration Guide

### For Product Listing Pages

If you have a products listing component, update it to show multiple unit options:

```javascript
import UnitSelector from '@/components/UnitSelector';
import useUnitSelection from '@/hooks/useUnitSelection';

const ProductCard = ({ product }) => {
  const { selectedUnit, displayPrice, allowedUnits, handleUnitChange } = 
    useUnitSelection(product);

  const handleAddToCart = () => {
    // Pass selectedUnit to your cart action
    dispatch(addProductToCart({
      ...product,
      quantity_unit: selectedUnit,
      quantity: 1
    }));
  };

  return (
    <div>
      <h3>{product.title}</h3>
      <p>₹{displayPrice}</p>
      <UnitSelector 
        allowedUnits={allowedUnits}
        selectedUnit={selectedUnit}
        onChange={handleUnitChange}
      />
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
};
```

### For Cart Components

When displaying cart items, show the selected unit:

```javascript
// In cart item display
<div>
  <h4>{cartItem.product.title}</h4>
  <p>Quantity: {cartItem.quantity} {cartItem.quantity_unit}</p>
  <p>Price: ₹{cartItem.price}</p>
</div>
```

### For Checkout Pages

Include unit information in the order summary:

```javascript
{orders.map(order => (
  <div key={order.id}>
    <p>{order.product.title}</p>
    <p>{order.quantity} {order.quantity_unit}</p>
    <p>Total: ₹{order.total_price}</p>
  </div>
))}
```

## Unit Conversion Logic

### Price Conversion Rules

The frontend uses the same conversion logic as the backend:

**From kg to gram:**
```
Price per gram = Price per kg / 1000
```

**From kg to piece:**
```
Price per piece = (Price per kg / 1000) * grams_per_piece
```

**From gram to piece:**
```
Price per piece = Price per gram * grams_per_piece
```

## State Management

The Redux action for adding to cart has been updated to handle the `quantity_unit` field:

```javascript
const body = {
  customer_id: Number(payload.customer_id),
  product_id: Number(payload.product_id),
  ...(payload.product_cut_id ? { product_cut_id: Number(payload.product_cut_id) } : {}),
  ...(payload.quantity ? { quantity: Number(payload.quantity) } : {}),
  ...(payload.quantity_unit ? { quantity_unit: String(payload.quantity_unit) } : {}),
};
```

## Testing

To test the unit system:

1. **Test Single Unit Products:**
   - Products with only one allowed unit should NOT show a unit selector
   - Price should display correctly

2. **Test Multi-Unit Products:**
   - Products with multiple units should show a dropdown
   - Changing the unit should update the price dynamically
   - Adding to cart with different units should work correctly

3. **Test Price Calculation:**
   - Verify prices are calculated correctly for each unit
   - Compare with backend calculations

## Performance Considerations

- Unit conversions are done on the client-side (fast)
- Product details are fetched on component mount
- Price calculation is memoized through the hook
- No additional API calls are made when changing units

## Browser Support

This implementation uses:
- React Hooks (React 16.8+)
- Chakra UI components
- ES6+ JavaScript features
- All modern browsers are supported

## Troubleshooting

### Unit Selector Not Showing
- Check if `product.allowed_units` is an array with multiple items
- Verify the API is returning `allowed_units`

### Price Not Updating
- Verify `base_price_unit` is set in the product data
- Check browser console for unit conversion errors
- Ensure `grams_per_piece` is provided for piece conversions

### Cart Not Accepting Unit
- Verify the Redux action is passing `quantity_unit`
- Check that the backend accepts `quantity_unit` parameter
- Look for API errors in network tab

## Future Enhancements

- [ ] Add unit conversion to cart page
- [ ] Store user's preferred unit preference
- [ ] Add unit conversion indicators (e.g., "₹500/kg = ₹0.50/g")
- [ ] Create unit conversion calculator component
- [ ] Add bulk discounts based on units

in product filament cms move base price unit drop down in place of trackinventory and hide track_inventory sending a default false value 