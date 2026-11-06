'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HiX, HiOutlineShoppingBag, HiOutlineTruck, HiArrowRight } from "react-icons/hi";
import Item from "./Item";
import api from "../../utils/api";
import { useCart } from "../Context/CartContext";
import { useSiteData } from "../Context/SiteDataContext";
import { clearStoredCart, getCartTotal, isComboCartItem, readCartSnapshot, writeStoredCart } from "../../utils/cartStorage";
import { getCartLineTotal, getCartUnitPrice } from "../../utils/productUnits";

const FREE_DELIVERY_THRESHOLD = 399;
const STANDARD_DELIVERY_FEE = 39;

const MainPage = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [initialised, setInitialised] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const { refreshCart } = useCart();
  const { siteData } = useSiteData();

  const getCartData = async () => {
    try {
      setLoadingCart(true);
      const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
      const sep = base.endsWith("/") ? "" : "/";
      const url = `${base}${sep}api/v1/${apiType}/cart`;
      const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;

      if (!token) {
        clearStoredCart();
        setData([]);
        setTotal(0);
        return;
      }

      const res = await api.get(`/api/v1/${apiType}/cart`);
      const payload = res.data;
      const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setData(items);
      writeStoredCart(items);
      const t = getCartTotal(items);
      setTotal(t);
    } catch (error) {
      console.error("Error fetching cart data:", error);

      if (error.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("Token");
        }
        clearStoredCart();
        setData([]);
        setTotal(0);
      } else {
        setData([]);
        setTotal(0);
      }
    } finally {
      setLoadingCart(false);
      setInitialised(true);
    }
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    const snapshot = readCartSnapshot();
    setData(snapshot.items);
    setTotal(snapshot.total);
    setInitialised(true);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      getCartData();
    }
  }, [isOpen]);

  // Synchronize cart whenever localStorage updates across tabs or components
  useEffect(() => {
    const handleSync = () => {
      const snapshot = readCartSnapshot();
      setData(snapshot.items);
      setTotal(snapshot.total);
    };

    window.addEventListener("cartStorageUpdated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("cartStorageUpdated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const handleItemRemoved = (removedId) => {
    setData((prevData) => {
      const updatedData = prevData.filter((item) => String(item.id) !== String(removedId));
      writeStoredCart(updatedData);
      setTotal(getCartTotal(updatedData));
      return updatedData;
    });
    refreshCart();
  };

  const hendalqty = async (id, amount) => {
    const item = data.find((d) => String(d.id) === String(id));
    if (!item) return;
    if (isComboCartItem(item)) return;

    const currentQty = parseFloat(item.quantity || 1);
    if (amount < 0 && currentQty <= 1) return;
    const newQty = Math.max(1, currentQty + amount);
    if (newQty === currentQty) return;

    // Optimistic UI update for immediate response
    const updatedData = data.map((d) => {
      if (String(d.id) === String(id)) {
        const unitPrice = getCartUnitPrice(d, productIndex) || parseFloat(d.unit_price || d.price || 0);
        const lineTotal = unitPrice * newQty;
        return {
          ...d,
          quantity: newQty,
          unit_price: unitPrice,
          total_price: lineTotal,
          line_total: lineTotal,
        };
      }
      return d;
    });

    setData(updatedData);
    setTotal(getCartTotal(updatedData));
    writeStoredCart(updatedData);

    try {
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
      await api.patch(`/api/v1/${apiType}/cart/${id}`, {
        quantity: newQty,
        quantity_unit: item.quantity_unit || "kg",
      });
      refreshCart();
    } catch (error) {
      console.error("Error updating item quantity:", error);
      // Revert to server data on failure
      getCartData();
    }
  };

  const productIndex = useMemo(() => {
    const index = new Map();
    const cats = siteData?.categories || [];
    cats.forEach((c) => (c.products || []).forEach((p) => index.set(p.id, p)));
    return index;
  }, [siteData]);

  // Delivery calculation
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - total);
  const freeDeliveryProgress = Math.min(100, Math.round((total / FREE_DELIVERY_THRESHOLD) * 100));
  const hasFreeDelivery = total >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = total > 0 ? (hasFreeDelivery ? 0 : STANDARD_DELIVERY_FEE) : 0;
  const grandTotal = total + deliveryFee;

  return (
    <div className="flex flex-col h-full bg-[#fbfbfb] text-gray-900 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black tracking-tight text-gray-900">Order Summary</h2>
          {data.length > 0 && (
            <span className="text-[11px] font-bold text-brand bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
              {data.length} {data.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close cart"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Free Delivery Milestone Progress Banner */}
      {data.length > 0 && (
        <div className="flex-shrink-0">
          {!hasFreeDelivery ? (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-100/90 px-4 py-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <div className="flex items-center gap-1.5">
                  <HiOutlineTruck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Add <strong className="text-brand font-black">₹{remainingForFree.toFixed(2)}</strong> more for <strong className="text-emerald-700">FREE Delivery</strong>
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-extrabold">{freeDeliveryProgress}%</span>
              </div>
              <div className="w-full bg-emerald-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${freeDeliveryProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-800">
              <span className="text-base">🎉</span>
              <span>
                Congratulations! You unlocked <strong className="text-emerald-700 font-black">FREE Delivery</strong>!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Cart Items Scrollable View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!initialised || (loadingCart && data.length === 0) ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Loading your fresh cart...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-brand flex items-center justify-center mb-4 border border-red-100/60 shadow-xs">
              <HiOutlineShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Your cart is empty</h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed">
              Looks like you haven&apos;t added any farm-fresh meats or cuts yet.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-brand hover:bg-brand-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          data.map((item) => {
            const p = productIndex.get(item.product_id);
            const label = p?.name || item.product?.name || `Product ${item.product_id}`;
            const price = getCartLineTotal(item, productIndex);
            const image =
              item.product?.primary_image_url || p?.primary_image_url || "/images/logo/logo.webp";
            const unit = item.quantity_unit || "unit";
            const unitPrice = getCartUnitPrice(item, productIndex);
            const totalPrice = getCartLineTotal(item, productIndex);
            const comboItem = isComboCartItem(item);

            return (
              <Item
                key={item.id}
                id={item.id}
                label={label}
                price={price}
                qyt={item.quantity}
                hendalqty={hendalqty}
                image={image}
                unit={unit}
                unitPrice={unitPrice}
                totalPrice={totalPrice}
                onItemRemoved={handleItemRemoved}
                isComboItem={comboItem}
              />
            );
          })
        )}
      </div>

      {/* Sticky Bottom Order Summary & Proceed CTA */}
      {data.length > 0 && (
        <div className="border-t border-gray-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] space-y-3 flex-shrink-0">
          {/* Bill Details Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Item Total</span>
              <span className="font-bold text-gray-800">₹{parseFloat(total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Delivery Partner Fee</span>
              {hasFreeDelivery ? (
                <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase">
                  FREE
                </span>
              ) : (
                <span className="font-bold text-gray-800">₹{STANDARD_DELIVERY_FEE.toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
              <span>To Pay</span>
              <span className="text-base font-black text-brand tracking-tight">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* High-Converting Primary CTA */}
          <button
            type="button"
            onClick={() => {
              onClose?.();
              router.push("/new-checkout");
            }}
            className="w-full h-12 bg-brand hover:bg-brand-600 active:scale-[0.98] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-between px-5 group cursor-pointer"
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">Total</span>
              <span className="text-base font-black leading-tight">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-extrabold tracking-wide">
              <span>Proceed to Checkout</span>
              <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default MainPage;
