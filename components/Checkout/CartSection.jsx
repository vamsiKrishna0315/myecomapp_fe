'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineMinus,
  HiChevronDown,
  HiCheck,
} from 'react-icons/hi';
import { isComboCartItem } from '../../utils/cartStorage';

const formatPrice = (value) => `₹${parseFloat(value || 0).toFixed(2)}`;

const CartSection = ({
  cartItems,
  productIndex,
  onRemoveItem,
  onUpdateQuantity,
  timeSlots,
  selectedTimeSlot,
  onTimeSlotSelect,
  lockTimeSlots = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-card-subtle p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Your Cart</h2>
          <p className="text-xs text-gray-500 mt-0.5">Review items in your order</p>
        </div>
        <span className="text-xs font-bold text-brand bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cartItems.map((item) => {
          const product = productIndex.get(item.product_id);
          const label = product?.name || item.product?.name || `Product ${item.product_id}`;
          const image = item.product?.primary_image_url || product?.primary_image_url || '/images/logo/logo.webp';
          const unit = item.quantity_unit || 'unit';
          const totalPrice =
            item.total_price || item.line_total || parseFloat(item.price || 0) * parseFloat(item.quantity || 1);
          const comboItem = isComboCartItem(item);
          const itemQty = parseFloat(item.quantity || 1);

          return (
            <article
              key={item.id}
              className="flex items-center justify-between gap-3.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-brand/20 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={image || '/images/logo/logo.webp'}
                  alt={label}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-white border border-gray-100 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = '/images/logo/logo.webp';
                  }}
                />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{label}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span>
                      Qty: <strong className="text-gray-700">{item.quantity} {unit}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-black text-brand">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Remove Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!comboItem && onUpdateQuantity && (
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/70 shadow-xs">
                    <button
                      type="button"
                      disabled={itemQty <= 1}
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-brand hover:bg-white active:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <HiOutlineMinus className="w-3 h-3" />
                    </button>
                    <span className="min-w-[28px] text-center text-xs font-black text-gray-900 px-1">
                      {itemQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-brand hover:bg-white active:bg-red-50 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <HiOutlinePlus className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {!comboItem && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Delivery Time Slot Section */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HiOutlineClock className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-extrabold text-gray-900">Select Delivery Time Slot</h3>
          </div>
          <span className="text-[11px] font-bold text-brand bg-red-50 border border-red-100 px-2 py-0.5 rounded sm:hidden">
            {selectedTimeSlot}
          </span>
        </div>

        {/* Mobile Custom Dropdown View matching card design */}
        <div className="block sm:hidden relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !lockTimeSlots && setIsDropdownOpen((prev) => !prev)}
            disabled={lockTimeSlots}
            aria-expanded={isDropdownOpen}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              selectedTimeSlot
                ? 'border-brand bg-red-50/50 shadow-xs'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${lockTimeSlots ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedTimeSlot ? 'border-brand' : 'border-gray-300'
                }`}
              >
                {selectedTimeSlot && <span className="w-2 h-2 rounded-full bg-brand" />}
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                  {selectedTimeSlot || 'Select Delivery Window'}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {lockTimeSlots ? 'Locked for express delivery' : 'Delivery window'}
                </div>
              </div>
            </div>
            <HiChevronDown
              className={`w-5 h-5 text-brand flex-shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Floating Custom Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 space-y-1.5 animate-in fade-in duration-150">
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      onTimeSlotSelect(slot);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand bg-red-50/60 shadow-xs'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-brand' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-brand" />}
                      </span>
                      <div className="min-w-0">
                        <div className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-brand' : 'text-gray-900'}`}>
                          {slot}
                        </div>
                        <div className="text-[10px] text-gray-400">Delivery window</div>
                      </div>
                    </div>
                    {isSelected && <HiCheck className="w-4 h-4 text-brand flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {lockTimeSlots && (
            <p className="text-[10px] text-gray-400 mt-1">
              Time slot locked for express 90-min delivery.
            </p>
          )}
        </div>

        {/* Tablet & Desktop Radio Grid View */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-2.5">
          {timeSlots.map((slot) => {
            const isSelected = selectedTimeSlot === slot;
            const isDisabled = lockTimeSlots && !isSelected;

            return (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeSlotSelect(slot)}
                disabled={isDisabled}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand bg-red-50/50 shadow-xs'
                    : isDisabled
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200/90 bg-white hover:border-gray-300'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-brand' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-brand" />}
                </span>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate">
                    {slot}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {isDisabled ? 'Locked for express delivery' : 'Delivery window'}
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
