'use client';

import React from 'react';
import styles from './CheckoutPage.module.css';
import { isComboCartItem } from '../../utils/cartStorage';

const formatPrice = (value) => `Rs ${parseFloat(value || 0).toFixed(2)}`;

const CartSection = ({
  cartItems,
  productIndex,
  onRemoveItem,
  timeSlots,
  selectedTimeSlot,
  onTimeSlotSelect,
  lockTimeSlots = false,
}) => {
  return (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Your Cart</h2>
      <div className={styles.stack}>
        {cartItems.map((item) => {
          const product = productIndex.get(item.product_id);
          const label = product?.name || item.product?.name || `Product ${item.product_id}`;
          const image = item.product?.primary_image_url || product?.primary_image_url || '/images/logo/logo.webp';
          const unit = item.quantity_unit || 'unit';
          const totalPrice =
            item.total_price || item.line_total || parseFloat(item.price || 0) * parseFloat(item.quantity || 1);
          const comboItem = isComboCartItem(item);

          return (
            <article key={item.id} className={styles.cartItem}>
              <div className={styles.cartImageWrap}>
                <img src={image || '/images/logo/logo.webp'} alt={label} className={styles.cartImage} />
              </div>
              <div>
                <h3 className={styles.cartName}>{label}</h3>
                <div className={styles.cartMeta}>
                  <span>
                    Quantity: {item.quantity} {unit}
                  </span>
                  <span className={styles.price}>{formatPrice(totalPrice)}</span>
                </div>
              </div>
              {comboItem ? null : (
                <button type="button" className={styles.ghostButton} onClick={() => onRemoveItem(item.id)}>
                  Remove
                </button>
              )}
            </article>
          );
        })}
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginBottom: '12px' }}>
          Select Delivery Time Slot
        </h3>
        <div className={styles.slotGrid}>
          {timeSlots.map((slot) => {
            const isSelected = selectedTimeSlot === slot;
            const isDisabled = lockTimeSlots && !isSelected;

            return (
              <button
                key={slot}
                type="button"
                className={`${styles.selectCard} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabledSlot : ''}`}
                onClick={() => onTimeSlotSelect(slot)}
                disabled={isDisabled}
                aria-disabled={isDisabled}
              >
                <div className={styles.radioWrap}>
                  <span className={styles.radio} aria-hidden="true" />
                  <div>
                    <div className={styles.cartName} style={{ fontSize: '0.95rem', marginBottom: 0 }}>
                      {slot}
                    </div>
                    <div className={styles.muted}>
                      {isDisabled ? 'Unavailable for this live estimate.' : 'Choose when you want the delivery.'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CartSection;
