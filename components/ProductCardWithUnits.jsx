'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Image,
  Stack,
  Heading,
  Text,
  Button,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import UnitSelector from '../UnitSelector';
import useUnitSelection from '../../hooks/useUnitSelection';
import { addProductToCart } from '../../redux/ProductReducer/action';

/**
 * Example Product Card Component with Dynamic Units
 * 
 * This component demonstrates how to implement dynamic unit selection
 * in a product listing or grid.
 * 
 * Usage:
 * <ProductCardWithUnits product={product} />
 */
const ProductCardWithUnits = ({ product, onAddToCart }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const [addingToCart, setAddingToCart] = useState(false);
  
  const { selectedUnit, displayPrice, allowedUnits, handleUnitChange } = 
    useUnitSelection(product);

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);

      const customerId = typeof window !== 'undefined' 
        ? localStorage.getItem('customer_id')
        : null;

      const cartItem = {
        product_id: product.id,
        customer_id: customerId ? Number(customerId) : null,
        quantity: 1,
        quantity_unit: selectedUnit,
        product_cut_id: product.product_cut_id || null,
      };

      await dispatch(addProductToCart(cartItem));
      
      toast({
        title: "Success",
        description: `Added ${product.title} (${selectedUnit}) to cart`,
        status: "success",
        duration: 3,
        isClosable: true,
      });

      if (onAddToCart) {
        onAddToCart(product, selectedUnit);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add to cart",
        status: "error",
        duration: 3,
        isClosable: true,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Card 
      maxW="sm" 
      overflow="hidden" 
      boxShadow="md"
      transition="all 0.3s ease"
      _hover={{ boxShadow: "lg", transform: "translateY(-4px)" }}
    >
      <CardBody p={0}>
        {/* Product Image */}
        <Box h="200px" overflow="hidden" bg="gray.100">
          <Image
            src={product.image}
            alt={product.title}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        </Box>

        {/* Product Info */}
        <Stack p={4} spacing={3}>
          {/* Category */}
          <Text fontSize="sm" color="gray.500" fontWeight="600">
            {product.category}
          </Text>

          {/* Title */}
          <Heading size="md" noOfLines={2}>
            {product.title}
          </Heading>

          {/* Weight Info */}
          {product.weight_in_grams && (
            <Text fontSize="sm" color="gray.600">
              {product.weight_in_grams}g • Serves {product.serves || 4}
            </Text>
          )}

          {/* Unit Selector */}
          {allowedUnits.length > 1 && (
            <UnitSelector
              allowedUnits={allowedUnits}
              selectedUnit={selectedUnit}
              onChange={handleUnitChange}
              options={{ 
                label: 'Size:',
                showLabel: true,
                size: 'sm'
              }}
            />
          )}

          {/* Price and Button */}
          <Flex justifyContent="space-between" alignItems="center" pt={2}>
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              color="#d11243"
            >
              ₹{displayPrice}
            </Text>
            <Button
              size="sm"
              bg="#D11243"
              color="white"
              onClick={handleAddToCart}
              isLoading={addingToCart}
              _hover={{ bg: "#b00d38" }}
              fontSize="xs"
              fontWeight="600"
            >
              Add
            </Button>
          </Flex>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default ProductCardWithUnits;
