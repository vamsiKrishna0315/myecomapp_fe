'use client';

import React from "react";
import { useToast } from "@chakra-ui/react";
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";
import api from "../../utils/api";
import { readStoredCart, writeStoredCart } from "../../utils/cartStorage";

const Item = ({
  label,
  price,
  qyt,
  hendalqty,
  id,
  image,
  unit,
  unitPrice,
  totalPrice,
  onItemRemoved,
  isComboItem = false,
}) => {
  const toast = useToast();
  const parsedQuantity = parseFloat(qyt || 0);

  // Format quantity naturally: 1 instead of 1.000, 1.5 instead of 1.500
  const formattedQty = Number.isInteger(parsedQuantity)
    ? parsedQuantity
    : Number(parsedQuantity.toFixed(2));

  const handleQuantityChange = (amount) => {
    if (isComboItem) return;
    hendalqty(id, amount);
  };

  const removeItem = async () => {
    // Optimistic local removal: instant 0ms response in UI & header badge
    const current = readStoredCart();
    const updatedItems = current.filter((item) => String(item.id) !== String(id));
    writeStoredCart(updatedItems);

    if (onItemRemoved) {
      onItemRemoved(id);
    }

    toast({
      title: "Item removed",
      description: `${label} removed from your cart`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });

    try {
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
      await api.delete(`/api/v1/${apiType}/cart/${id}`);
    } catch (error) {
      console.warn("Error removing item on backend:", error);
    }
  };

  return (
    <div className="bg-white border border-gray-200/90 hover:border-brand/30 rounded-2xl p-3 sm:p-3.5 shadow-card-subtle flex gap-3 sm:gap-3.5 items-center transition-all">
      {/* Product Thumbnail */}
      <img
        src={image || "/images/logo/logo.webp"}
        alt={label}
        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
        onError={(e) => {
          e.currentTarget.src = "/images/logo/logo.webp";
        }}
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
          {label}
        </h4>
        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
          ₹{parseFloat(unitPrice || price).toFixed(2)} / {unit || "unit"}
        </p>
        <p className="text-sm sm:text-base font-black text-brand mt-1 tracking-tight">
          ₹{parseFloat(totalPrice || price).toFixed(2)}
        </p>
      </div>

      {/* Quantity Stepper & Remove */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {isComboItem ? (
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
            {formattedQty} {unit || "unit"}
          </span>
        ) : (
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/70 shadow-xs">
            <button
              type="button"
              disabled={parsedQuantity <= 1}
              onClick={() => handleQuantityChange(-1)}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:text-brand hover:bg-white active:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <HiOutlineMinus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <span className="min-w-[28px] sm:min-w-[32px] text-center text-xs font-black text-gray-900 px-1">
              {formattedQty}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:text-brand hover:bg-white active:bg-red-50 transition-colors"
              aria-label="Increase quantity"
            >
              <HiOutlinePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={removeItem}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
          aria-label="Remove item"
          title="Remove from cart"
        >
          <HiOutlineTrash className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>
    </div>
  );
};

export default Item;
