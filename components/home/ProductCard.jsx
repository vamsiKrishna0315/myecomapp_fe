'use client';

import React from "react";
import Link from "next/link";
import {
  HiOutlineShoppingBag,
  HiOutlineMinus,
  HiOutlinePlus,
  HiChevronDown,
  HiCheck,
} from "react-icons/hi";
import { buildProductRoutePath } from "../../utils/seo";

export default function ProductCard({
  product,
  selectedCut,
  onSelectCut,
  quantity,
  onChangeQuantity,
  selectedUnit,
  onChangeUnit,
  displayPrice,
  unitText,
  allowedUnits = [],
  onAddToCart,
  assetUrl,
}) {
  const isBestSeller = product?.is_best_seller === true || product?.is_best_seller === 1;
  const imageUrl =
    product?.primary_image_url ||
    (product?.primary_image ? assetUrl?.(product.primary_image) : null) ||
    "/images/logo/logo.webp";
  const productHref = buildProductRoutePath(product);

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = parseInt(quantity || 1, 10);
    if (current > 1) {
      onChangeQuantity(current - 1);
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const current = parseInt(quantity || 1, 10);
    onChangeQuantity(current + 1);
  };

  return (
    <div className="w-full h-[420px] sm:h-[475px] bg-white rounded-2xl border border-gray-200/80 hover:border-brand/30 shadow-card-subtle hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1">
      {/* Top Portion: Image, Badges, Title, Price */}
      <div>
        {/* Product Image & Badges */}
        <Link
          href={productHref}
          className="block relative h-40 sm:h-52 w-full overflow-hidden bg-gray-50 border-b border-gray-100"
        >
          {/* Freshness Badge */}
          {isBestSeller ? (
            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-brand px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm border border-brand/10">
              🔥 Bestseller
            </span>
          ) : (
            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm border border-gray-200">
              🥩 Fresh Cut
            </span>
          )}

          {/* Express Delivery Badge */}
          <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-emerald-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            90 Mins
          </span>

          <img
            src={imageUrl}
            alt={product?.name || "Fresh Cut"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "/images/logo/logo.webp";
            }}
          />
        </Link>

        {/* Title & Price */}
        <div className="p-3 sm:p-4 pb-0">
          <Link href={productHref}>
            <h3 className="h-10 sm:h-11 line-clamp-2 font-bold text-xs sm:text-base text-gray-900 group-hover:text-brand transition-colors leading-snug">
              {product?.name}
            </h3>
          </Link>
          <div className="h-6 sm:h-7 flex items-baseline gap-1 mt-1">
            <span className="text-brand font-black text-base sm:text-xl tracking-tight">
              ₹{parseFloat(displayPrice || 0).toFixed(2)}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-400">
              / {unitText}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Portion: Standardized Fixed-height Controls & Add to Cart */}
      <div className="p-2.5 sm:p-3.5 pt-2 border-t border-gray-100 bg-gray-50/40 space-y-2">
        {/* Cut Selector Row: Exact h-[34px] sm:h-[38px] */}
        <div className="h-[34px] sm:h-[38px] flex items-center">
          {product?.cuttypes?.length > 0 ? (
            <div className="relative w-full h-full">
              <select
                className="w-full h-full appearance-none text-[11px] sm:text-xs font-semibold text-gray-800 bg-white border border-gray-200 hover:border-gray-300 focus:border-brand rounded-xl pl-2.5 pr-7 sm:pl-3 sm:pr-8 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-colors cursor-pointer"
                value={selectedCut ?? ""}
                onChange={(e) => onSelectCut(Number(e.target.value))}
              >
                <option value="">Select Cut Type</option>
                {product.cuttypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
              <HiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-full text-[11px] sm:text-xs font-semibold text-gray-500 bg-gray-100/70 border border-gray-200/60 rounded-xl px-2.5 sm:px-3 flex items-center justify-between">
              <span>Standard fresh cut</span>
              <HiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Quantity Stepper & Unit Row: Exact h-[34px] sm:h-[38px] */}
        <div className="h-[34px] sm:h-[38px] flex gap-2 items-center">
          {/* Stepper */}
          <div className="w-1/2 h-full flex items-center border border-gray-200 bg-white rounded-xl overflow-hidden focus-within:border-brand">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-500 hover:text-brand hover:bg-red-50/50 active:bg-red-100 transition-colors"
              aria-label="Decrease quantity"
            >
              <HiOutlineMinus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <input
              type="number"
              min="1"
              value={quantity ?? 1}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                onChangeQuantity(val);
              }}
              className="flex-1 w-full text-center text-xs font-black text-gray-900 border-none outline-none p-0 focus:ring-0"
            />
            <button
              type="button"
              onClick={handleIncrement}
              className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-500 hover:text-brand hover:bg-red-50/50 active:bg-red-100 transition-colors"
              aria-label="Increase quantity"
            >
              <HiOutlinePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Unit Selector */}
          <div className="w-1/2 h-full relative">
            <select
              className="w-full h-full appearance-none text-[11px] sm:text-xs font-semibold text-gray-800 bg-white border border-gray-200 hover:border-gray-300 focus:border-brand rounded-xl pl-2.5 pr-6 sm:pl-3 sm:pr-7 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-colors cursor-pointer"
              value={selectedUnit}
              onChange={(e) => onChangeUnit(e.target.value)}
            >
              {allowedUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <HiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Add to Cart Button: Exact h-[36px] sm:h-[40px] */}
        <button
          onClick={onAddToCart}
          className="w-full h-[36px] sm:h-[40px] bg-brand hover:bg-brand-600 active:scale-[0.98] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 sm:gap-2 tracking-wide group/btn"
        >
          <HiOutlineShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:scale-110 transition-transform" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
