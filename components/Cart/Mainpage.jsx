'use client';

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Item from "./Item";
import Total from "./Total";
import api from "../../utils/api";

import { Flex, Box, Text, Spinner, Center } from "@chakra-ui/react";
import { useCart } from "../Context/CartContext";
import { useSiteData } from "../Context/SiteDataContext";
import { clearStoredCart, getCartTotal, readCartSnapshot, writeStoredCart } from "../../utils/cartStorage";
import { getCartLineTotal, getCartUnitPrice } from "../../utils/productUnits";

const MainPage = ({ isOpen }) => {
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
      console.error('Error fetching cart data:', error);
      
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

  const handleItemRemoved = (removedId) => {
    setData((prevData) => {
      const updatedData = prevData.filter((item) => item.id !== removedId);
      writeStoredCart(updatedData);
      setTotal(getCartTotal(updatedData));
      return updatedData;
    });
  };

  const totalsum = () => total;

  const hendalqty = async (id, amount) => {
    const item = data.find((d) => d.id === id);
    if (!item) return;
    const newQty = Math.max(1, Number(item.quantity || 1) + amount);
    const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
    const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
    const sep = base.endsWith("/") ? "" : "/";
    const url = `${base}${sep}api/v1/${apiType}/cart/${id}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
    await api.patch(
      `/api/v1/${apiType}/cart/${id}`,
      { quantity: newQty }
    );
    await getCartData();
    refreshCart();
  };

  const productIndex = useMemo(() => {
    const index = new Map();
    const cats = siteData?.categories || [];
    cats.forEach((c) => (c.products || []).forEach((p) => index.set(p.id, p)));
    return index;
  }, [siteData]);

  return (
    <div>
      {!initialised || (loadingCart && data.length === 0) ? (
        <Center py={8} flexDir="column" gap={3}>
          <Spinner color="#D11243" />
          <Text color="gray.500">Loading your cart...</Text>
        </Center>
      ) : data.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={8}>
          Your cart is empty
        </Text>
      ) : (
        data.map((item) => {
          const p = productIndex.get(item.product_id);
          const label = p?.name || item.product?.name || `Product ${item.product_id}`;
          const price = getCartLineTotal(item, productIndex);
          const image = item.product?.primary_image_url || p?.primary_image_url || "/images/logo/logo.webp";
          const unit = item.quantity_unit || "unit";
          const unitPrice = getCartUnitPrice(item, productIndex);
          const totalPrice = getCartLineTotal(item, productIndex);
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
            />
          );
        })
      )}

      {data.length > 0 && (
        <Box
          mt={4}
          pt={3}
          borderTopWidth="2px"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold">
              Total:
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="#D11243">
              ₹{parseFloat(totalsum()).toFixed(2)}
            </Text>
          </Flex>
        </Box>
      )}
    </div>
  );
};
export default MainPage;
