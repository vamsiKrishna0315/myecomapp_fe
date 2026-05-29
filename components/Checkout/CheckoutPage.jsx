'use client';

import React from 'react';
import CartSection from './CartSection';
import AddressSection from './AddressSection';
import SpecialInstructionsSection from './SpecialInstructionsSection';
import RightPanel from './RightPanel';
import DeliveryBanner from './DeliveryBanner';
import styles from './CheckoutPage.module.css';

const CheckoutPage = ({
  cartItems,
  productIndex,
  onRemoveItem,
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
    <div className={styles.page}>
      <DeliveryBanner deliveryTime={deliveryTime} loading={isDeliveryTimeLoading} visible={showDeliveryBanner} />
      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <CartSection
            cartItems={cartItems}
            productIndex={productIndex}
            onRemoveItem={onRemoveItem}
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
        <div className={styles.rightColumn}>
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
