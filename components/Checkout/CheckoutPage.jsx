'use client';

import React from 'react';
import CartSection from './CartSection';
import AddressSection from './AddressSection';
import SpecialInstructionsSection from './SpecialInstructionsSection';
import RightPanel from './RightPanel';
import DeliveryBanner from './DeliveryBanner';

const CheckoutPage = ({
  cartItems,
  productIndex,
  onRemoveItem,
  onUpdateQuantity,
  timeSlots,
  selectedTimeSlot,
  onTimeSlotSelect,
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onEditAddress,
  useBillingAsDelivery,
  onToggleUseBillingAsDelivery,
  onOpenAddAddress,
  useCurrentLocation,
  onToggleUseCurrentLocation,
  currentLocationLabel,
  specialInstructions,
  onSpecialInstructionsChange,
  summary,
  couponCode,
  onCouponChange,
  onApplyCoupon,
  paymentOptions,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onPlaceOrder,
  isPlaceOrderDisabled,
  deliveryTime,
  isDeliveryTimeLoading,
  showDeliveryBanner,
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Express Delivery Banner */}
      <DeliveryBanner
        deliveryTime={deliveryTime}
        loading={isDeliveryTimeLoading}
        visible={showDeliveryBanner}
      />

      {/* Checkout Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Cart, Instructions, Address */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <CartSection
            cartItems={cartItems}
            productIndex={productIndex}
            onRemoveItem={onRemoveItem}
            onUpdateQuantity={onUpdateQuantity}
            timeSlots={timeSlots}
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotSelect={onTimeSlotSelect}
            lockTimeSlots={showDeliveryBanner}
          />

          <SpecialInstructionsSection
            value={specialInstructions}
            onChange={onSpecialInstructionsChange}
          />

          <AddressSection
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={onSelectAddress}
            onEditAddress={onEditAddress}
            useBillingAsDelivery={useBillingAsDelivery}
            onToggleUseBillingAsDelivery={onToggleUseBillingAsDelivery}
            onOpenAddAddress={onOpenAddAddress}
            useCurrentLocation={useCurrentLocation}
            onToggleUseCurrentLocation={onToggleUseCurrentLocation}
            currentLocationLabel={currentLocationLabel}
          />
        </div>

        {/* Right Column: Order Summary & Payment (Sticky on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
          <RightPanel
            summary={summary}
            couponCode={couponCode}
            onCouponChange={onCouponChange}
            onApplyCoupon={onApplyCoupon}
            paymentOptions={paymentOptions}
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={onSelectPaymentMethod}
            onPlaceOrder={onPlaceOrder}
            isPlaceOrderDisabled={isPlaceOrderDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
