'use client';

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Input, Box, Text, Image, Spinner, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { buildProductRoutePath } from "../../utils/seo";
import "./Search.css";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      setShowResults(true);

      try {
        const sep = BASE_URL.endsWith("/") ? "" : "/";
        const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/category`;
        
        const res = await axios.post(url, {
          category_name: searchQuery
        });

        if (res.data.success && res.data.data) {
          let products = [];
          
          // Handle array or single object response
          const categoryData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
          
          categoryData.forEach((category) => {
            if (category.products && Array.isArray(category.products)) {
              products = [...products, ...category.products];
            }
          });

          // Filter products by search query
          const filteredProducts = products.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setSearchResults(filteredProducts.slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, BASE_URL, API_TYPE]);

  const handleProductClick = (product) => {
    router.push(buildProductRoutePath(product));
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <Box w="100%" h="100%" position="relative" ref={searchRef}>
      <Input
        w="100%"
        className="search_input"
        placeholder="Search for any delicious product"
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery && setShowResults(true)}
        bg="white"
        borderRadius="md"
        _focus={{ borderColor: "#D11243", boxShadow: "0 0 0 1px #D11243" }}
      />

      {showResults && (
        <Box
          position="absolute"
          top="calc(100% + 8px)"
          left="0"
          right="0"
          bg="white"
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
          borderRadius="md"
          maxH="400px"
          overflowY="auto"
          zIndex="1000"
          border="1px solid #e2e8f0"
        >
          {loading ? (
            <Box p={4} textAlign="center">
              <Spinner size="md" color="#D11243" />
              <Text mt={2} fontSize="sm" color="gray.600">Searching...</Text>
            </Box>
          ) : searchResults.length > 0 ? (
            <VStack spacing={0} align="stretch">
              {searchResults.map((product) => (
                <Box
                  key={product.id}
                  p={3}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  cursor="pointer"
                  _hover={{ bg: "#f7fafc" }}
                  borderBottom="1px solid #e2e8f0"
                  onClick={() => handleProductClick(product)}
                >
                  <Image
                    src={product.primary_image_url || "/images/logo/logo.webp"}
                    alt={product.name}
                    boxSize="50px"
                    objectFit="cover"
                    borderRadius="md"
                    fallbackSrc="/images/logo/logo.webp"
                  />
                  <Box flex="1">
                    <Text fontWeight="600" fontSize="14px" color="#2d3748" noOfLines={1}>
                      {product.name}
                    </Text>
                    {product.price && (
                      <Text fontSize="13px" color="#D11243" fontWeight="bold">
                        ₹{product.price}
                      </Text>
                    )}
                  </Box>
                </Box>
              ))}
            </VStack>
          ) : searchQuery ? (
            <Box p={4} textAlign="center">
              <Text fontSize="sm" color="gray.600">
                {`No products found for "${searchQuery}"`}
              </Text>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export default Search;
