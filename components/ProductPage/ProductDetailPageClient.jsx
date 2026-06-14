"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Input,
  List,
  ListItem,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  StackDivider,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import React from "react";
import { addProductToCart } from "../../redux/ProductReducer/action";
import { useSiteData } from "../Context/SiteDataContext";
import { useCart } from "../Context/CartContext";
import { AppContext } from "../Context/ContextProvider";
import { buildProductApiUrl } from "../../utils/product";

export default function ProductDetailPageClient({ productId, initialProduct = null }) {
  const toast = useToast();
  const dispatch = useDispatch();
  const { assetUrl } = useSiteData();
  const { refreshCart } = useCart();
  const ctx = React.useContext(AppContext);

  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState(null);
  const [selectedCutId, setSelectedCutId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [quantityUnit, setQuantityUnit] = useState("gram");

  useEffect(() => {
    setProduct(initialProduct);
    setLoading(!initialProduct);
    setError(null);
  }, [initialProduct]);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId || (initialProduct && String(initialProduct.id) === String(productId))) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(buildProductApiUrl(productId), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Product fetch failed: ${res.status}`);
        }

        const json = await res.json();
        setProduct(json?.data || json);
      } catch (fetchError) {
        setError(fetchError);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [initialProduct, productId]);

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    const hasCuts = Array.isArray(product.cuttypes) && product.cuttypes.length > 0;
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

    const qty = Number(quantity);
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
      product_cut_id: selectedCutId || null,
      quantity: qty,
      quantity_unit: quantityUnit,
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

  const stripHtml = (html) => {
    if (!html) {
      return "";
    }

    return String(html).replace(/<[^>]+>/g, "").trim();
  };

  if (loading) {
    return (
      <Container maxW="7xl" py={12} textAlign="center">
        <Spinner size="xl" color="#D11243" />
        <Text mt={4}>Loading product details...</Text>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxW="7xl" py={12}>
        <Text color="red.500" fontSize="lg">
          {error ? String(error.message || error) : "Product not found"}
        </Text>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" mt={8} mb={8}>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: 8, md: 10 }}
        py={{ base: 6, md: 10 }}
        bg="white"
        borderRadius="lg"
        boxShadow="lg"
        p={{ base: 4, md: 8 }}
      >
        <Flex justifyContent="center" alignItems="center">
          <Image
            rounded="md"
            alt={product.name}
            src={product.primary_image_url || assetUrl(product.primary_image)}
            fit="contain"
            align="center"
            w="100%"
            h={{ base: "300px", sm: "400px", lg: "500px" }}
            objectFit="cover"
            boxShadow="md"
          />
        </Flex>

        <Stack spacing={{ base: 6, md: 8 }}>
          <Box as="header">
            <Heading lineHeight={1.1} fontWeight={600} fontSize={{ base: "2xl", sm: "3xl", lg: "4xl" }} mb={2}>
              {product.name}
            </Heading>
            {product.category && (
              <Text color="gray.600" fontSize="md" mb={2}>
                {product.category.category_name || product.category}
              </Text>
            )}
            <Text color="#D11243" fontWeight={700} fontSize={{ base: "2xl", lg: "3xl" }}>
              Rs.{parseFloat(product.price).toFixed(2)}
            </Text>
            {product.sku && (
              <Badge colorScheme="gray" mt={2}>
                SKU: {product.sku}
              </Badge>
            )}
          </Box>

          <StackDivider borderColor="gray.200" />

          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="600">
              Description
            </Text>
            {product.description && (
              <Text color="gray.700" fontSize="md">
                {stripHtml(product.description)}
              </Text>
            )}
            {product.long_description && (
              <Text color="gray.600" fontSize="sm">
                {stripHtml(product.long_description)}
              </Text>
            )}
          </VStack>

          {product.specifications && (
            <Box>
              <Text fontSize="lg" fontWeight="600" mb={3}>
                Specifications
              </Text>
              <List spacing={2}>
                {typeof product.specifications === "object" ? (
                  Object.entries(product.specifications).map(([key, value]) => (
                    <ListItem key={key} fontSize="sm">
                      <Text as="span" fontWeight="600">
                        {key}:
                      </Text>{" "}
                      {value}
                    </ListItem>
                  ))
                ) : (
                  <Text fontSize="sm">{product.specifications}</Text>
                )}
              </List>
            </Box>
          )}

          <StackDivider borderColor="gray.200" />

          <Stack spacing={4}>
            {product.cuttypes && product.cuttypes.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2}>
                  Select Cut Type
                </Text>
                <Select placeholder="Choose cut type" value={selectedCutId} onChange={(e) => setSelectedCutId(Number(e.target.value))}>
                  {product.cuttypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </Select>
              </Box>
            )}

            <SimpleGrid columns={2} spacing={3}>
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2}>
                  Quantity
                </Text>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2}>
                  Unit
                </Text>
                <Select value={quantityUnit} onChange={(e) => setQuantityUnit(e.target.value)}>
                  <option value="gram">gram</option>
                  <option value="kg">kg</option>
                  <option value="piece">piece</option>
                  <option value="pack">pack</option>
                </Select>
              </Box>
            </SimpleGrid>

            <Button size="lg" colorScheme="red" bg="#D11243" _hover={{ bg: "#B01035" }} onClick={handleAddToCart}>
              Add to Cart
            </Button>
          </Stack>
        </Stack>
      </SimpleGrid>
    </Container>
  );
}
