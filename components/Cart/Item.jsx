'use client';

import { Box, Flex, Text, Image, IconButton, useToast } from "@chakra-ui/react";
import api from "../../utils/api";
import { AddIcon, MinusIcon, DeleteIcon } from "@chakra-ui/icons";
import { readStoredCart, writeStoredCart } from "../../utils/cartStorage";

const Item = ({ label, price, qyt, hendalqty, id, image, unit, unitPrice, totalPrice, onItemRemoved }) => {
  const toast = useToast();

  const removeItem = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";
      const sep = base.endsWith("/") ? "" : "/";
      const url = `${base}${sep}api/v1/${apiType}/cart/${id}`;
      const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
      
      await api.delete(`/api/v1/${apiType}/cart/${id}`);
      
      const updatedItems = readStoredCart().filter((item) => item.id !== id);
      writeStoredCart(updatedItems);
      
      toast({
        title: "Item removed",
        description: `${label} has been removed from your cart`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
      // Call the callback to update parent component
      if (onItemRemoved) {
        onItemRemoved(id);
      }
      
    } catch (error) {
      toast({
        title: "Error removing item",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      p={3}
      mb={3}
      boxShadow="sm"
      _hover={{ boxShadow: "md" }}
    >
      <Flex gap={3} align="center">
        {/* Product Image */}
        <Box flexShrink={0}>
          <Image
            src={image || "/images/logo/logo.webp"}
            alt={label}
            boxSize="60px"
            objectFit="cover"
            borderRadius="md"
            fallbackSrc="/images/logo/logo.webp"
          />
        </Box>

        {/* Product Details */}
        <Box flex={1}>
          <Text fontSize="sm" fontWeight="600" noOfLines={2} mb={1}>
            {label}
          </Text>
          <Text fontSize="xs" color="gray.600" mb={1}>
            ₹{parseFloat(unitPrice || price).toFixed(2)} / {unit || "unit"}
          </Text>
          <Text fontSize="md" fontWeight="bold" color="#D11243">
            ₹{parseFloat(totalPrice || price).toFixed(2)}
          </Text>
        </Box>

        {/* Quantity Controls */}
        <Flex align="center" gap={2} flexDir="column">
          <Flex align="center" gap={2}>
            <IconButton
              icon={<MinusIcon />}
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => hendalqty(id, -1)}
              aria-label="Decrease quantity"
              isDisabled={parseFloat(qyt) <= 0.001}
            />
            <Box textAlign="center" minW="50px">
              <Text fontSize="sm" fontWeight="600">
                {parseFloat(qyt).toFixed(3)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {unit || "unit"}
              </Text>
            </Box>
            <IconButton
              icon={<AddIcon />}
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => hendalqty(id, 1)}
              aria-label="Increase quantity"
            />
          </Flex>
          {/* Remove Button */}
          <IconButton
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            variant="solid"
            onClick={removeItem}
            aria-label="Remove item"
            mt={1}
          />
        </Flex>
      </Flex>
    </Box>
  );
};
export default Item;

