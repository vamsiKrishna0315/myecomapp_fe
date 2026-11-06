'use client';

import React from 'react';
import { HiOutlineTag, HiOutlineShieldCheck, HiArrowRight } from 'react-icons/hi';

const formatPrice = (value) => `₹${parseFloat(value || 0).toFixed(2)}`;

const RightPanel = ({
  summary = { subtotal: 0, discount: 0, taxAmount: 0, total: 0 },
  couponCode = '',
  onCouponChange,
  onApplyCoupon,
  paymentOptions = [],
  selectedPaymentMethod,
  onSelectPaymentMethod,
  onPlaceOrder,
  isPlaceOrderDisabled = false,
}) => {
  return (
    <aside className="bg-white rounded-2xl border border-gray-200/80 shadow-premium p-5 sm:p-6 space-y-6">
      {/* Order Summary */}
      <section className="space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Order Summary</h2>
          <p className="text-xs text-gray-500">Price breakdown and applicable discounts</p>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-gray-600">
            <span>Item Subtotal</span>
            <span className="font-semibold text-gray-900">{formatPrice(summary.subtotal)}</span>
          </div>

          {parseFloat(summary.discount || 0) > 0 && (
            <div className="flex items-center justify-between text-emerald-600 font-medium">
              <span>Coupon Discount</span>
              <span className="font-bold">−{formatPrice(summary.discount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-gray-600">
            <span>Taxes & Packing</span>
            <span className="font-semibold text-gray-900">{formatPrice(summary.taxAmount)}</span>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-base sm:text-lg font-black">
            <span className="text-gray-900">To Pay</span>
            <span className="text-brand text-lg sm:text-xl font-black">{formatPrice(summary.total)}</span>
          </div>
        </div>

        {/* Coupon Code Input */}
        <div className="pt-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Have a Promo Code?
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <HiOutlineTag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 uppercase bg-gray-50 border border-gray-200/90 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 rounded-xl outline-none transition-all placeholder:normal-case font-medium"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(event) => onCouponChange(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={onApplyCoupon}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gray-900 hover:bg-black active:scale-[0.98] rounded-xl shadow-xs transition-all flex-shrink-0"
            >
              Apply
            </button>
          </div>
        </div>
      </section>

      {/* Payment Method Selector */}
      <section className="space-y-3 pt-2 border-t border-gray-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Payment Method</h2>
          <p className="text-xs text-gray-500">Choose your preferred payment option</p>
        </div>

        <div className="space-y-2.5">
          {paymentOptions.map((option) => {
            const isSelected = selectedPaymentMethod === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelectPaymentMethod(option.value)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-brand bg-red-50/20 ring-2 ring-brand/10 shadow-xs'
                    : 'border-gray-200/90 bg-white hover:border-brand/40 hover:bg-gray-50/50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-brand bg-brand' : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-gray-900">{option.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Place Order CTA Section */}
      <section className="pt-2 border-t border-gray-100 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Amount Payable</span>
          <span className="text-base font-black text-brand">{formatPrice(summary.total)}</span>
        </div>

        <button
          type="button"
          disabled={isPlaceOrderDisabled}
          onClick={onPlaceOrder}
          className="w-full py-3.5 sm:py-4 px-6 text-sm sm:text-base font-black text-white bg-brand hover:bg-[#b00f38] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-brand/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span>Place Order</span>
          <HiArrowRight className="w-4 h-4" />
        </button>

        {isPlaceOrderDisabled ? (
          <p className="text-[11px] text-center text-amber-600 font-medium">
            Please ensure a delivery address and payment method are selected.
          </p>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium pt-1">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Safe & Secure Checkout</span>
          </div>
        )}
      </section>
    </aside>
  );
};

export default RightPanel;
