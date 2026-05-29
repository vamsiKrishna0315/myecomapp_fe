'use client';

import React from 'react';
import styles from './CheckoutPage.module.css';

const SPECIAL_INSTRUCTIONS_MAX_LENGTH = 250;

const SpecialInstructionsSection = ({ value, onChange }) => {
  const remainingCharacters = SPECIAL_INSTRUCTIONS_MAX_LENGTH - value.length;

  return (
    <section className={styles.card}>
      <div className={styles.specialInstructionsHeader}>
        <div>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '6px' }}>
            Special Instructions
          </h2>
          <p className={styles.muted}>
            Add delivery notes for the rider or packing team. This will be sent with your order.
          </p>
        </div>
        <span className={styles.instructionsCounter}>{remainingCharacters} left</span>
      </div>

      <label className={styles.instructionsField}>
        <span className={styles.instructionsLabel}>Notes for this order</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, SPECIAL_INSTRUCTIONS_MAX_LENGTH))}
          className={styles.instructionsTextarea}
          rows={5}
          placeholder="Example: call on arrival, avoid spicy marinade, leave at the gate."
        />
      </label>
    </section>
  );
};

export default SpecialInstructionsSection;
