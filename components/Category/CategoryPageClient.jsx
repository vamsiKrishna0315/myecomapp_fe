"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Image, Text, Button, Select, useToast, Input } from "@chakra-ui/react";
import { useSiteData } from "../Context/SiteDataContext";
import { useDispatch } from "react-redux";
import { addProductToCart } from "../../redux/ProductReducer/action";
import React from "react";
import { AppContext } from "../Context/ContextProvider";
import { useCart } from "../Context/CartContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildProductRoutePath, findCategoryBySlug, isComboCategory } from "../../utils/seo";
import { getAllowedUnits, getDisplayPrice, getInitialUnit, getUnitText } from "../../utils/productUnits";
import { markStoredCartItemsAsCombo } from "../../utils/cartStorage";
import {
  getComboItemCartQuantity,
  getComboItemDisplayText,
  getComboItemUnit,
  normalizeComboItems,
} from "../../utils/comboItems";

function parseComboProductIds(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item));
}

export default function CategoryPageClient({ slug, initialSelectedCategory = null }) {
  const { siteData, assetUrl } = useSiteData();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryResponse, setCategoryResponse] = useState(null);
  const dispatch = useDispatch();
  const [selectedCuts, setSelectedCuts] = useState({});
  const [quantities, setQuantities] = useState({});
  const [quantityUnits, setQuantityUnits] = useState({});
  const ctx = React.useContext(AppContext);
  const toast = useToast();
  const { refreshCart } = useCart();

  const selectedCategory = useMemo(() => {
    return findCategoryBySlug(siteData, slug) || initialSelectedCategory || null;
  }, [initialSelectedCategory, siteData, slug]);

  const selectedCombo = useMemo(() => {
    if (!selectedCategory || !isComboCategory(selectedCategory)) {
      return null;
    }

    const combos = Array.isArray(selectedCategory.combos) ? selectedCategory.combos : [];
    const comboId = searchParams?.get("comboId");
    const comboName = searchParams?.get("comboName");

    if (comboId) {
      const matchedById = combos.find((combo) => String(combo?.id) === comboId);
      if (matchedById) {
        return matchedById;
      }
    }

    if (comboName) {
      const normalizedComboName = comboName.trim().toLowerCase();
      const matchedByName = combos.find((combo) => (combo?.name || "").trim().toLowerCase() === normalizedComboName);
      if (matchedByName) {
        return matchedByName;
      }
    }

    return null;
  }, [searchParams, selectedCategory]);

  const comboProductIds = useMemo(() => {
    const idsFromParams = parseComboProductIds(searchParams?.get("productIds"));

    if (idsFromParams.length > 0) {
      return idsFromParams;
    }

    return Array.isArray(selectedCombo?.product_ids)
      ? selectedCombo.product_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : [];
  }, [searchParams, selectedCombo]);

  const comboItems = useMemo(() => normalizeComboItems(selectedCombo, comboProductIds), [comboProductIds, selectedCombo]);

  const allSiteProducts = useMemo(() => {
    const categories = Array.isArray(siteData?.categories) ? siteData.categories : [];
    return categories.flatMap((category) => (Array.isArray(category?.products) ? category.products : []));
  }, [siteData]);

  useEffect(() => {
    async function fetchCategory() {
      if (!selectedCategory) {
        setLoading(false);
        setCategoryResponse(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
        const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
        const sep = base.endsWith("/") ? "" : "/";
        const url = `${base}${sep}api/v1/${apiType}/category`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_name: selectedCategory.category_name }),
        });

        if (!res.ok) {
          throw new Error(`Category fetch failed: ${res.status}`);
        }

        const json = await res.json();
        setCategoryResponse(json);
      } catch (fetchError) {
        setError(fetchError);
      } finally {
        setLoading(false);
      }
    }

    fetchCategory();
  }, [selectedCategory]);

  const products = useMemo(() => {
    const payload = categoryResponse?.data;
    let backendProducts = [];

    if (Array.isArray(payload)) {
      const categoryMatch = payload.find(
        (category) =>
          category.id === selectedCategory?.id ||
          (category.category_name || "").toLowerCase() === (selectedCategory?.category_name || "").toLowerCase()
      );
      backendProducts = categoryMatch?.products || [];
    } else if (payload?.products) {
      backendProducts = payload.products || [];
    }

    if (comboItems.length > 0) {
      const productLookup = new Map();

      [...allSiteProducts, ...backendProducts].forEach((product) => {
        const productId = Number(product?.id);
        if (Number.isInteger(productId) && !productLookup.has(productId)) {
          productLookup.set(productId, product);
        }
      });

      return comboItems
        .map((comboItem, index) => {
          const product = productLookup.get(Number(comboItem.product_id));

          if (!product) {
            return null;
          }

          return {
            ...product,
            name: comboItem.name || product.name,
            combo_item: comboItem,
            combo_key: `${comboItem.product_id}-${index}`,
          };
        })
        .filter(Boolean);
    }

    if (backendProducts.length) {
      return backendProducts;
    }

    const fallbackProducts = selectedCategory?.products || [];
    return fallbackProducts;
  }, [allSiteProducts, categoryResponse, comboItems, selectedCategory]);

  const pageTitle = selectedCombo?.name || selectedCategory?.category_name || "Category";
  const pageDescription = selectedCombo ? "Explore products in this combo" : "Explore products in this category";
  const isComboListing = comboItems.length > 0;

  const buildCartPayload = (product, stateKey) => {
    const hasCuts = Array.isArray(product.cuttypes) && product.cuttypes.length > 0;
    const selectedCutId = selectedCuts[stateKey];
    const comboItem = product.combo_item;

    if (hasCuts && !selectedCutId) {
      toast({
        title: "Select a cut type",
        description: "Please choose a cut from the dropdown.",
        status: "warning",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
      return null;
    }

    const customerId = typeof window !== "undefined" ? localStorage.getItem("Customer_id") : null;
    if (!customerId) {
      ctx?.handleClick?.();
      return null;
    }

    const qty = comboItem ? getComboItemCartQuantity(comboItem) : Number(quantities[stateKey] ?? 1);
    const unit = comboItem
      ? getComboItemUnit(comboItem, getInitialUnit(product))
      : quantityUnits[stateKey] ?? getInitialUnit(product);

    if (!qty || qty <= 0) {
      toast({
        title: "Enter quantity",
        description: "Quantity must be at least 1.",
        status: "warning",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return null;
    }

    const fixedPrice =
      comboItem?.price_per_unit != null
        ? Number(comboItem.price_per_unit)
        : comboItem?.price != null
        ? Number(comboItem.price)
        : null;
    const fixedTotal =
      comboItem?.total_price != null
        ? Number(comboItem.total_price)
        : fixedPrice != null && comboItem
        ? Number(fixedPrice) * Number(comboItem.quantity || 1)
        : null;

    const payload = {
      customer_id: Number(customerId),
      product_id: product.id,
      product_cut_id: selectedCutId ?? null,
      quantity: qty,
      quantity_unit: unit,
      ...(fixedPrice != null ? { price_per_unit: fixedPrice } : {}),
      ...(fixedTotal != null ? { total: fixedTotal } : {}),
    };

    return payload;
  };

  const handleAddToCart = (product, stateKey) => {
    const payload = buildCartPayload(product, stateKey);
    if (!payload) {
      return;
    }

    dispatch(addProductToCart(payload))
      .then(() => {
        toast({
          title: "Added to cart",
          status: "success",
          duration: 1500,
          isClosable: true,
          position: "top",
        });
        refreshCart();
      })
      .catch((cartError) => {
        const status = cartError?.response?.status;
        const message = cartError?.response?.data?.message || "Failed to add to cart";

        if (status === 401 || /Unauthenticated/i.test(String(message))) {
          toast({
            title: "Please login",
            description: "Login required to add items to cart.",
            status: "warning",
            duration: 2500,
            isClosable: true,
            position: "top",
          });
          ctx?.handleClick?.();
          return;
        }

        toast({
          title: "Error",
          description: message,
          status: "error",
          duration: 2500,
          isClosable: true,
          position: "top",
        });
      });
  };

  const handleAddComboToCart = async () => {
    const comboProducts = products.filter((product) => product.combo_item);
    if (!comboProducts.length) {
      return;
    }

    const payloads = comboProducts
      .map((product) => buildCartPayload(product, product.combo_key || product.id))
      .filter(Boolean);

    if (payloads.length !== comboProducts.length) {
      return;
    }

    const comboGroupKey = selectedCombo?.id != null ? `combo-${selectedCombo.id}` : `combo-${Date.now()}`;

    try {
      await Promise.all(payloads.map((payload) => dispatch(addProductToCart(payload))));
      await refreshCart();
      markStoredCartItemsAsCombo(payloads, comboGroupKey);

      toast({
        title: "Combo added to cart",
        description: `${payloads.length} items added from this combo.`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    } catch (cartError) {
      const status = cartError?.response?.status;
      const message = cartError?.response?.data?.message || "Failed to add combo to cart";

      if (status === 401 || /Unauthenticated/i.test(String(message))) {
        toast({
          title: "Please login",
          description: "Login required to add items to cart.",
          status: "warning",
          duration: 2500,
          isClosable: true,
          position: "top",
        });
        ctx?.handleClick?.();
        return;
      }

      toast({
        title: "Error",
        description: message,
        status: "error",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
    }
  };

  if (!selectedCategory) {
    return (
      <Box p={6}>
        <Text fontSize="lg">Category not found.</Text>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Box mb={4}>
        <Text as="h1" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
          {pageTitle}
        </Text>
        <Text color="gray.600">{pageDescription}</Text>
        {isComboListing ? (
          <Button mt={4} colorScheme="red" onClick={handleAddComboToCart}>
            Add Combo To Cart
          </Button>
        ) : null}
      </Box>

      {loading && <Text>Loading products...</Text>}
      {error && <Text color="red.500">{String(error.message || error)}</Text>}

      <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        {products.map((product, index) => {
          const comboItem = product.combo_item;
          const stateKey = product.combo_key || product.id;
          const selectedUnit = comboItem
            ? getComboItemUnit(comboItem, getInitialUnit(product))
            : quantityUnits[stateKey] ?? getInitialUnit(product);
          const allowedUnits = comboItem ? [selectedUnit] : getAllowedUnits(product);
          const displayPrice =
            comboItem?.total_price != null
              ? Number(comboItem.total_price)
              : comboItem?.price != null
              ? Number(comboItem.price)
              : getDisplayPrice(product, selectedUnit);

          return (
            <Box
              key={product.combo_key || `${product.id}-${index}`}
              borderWidth="1px"
              borderRadius="md"
              overflow="hidden"
              display="flex"
              flexDirection="column"
              height="100%"
            >
              <Link href={buildProductRoutePath(product)} style={{ cursor: "pointer" }}>
                <Image
                  src={product.primary_image_url || assetUrl(product.primary_image)}
                  alt={product.name}
                  width="100%"
                  height="220px"
                  objectFit="cover"
                  _hover={{ opacity: 0.8 }}
                  transition="opacity 0.2s"
                />
              </Link>
              <Box p={3} flex="1" display="flex" flexDirection="column">
                <Link href={buildProductRoutePath(product)} style={{ textDecoration: "none", color: "inherit" }}>
                  <Text fontWeight="600" _hover={{ color: "#D11243" }} cursor="pointer">
                    {product.name}
                  </Text>
                </Link>
                <Text color="gray.700">
                  {comboItem
                    ? `Rs.${parseFloat(displayPrice || 0).toFixed(2)}`
                    : `Rs.${parseFloat(displayPrice || 0).toFixed(2)} / ${getUnitText(selectedUnit)}`}
                </Text>
                {comboItem ? (
                  <Text color="gray.500" fontSize="sm">
                    Combo pack: {getComboItemDisplayText(comboItem)}
                  </Text>
                ) : null}
                <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3} mt="auto" pt={2}>
                  <Box>
                    <Select
                      placeholder={product.cuttypes?.length ? "Select cut type" : "No cuts available"}
                      value={selectedCuts[stateKey] ?? ""}
                      onChange={(event) =>
                        setSelectedCuts((prev) => ({ ...prev, [stateKey]: Number(event.target.value) }))
                      }
                      isDisabled={!product.cuttypes || product.cuttypes.length === 0}
                    >
                      {(product.cuttypes || []).map((cutType) => (
                        <option key={cutType.id} value={cutType.id}>
                          {cutType.name}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    {comboItem ? (
                      <Input type="text" value={getComboItemDisplayText(comboItem)} isReadOnly />
                    ) : (
                      <Input
                        type="number"
                        min={1}
                        placeholder="Quantity"
                        value={quantities[stateKey] ?? ""}
                        onChange={(event) =>
                          setQuantities((prev) => ({ ...prev, [stateKey]: event.target.value }))
                        }
                      />
                    )}
                  </Box>
                  <Box>
                    <Select
                      placeholder="Unit"
                      value={selectedUnit}
                      onChange={(event) =>
                        setQuantityUnits((prev) => ({ ...prev, [stateKey]: event.target.value }))
                      }
                      isDisabled={Boolean(comboItem)}
                    >
                      {allowedUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  {comboItem ? null : (
                    <Box>
                      <Button width="100%" colorScheme="red" onClick={() => handleAddToCart(product, stateKey)}>
                        Add To Cart
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
        {!loading && !products.length && (
          <Box p={4}>
            <Text>No products found for this category.</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
