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
import { buildProductRoutePath, findCategoryBySlug } from "../../utils/seo";
import { getAllowedUnits, getDisplayPrice, getInitialUnit, getUnitText } from "../../utils/productUnits";

export default function CategoryPageClient({ slug, initialSelectedCategory = null }) {
  const { siteData, assetUrl } = useSiteData();
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

    if (backendProducts.length) {
      return backendProducts;
    }

    return selectedCategory?.products || [];
  }, [categoryResponse, selectedCategory]);

  const handleAddToCart = (product) => {
    const hasCuts = Array.isArray(product.cuttypes) && product.cuttypes.length > 0;
    const selectedCutId = selectedCuts[product.id];

    if (hasCuts && !selectedCutId) {
      toast({
        title: "Select a cut type",
        description: "Please choose a cut from the dropdown.",
        status: "warning",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const customerId = typeof window !== "undefined" ? localStorage.getItem("Customer_id") : null;
    if (!customerId) {
      ctx?.handleClick?.();
      return;
    }

    const qty = Number(quantities[product.id] ?? 1);
    const unit = quantityUnits[product.id] ?? getInitialUnit(product);

    if (!qty || qty <= 0) {
      toast({
        title: "Enter quantity",
        description: "Quantity must be at least 1.",
        status: "warning",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const payload = {
      customer_id: Number(customerId),
      product_id: product.id,
      product_cut_id: selectedCutId ?? null,
      quantity: qty,
      quantity_unit: unit,
    };

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
          {selectedCategory.category_name}
        </Text>
        <Text color="gray.600">Explore products in this category</Text>
      </Box>

      {loading && <Text>Loading products...</Text>}
      {error && <Text color="red.500">{String(error.message || error)}</Text>}

      <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        {products.map((product) => {
          const selectedUnit = quantityUnits[product.id] ?? getInitialUnit(product);
          const allowedUnits = getAllowedUnits(product);
          const displayPrice = getDisplayPrice(product, selectedUnit);

          return (
            <Box
              key={product.id}
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
                  Rs.{parseFloat(displayPrice || 0).toFixed(2)} / {getUnitText(selectedUnit)}
                </Text>
                <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3} mt="auto" pt={2}>
                  <Box>
                    <Select
                      placeholder={product.cuttypes?.length ? "Select cut type" : "No cuts available"}
                      value={selectedCuts[product.id] ?? ""}
                      onChange={(event) =>
                        setSelectedCuts((prev) => ({ ...prev, [product.id]: Number(event.target.value) }))
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
                    <Input
                      type="number"
                      min={1}
                      placeholder="Quantity"
                      value={quantities[product.id] ?? ""}
                      onChange={(event) =>
                        setQuantities((prev) => ({ ...prev, [product.id]: event.target.value }))
                      }
                    />
                  </Box>
                  <Box>
                    <Select
                      placeholder="Unit"
                      value={selectedUnit}
                      onChange={(event) =>
                        setQuantityUnits((prev) => ({ ...prev, [product.id]: event.target.value }))
                      }
                    >
                      {allowedUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Button width="100%" colorScheme="red" onClick={() => handleAddToCart(product)}>
                      Add To Cart
                    </Button>
                  </Box>
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
