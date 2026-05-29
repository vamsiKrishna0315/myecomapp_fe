'use client';

import React from 'react';
import styles from './CheckoutPage.module.css';

const formatPrice = (value) => `Rs ${parseFloat(value || 0).toFixed(2)}`;

const RightPanel = ({
  summary,
  couponCode,
  onCouponChange,
  onApplyCoupon,
  paymentOptions,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onPlaceOrder,
  isPlaceOrderDisabled,
}) => {
  return (
    <aside className={styles.card}>
      <div className={styles.stack}>
        <section>
          <h2 className={styles.sectionTitle}>Order Summary</h2>
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatPrice(summary.subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <span>-{formatPrice(summary.discount)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>{formatPrice(summary.taxAmount)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>{formatPrice(summary.total)}</span>
            </div>
          </div>

          <div className={styles.couponRow} style={{ marginTop: '18px' }}>
            <input
              className={styles.input}
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(event) => onCouponChange(event.target.value)}
            />
            <button type="button" className={styles.primaryButton} onClick={onApplyCoupon}>
              Apply
            </button>
          </div>
        </section>

        <section style={{ paddingTop: '4px' }}>
          <h2 className={styles.sectionTitle}>Payment Method</h2>
          <div className={styles.stack}>
            {paymentOptions.map((option) => {
              const isSelected = selectedPaymentMethod === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.selectCard} ${isSelected ? styles.selected : ''}`}
                  onClick={() => onSelectPaymentMethod(option.value)}
                >
                  <div className={styles.radioWrap}>
                    <span className={styles.radio} aria-hidden="true" />
                    <div>
                      <div className={styles.cartName} style={{ fontSize: '0.98rem', marginBottom: '4px' }}>
                        {option.title}
                      </div>
                      <div className={styles.muted}>{option.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className={styles.buttonMeta}>
        <div>
          <div className={styles.buttonHint}>Payable amount</div>
          <div className={styles.price} style={{ fontSize: '1.3rem' }}>
            {formatPrice(summary.total)}
          </div>
        </div>
        <div className={styles.buttonHint}>Select address and payment method to continue.</div>
      </div>

      <button type="button" className={styles.placeOrder} disabled={isPlaceOrderDisabled} onClick={onPlaceOrder}>
        Place Order
      </button>
    </aside>
  );
};

export default RightPanel;
