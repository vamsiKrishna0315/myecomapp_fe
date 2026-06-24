"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Button,
  Spinner,
  Image,
  Grid,
  useToast,
  Flex,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSiteData } from "../../components/Context/SiteDataContext";
import { promptLogin } from "../../utils/auth";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const router = useRouter();
  const toast = useToast();
  const { siteData } = useSiteData();

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";

  const productIndex = useMemo(() => {
    const index = new Map();
    const categories = siteData?.categories || [];
    categories.forEach((category) => {
      (category.products || []).forEach((product) => index.set(product.id, product));
    });
    return index;
  }, [siteData]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/orders?page=${currentPage}`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.meta) {
          setTotalPages(res.data.meta.last_page || 1);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        toast({
          title: "Session expired",
          description: "Please login again",
          status: "error",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
        promptLogin(router);
      }
    } finally {
      setLoading(false);
    }
  }, [API_TYPE, BASE_URL, currentPage, router, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    onOpen();
  };

  const cancelOrder = async () => {
    if (!selectedOrder) return;

    setCancelLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/order/${selectedOrder.uuid}/cancel`;

      const res = await axios.put(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data.success) {
        toast({
          title: "Success",
          description: "Order cancelled successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
        onClose();
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel order",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (statusCode) => {
    const statusColors = {
      pending: "orange",
      confirmed: "blue",
      processing: "cyan",
      packed: "purple",
      assigned_to_driver: "orange",
      out_for_delivery: "teal",
      delivered: "green",
      cancelled: "red",
    };
    return statusColors[statusCode?.toLowerCase()] || "gray";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading && currentPage === 1) {
    return (
      <Box minH="60vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="#D11243" thickness="4px" />
          <Text color="gray.600">Loading your orders...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg="#f8f9fa" minH="100vh" py={8}>
      <Container maxW="1200px">
        <Box mb={6}>
          <Text fontSize="3xl" fontWeight="bold" color="#2d3748" mb={2}>
            My Orders
          </Text>
          <Text color="gray.600">Track, manage and review your orders</Text>
        </Box>

        {orders.length === 0 ? (
          <Box bg="white" borderRadius="lg" p={12} textAlign="center" boxShadow="sm">
            <Text fontSize="6xl" mb={4}>
              📦
            </Text>
            <Text fontSize="xl" fontWeight="600" color="gray.700" mb={2}>
              No orders yet
            </Text>
            <Text color="gray.600" mb={6}>
              Start shopping to see your orders here
            </Text>
            <Button colorScheme="red" size="lg" onClick={() => router.push("/")}>
              Start Shopping
            </Button>
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {orders.map((order) => (
              <Box
                key={order.id}
                bg="white"
                borderRadius="lg"
                overflow="hidden"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="all 0.2s"
              >
                <Box bg="#f7fafc" p={4} borderBottom="1px solid #e2e8f0">
                  <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={4}>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        ORDER NUMBER
                      </Text>
                      <Text fontWeight="600" fontSize="sm">
                        {order.order_number}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        ORDER DATE
                      </Text>
                      <Text fontWeight="600" fontSize="sm">
                        {formatDate(order.created_at)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        TOTAL AMOUNT
                      </Text>
                      <Text fontWeight="700" fontSize="lg" color="#D11243">
                        Rs {order.total_amount}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        STATUS
                      </Text>
                      <Badge
                        colorScheme={getStatusColor(order.current_status_code)}
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                        textTransform="capitalize"
                      >
                        {order.current_status?.name || "Pending"}
                      </Badge>
                    </Box>
                  </Grid>
                </Box>

                <Box p={4}>
                  <VStack align="stretch" spacing={3}>
                    {order.items?.map((item, idx) => {
                      const product = productIndex.get(item.product_id);
                      const imageSrc =
                        item.product?.primary_image_url ||
                        product?.primary_image_url ||
                        "/images/logo/logo.webp";

                      return (
                        <Box key={idx}>
                          <HStack spacing={3} align="start">
                            <Box
                              w="60px"
                              h="60px"
                              bg="gray.100"
                              borderRadius="md"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="2xl"
                              overflow="hidden"
                              flexShrink={0}
                            >
                              {imageSrc ? (
                                <Image
                                  src={imageSrc}
                                  alt={item.product_name || "Product image"}
                                  w="100%"
                                  h="100%"
                                  objectFit="cover"
                                  fallback={
                                    <Box
                                      w="100%"
                                      h="100%"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      fontSize="2xl"
                                    >
                                      🍗
                                    </Box>
                                  }
                                />
                              ) : (
                                "🍗"
                              )}
                            </Box>
                            <Box flex="1">
                              <Text fontWeight="600" fontSize="md">
                                {item.product_name}
                              </Text>
                              {item.cut_name && (
                                <Text fontSize="sm" color="gray.600">
                                  Cut: {item.cut_name}
                                </Text>
                              )}
                              <HStack spacing={4} mt={1}>
                                <Text fontSize="sm" color="gray.600">
                                  {item.ordered_weight} {item.weight_unit}
                                </Text>
                                <Text fontSize="sm" fontWeight="600" color="#D11243">
                                  Rs {item.line_total}
                                </Text>
                              </HStack>
                            </Box>
                          </HStack>
                          {idx < order.items.length - 1 && <Divider mt={3} />}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                <Box bg="#f7fafc" p={4} borderTop="1px solid #e2e8f0">
                  <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={4}>
                    <Box>
                      <HStack spacing={2} mb={2}>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          📍 Delivery Address:
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {order.delivery_address?.full_address}
                      </Text>
                      {order.delivery_date && (
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          🕐 Delivery: {formatDate(order.delivery_date)} {order.delivery_time_slot}
                        </Text>
                      )}
                      {order.driver && (
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          🚚 Driver: {order.driver.name} ({order.driver.mobile})
                        </Text>
                      )}
                    </Box>
                    <Flex
                      direction={{ base: "row", md: "column" }}
                      gap={2}
                      justify={{ base: "flex-start", md: "flex-end" }}
                    >
                      {!order.current_status_code?.includes("delivered") &&
                        !order.current_status_code?.includes("cancelled") && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => router.push(`/track-order/${order.uuid}`)}
                          >
                            Track Order
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => router.push(`/order/${order.uuid}`)}
                      >
                        View Details
                      </Button>
                      {Boolean(order.current_status?.is_cancellable) && (
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => handleCancelClick(order)}
                        >
                          Cancel Order
                        </Button>
                      )}
                    </Flex>
                  </Grid>
                </Box>
              </Box>
            ))}
          </VStack>
        )}

        {orders.length > 0 && totalPages > 1 && (
          <Flex justify="center" mt={8} gap={2}>
            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              isDisabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            {[...Array(totalPages)].map((_, idx) => (
              <Button
                key={idx + 1}
                size="sm"
                colorScheme={currentPage === idx + 1 ? "red" : "gray"}
                variant={currentPage === idx + 1 ? "solid" : "outline"}
                onClick={() => setCurrentPage(idx + 1)}
                isDisabled={loading}
              >
                {idx + 1}
              </Button>
            ))}
            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              isDisabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </Flex>
        )}
      </Container>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel Order
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to cancel order #{selectedOrder?.order_number}?
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                No, Keep Order
              </Button>
              <Button colorScheme="red" onClick={cancelOrder} ml={3} isLoading={cancelLoading}>
                Yes, Cancel Order
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
