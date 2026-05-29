"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { triggerUnauthorizedLogout } from "../../utils/auth";
import { clearStoredCart, getCartCount, readCartSnapshot, writeStoredCart } from "../../utils/cartStorage";

export const CartContext = createContext({
  cartCount: 0,
  loading: false,
  error: null,
  refreshCart: async () => {},
});

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractItems = (payload) => {
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  const refreshCart = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
      if (!token) {
        clearStoredCart();
        setCartCount(0);
        return;
      }
      setLoading(true);
      setError(null);
      const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
      const sep = base.endsWith("/") ? "" : "/";
      const url = `${base}${sep}api/v1/${apiType}/cart`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        triggerUnauthorizedLogout();
        setCartCount(0);
        return;
      }
      if (!res.ok) throw new Error(`Cart fetch failed: ${res.status}`);
      const json = await res.json();
      const payload = json?.data ?? json;
      if (typeof payload?.count === "number") {
        setCartCount(Number(payload.count));
      } else {
        const items = extractItems(payload);
        setCartCount(getCartCount(items));
      }

      writeStoredCart(extractItems(payload));
    } catch (e) {
      setError(e);
      if (e?.response?.status === 401) {
        triggerUnauthorizedLogout();
        clearStoredCart();
        setCartCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { count } = readCartSnapshot();
    if (count > 0) {
      setCartCount(count);
    }

    refreshCart();
  }, [refreshCart]);

  const value = useMemo(() => ({ cartCount, loading, error, refreshCart }), [cartCount, loading, error, refreshCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
