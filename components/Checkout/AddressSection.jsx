'use client';

import React from 'react';
import styles from './CheckoutPage.module.css';

const AddressSection = ({
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
}) => {
  return (
    <section className={styles.card}>
      <div className={styles.toggleRow} style={{ marginBottom: '20px' }}>
        <div>
          <div className={styles.cartName} style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
            Send/Deliver to current location
          </div>
          <div className={styles.muted}>{currentLocationLabel || 'Use your live location coordinates.'}</div>
        </div>
        <button
          type="button"
          className={`${styles.toggle} ${useCurrentLocation ? styles.toggleActive : ''}`}
          onClick={() => onToggleUseCurrentLocation(!useCurrentLocation)}
          aria-pressed={useCurrentLocation}
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

      <div className={styles.actionsRow}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
          Delivery Address
        </h2>
        <button type="button" className={styles.primaryButton} onClick={onOpenAddAddress}>
          Add Address
        </button>
      </div>

      <div className={styles.toggleRow} style={{ marginTop: '20px' }}>
        <div>
          <div className={styles.cartName} style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
            Use billing address as delivery address
          </div>
          <div className={styles.muted}>Keep billing and delivery details synced for this order.</div>
        </div>
        <button
          type="button"
          className={`${styles.toggle} ${useBillingAsDelivery ? styles.toggleActive : ''}`}
          onClick={() => onToggleUseBillingAsDelivery(!useBillingAsDelivery)}
          aria-pressed={useBillingAsDelivery}
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

      <div className={styles.stack} style={{ marginTop: '20px' }}>
        {!useCurrentLocation && savedAddresses.length === 0 ? (
          <div className={styles.emptyState}>
            No saved addresses found. Add an address to continue with checkout.
          </div>
        ) : null}

        {!useCurrentLocation ? (
          savedAddresses.map((address) => {
            const isSelected = selectedAddressId === address.id;
            const selectAddress = () => {
              console.log('[Checkout][AddressSection] address selection triggered', {
                id: address.id,
                type: address.address_type_label,
                fullAddress: address.full_address,
                latitude: address.latitude ?? address.lat ?? address.address_latitude ?? null,
                longitude: address.longitude ?? address.lng ?? address.address_longitude ?? null,
              });
              onSelectAddress(address);
            };

            return (
              <button
                key={address.id}
                type="button"
                className={`${styles.selectCard} ${isSelected ? styles.selected : ''}`}
                onClick={selectAddress}
              >
                <div className={styles.selectCardHeader}>
                  <div className={styles.radioWrap}>
                    <input
                      type="radio"
                      name="checkout-address"
                      checked={isSelected}
                      onChange={selectAddress}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Select ${address.address_type_label || 'address'}`}
                    />
                    <div>
                      <div className={styles.addressType}>
                        <span>{address.address_type_label}</span>
                        {(address.is_default === 1 || address.is_default === true) && (
                          <span className={styles.badge}>Default</span>
                        )}
                      </div>
                      <div className={styles.muted}>{address.full_address}</div>
                    </div>
                  </div>
                  <span
                    className={styles.linkButton}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onEditAddress(address.id);
                    }}
                  >
                    Edit
                  </span>
                </div>
              </button>
            );
          })
        ) : null}
      </div>
    </section>
  );
};

export default AddressSection;
