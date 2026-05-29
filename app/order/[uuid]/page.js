"use client";

import { useEffect, useState } from "react";
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
  Grid,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { promptLogin } from "../../../utils/auth";

export default function OrderDetailsPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";
  const uuid = params?.uuid;

  useEffect(() => {
    if (uuid) {
      fetchOrderDetails();
    }
  }, [uuid]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/order/${uuid}`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      if (error.response?.status === 401) {
        promptLogin(router);
      }
    } finally {
      setLoading(false);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box minH="60vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="#D11243" thickness="4px" />
          <Text color="gray.600">Loading order details...</Text>
        </VStack>
      </Box>
    );
  }

  if (!order) {
    return (
      <Container maxW="1200px" py={8}>
        <Box bg="white" borderRadius="lg" p={8} textAlign="center">
          <Text fontSize="2xl" mb={4}>Order not found</Text>
          <Button colorScheme="red" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box bg="#f8f9fa" minH="100vh" py={8}>
      <Container maxW="1200px">
        {/* Header */}
        <HStack mb={6} spacing={4}>
          <Button
            variant="ghost"
            onClick={() => router.push("/orders")}
            leftIcon={<span>←</span>}
          >
            Back to Orders
          </Button>
        </HStack>

        <VStack spacing={6} align="stretch">
          {/* Order Summary Card */}
          <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
            <HStack justify="space-between" mb={4} flexWrap="wrap">
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="#2d3748">
                  Order {order.order_number}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Placed on {formatDate(order.created_at)}
                </Text>
              </Box>
              <Badge
                colorScheme={getStatusColor(order.current_status_code)}
                fontSize="md"
                px={4}
                py={2}
                borderRadius="full"
                textTransform="capitalize"
              >
                {order.current_status?.name || "Pending"}
              </Badge>
            </HStack>

            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mt={6}>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>Order ID</Text>
                <Text fontWeight="600">{order.order_number || order.uuid}</Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>Payment Status</Text>
                <Badge colorScheme={order.payment_status ? "green" : "orange"}>
                  {order.payment_status ? "Paid" : "Pending"}
                </Badge>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>Delivery Date</Text>
                <Text fontWeight="600">
                  {formatDate(order.delivery_date)} ({order.delivery_time_slot})
                </Text>
              </Box>
            </Grid>
          </Box>

          {/* Order Items */}
          <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              Order Items
            </Text>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Product</Th>
                    <Th>Cut Type</Th>
                    <Th isNumeric>Quantity</Th>
                    <Th isNumeric>Price/Unit</Th>
                    <Th isNumeric>Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {order.items?.map((item, idx) => (
                    <Tr key={idx}>
                      <Td>
                        <Text fontWeight="600">{item.product_name}</Text>
                      </Td>
                      <Td>{item.cut_name || "N/A"}</Td>
                      <Td isNumeric>
                        {item.ordered_weight} {item.weight_unit}
                      </Td>
                      <Td isNumeric>₹{item.price_per_kg || item.price_per_piece}</Td>
                      <Td isNumeric fontWeight="600">₹{item.line_total}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>

            <Divider my={4} />

            {/* Price Breakdown */}
            <VStack align="stretch" spacing={2} maxW="400px" ml="auto">
              <HStack justify="space-between">
                <Text color="gray.600">Subtotal</Text>
                <Text fontWeight="600">₹{order.subtotal}</Text>
              </HStack>
              {order.discount_amount > 0 && (
                <HStack justify="space-between">
                  <Text color="gray.600">
                    Discount {order.coupon_code && `(${order.coupon_code})`}
                  </Text>
                  <Text fontWeight="600" color="green.600">
                    -₹{order.discount_amount}
                  </Text>
                </HStack>
              )}
              <HStack justify="space-between">
                <Text color="gray.600">Tax ({order.tax_percentage}%)</Text>
                <Text fontWeight="600">₹{order.tax_amount}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color="gray.600">Delivery Charges</Text>
                <Text fontWeight="600">
                  {order.delivery_charge > 0 ? `₹${order.delivery_charge}` : "FREE"}
                </Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Total Amount</Text>
                <Text fontSize="xl" fontWeight="bold" color="#D11243">
                  ₹{order.total_amount}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* Delivery Information */}
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
              <Text fontSize="xl" fontWeight="bold" mb={4}>
                📍 Delivery Address
              </Text>
              <VStack align="stretch" spacing={2}>
                <Text fontWeight="600">{order.customer?.full_name}</Text>
                <Text fontSize="sm">{order.delivery_address?.full_address}</Text>
                <Text fontSize="sm" color="gray.600">
                  Phone: {order.customer?.mobile}
                </Text>
              </VStack>
            </Box>

            {order.driver && (
              <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
                <Text fontSize="xl" fontWeight="bold" mb={4}>
                  🚚 Driver Details
                </Text>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="600">{order.driver.name}</Text>
                  <Text fontSize="sm">Vehicle: {order.driver.vehicle_number}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Phone: {order.driver.mobile}
                  </Text>
                  <Badge
                    colorScheme={order.driver.is_available ? "green" : "red"}
                    width="fit-content"
                  >
                    {order.driver.is_available ? "Available" : "Busy"}
                  </Badge>
                </VStack>
              </Box>
            )}
          </Grid>

          {/* Special Instructions */}
          {order.special_instructions && (
            <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
              <Text fontSize="xl" fontWeight="bold" mb={2}>
                📝 Special Instructions
              </Text>
              <Text color="gray.600">{order.special_instructions}</Text>
            </Box>
          )}

          {/* Actions */}
          <HStack spacing={4} justify="flex-end">
            {order.current_status?.is_cancellable && (
              <Button colorScheme="red" variant="outline">
                Cancel Order
              </Button>
            )}
            <Button colorScheme="red">
              Track Order
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
