"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  Grid,
  useToast,
  Flex,
  Icon,
  Divider,
  Avatar,
  Tooltip,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { promptLogin } from "../../../utils/auth";

export default function TrackOrderPage() {
  const [orderTracking, setOrderTracking] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";
  const uuid = params?.uuid;

  useEffect(() => {
    if (uuid) {
      fetchTrackingData();
      fetchOrderDetails();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchTrackingData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [uuid]);

  const fetchTrackingData = async () => {
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/order-statuses/${uuid}/remaining`;

      const res = await axios.post(url, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        setOrderTracking(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      toast({
        title: "Error",
        description: "Failed to load tracking information",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  };

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
        setOrderDetails(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      if (error.response?.status === 401) {
        promptLogin(router);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    setCancelLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/order/${uuid}/cancel`;

      const res = await axios.put(url, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
        // Refresh order details
        fetchOrderDetails();
        fetchTrackingData();
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const StatusIcon = ({ status }) => {
    if (status === "completed") {
      return (
        <Box
          w="40px"
          h="40px"
          borderRadius="full"
          bg="#4CAF50"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          fontSize="20px"
          fontWeight="bold"
        >
          ✓
        </Box>
      );
    }
    
    if (status === "current") {
      return (
        <Box
          w="40px"
          h="40px"
          borderRadius="full"
          bg="#FF5722"
          display="flex"
          alignItems="center"
          justifyContent="center"
          animation="pulse 2s infinite"
          boxShadow="0 0 0 0 rgba(255, 87, 34, 0.7)"
        >
          <Box
            w="16px"
            h="16px"
            borderRadius="full"
            bg="white"
          />
        </Box>
      );
    }
    
    return (
      <Box
        w="40px"
        h="40px"
        borderRadius="full"
        border="3px solid #E0E0E0"
        bg="white"
      />
    );
  };

  if (loading) {
    return (
      <Box minH="60vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="#D11243" thickness="4px" />
          <Text color="gray.600">Loading tracking information...</Text>
        </VStack>
      </Box>
    );
  }

  if (!orderDetails || !orderTracking) {
    return (
      <Container maxW="1200px" py={8}>
        <Box bg="white" borderRadius="lg" p={8} textAlign="center">
          <Text fontSize="2xl" mb={4}>Unable to track order</Text>
          <Button colorScheme="red" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
        </Box>
      </Container>
    );
  }

  const currentStatus = orderTracking.current_status;
  const completedStatuses = orderTracking.completed_statuses || [];
  const remainingStatuses = orderTracking.remaining_statuses || [];

  return (
    <Box bg="#f8f9fa" minH="100vh" py={8}>
      <Container maxW="1200px">
        {/* Header */}
        <HStack mb={6} spacing={4} justify="space-between" flexWrap="wrap">
          <Button
            variant="ghost"
            onClick={() => router.push("/orders")}
            leftIcon={<span>←</span>}
          >
            Back to Orders
          </Button>
          {currentStatus?.code !== "cancelled" && 
           currentStatus?.code !== "delivered" && 
           currentStatus?.code !== "returned" && 
           currentStatus?.code !== "failed" && (
            <Button
              colorScheme="red"
              variant="outline"
              onClick={onOpen}
              size="sm"
            >
              Cancel Order
            </Button>
          )}
        </HStack>

        <VStack spacing={6} align="stretch">
          {/* Order Info Card */}
          <Box bg="white" borderRadius="lg" p={6} boxShadow="md">
            <HStack justify="space-between" flexWrap="wrap" mb={4}>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="#2d3748">
                  Track Order #{orderDetails.order_number}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Ordered on {formatDate(orderDetails.created_at)}
                </Text>
              </Box>
              <Badge
                colorScheme="orange"
                fontSize="lg"
                px={4}
                py={2}
                borderRadius="full"
                textTransform="capitalize"
              >
                {currentStatus?.name}
              </Badge>
            </HStack>

            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mt={4}>
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>Delivery Date</Text>
                <Text fontWeight="600">{formatDate(orderDetails.delivery_date)}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>Time Slot</Text>
                <Text fontWeight="600">{orderDetails.delivery_time_slot}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>Total Amount</Text>
                <Text fontWeight="700" fontSize="lg" color="#D11243">
                  ₹{orderDetails.total_amount}
                </Text>
              </Box>
            </Grid>
          </Box>

          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
            {/* Status Timeline */}
            <Box bg="white" borderRadius="lg" p={6} boxShadow="md">
              <Text fontSize="xl" fontWeight="bold" mb={6}>
                📍 Order Journey
              </Text>

              <VStack align="stretch" spacing={0}>
                {/* Completed Statuses */}
                {completedStatuses.map((status, idx) => (
                  <Box key={status.id} position="relative">
                    <HStack spacing={4} pb={6}>
                      <Tooltip
                        label={status.updated_at ? formatDate(status.updated_at) : "Completed"}
                        placement="right"
                        hasArrow
                      >
                        <Box>
                          <StatusIcon status="completed" />
                        </Box>
                      </Tooltip>
                      <Box flex="1">
                        <Text fontWeight="600" fontSize="md" color="#2d3748">
                          {status.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Completed
                        </Text>
                      </Box>
                    </HStack>
                    {idx < completedStatuses.length - 1 && (
                      <Box
                        position="absolute"
                        left="19px"
                        top="40px"
                        width="2px"
                        height="calc(100% - 20px)"
                        bg="#4CAF50"
                      />
                    )}
                  </Box>
                ))}

                {/* Connector line between completed and current */}
                {completedStatuses.length > 0 && (
                  <Box
                    position="absolute"
                    left="19px"
                    top={`${completedStatuses.length * 80}px`}
                    width="2px"
                    height="60px"
                    bg="#4CAF50"
                  />
                )}

                {/* Current Status */}
                <Box position="relative">
                  <HStack spacing={4} pb={6}>
                    <StatusIcon status="current" />
                    <Box flex="1">
                      <Text fontWeight="700" fontSize="lg" color="#FF5722">
                        {currentStatus?.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        In Progress
                      </Text>
                    </Box>
                  </HStack>
                  {remainingStatuses.length > 0 && (
                    <Box
                      position="absolute"
                      left="19px"
                      top="40px"
                      width="2px"
                      height="calc(100% - 20px)"
                      bg="#E0E0E0"
                    />
                  )}
                </Box>

                {/* Remaining Statuses */}
                {remainingStatuses.map((status, idx) => (
                  <Box key={status.id} position="relative">
                    <HStack spacing={4} pb={6}>
                      <StatusIcon status="pending" />
                      <Box flex="1">
                        <Text fontWeight="600" fontSize="md" color="gray.500">
                          {status.name}
                        </Text>
                        <Text fontSize="sm" color="gray.400">
                          Upcoming
                        </Text>
                      </Box>
                    </HStack>
                    {idx < remainingStatuses.length - 1 && (
                      <Box
                        position="absolute"
                        left="19px"
                        top="40px"
                        width="2px"
                        height="calc(100% - 20px)"
                        bg="#E0E0E0"
                      />
                    )}
                  </Box>
                ))}
              </VStack>

              {/* Estimated completion */}
              {remainingStatuses.length > 0 && (
                <Box mt={4} p={4} bg="#FFF3E0" borderRadius="md">
                  <Text fontSize="sm" color="#E65100" fontWeight="600">
                    ⏱️ {remainingStatuses.length} step{remainingStatuses.length > 1 ? 's' : ''} remaining until delivery
                  </Text>
                </Box>
              )}
            </Box>

            {/* Driver & Delivery Info */}
            <VStack spacing={6} align="stretch">
              {/* Map Placeholder */}
              <Box bg="white" borderRadius="lg" p={6} boxShadow="md">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  🗺️ Live Route
                </Text>
                <Box
                  bg="gray.100"
                  borderRadius="md"
                  height="250px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="2px dashed #E0E0E0"
                >
                  <VStack>
                    <Text fontSize="3xl">🚚</Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Map will be displayed when<br/>driver is assigned
                    </Text>
                  </VStack>
                </Box>
              </Box>

              {/* Driver Info */}
              {orderDetails.driver && (
                <Box bg="white" borderRadius="lg" p={6} boxShadow="md">
                  <Text fontSize="lg" fontWeight="bold" mb={4}>
                    🚚 Your Driver
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    <HStack spacing={3}>
                      <Avatar
                        size="md"
                        name={orderDetails.driver.name}
                        bg="#D11243"
                        color="white"
                      />
                      <Box>
                        <Text fontWeight="600">{orderDetails.driver.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {orderDetails.driver.vehicle_number}
                        </Text>
                      </Box>
                    </HStack>
                    <Divider />
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<span>📞</span>}
                      onClick={() => window.location.href = `tel:${orderDetails.driver.mobile}`}
                    >
                      Call Driver
                    </Button>
                  </VStack>
                </Box>
              )}

              {/* Delivery Address */}
              <Box bg="white" borderRadius="lg" p={6} boxShadow="md">
                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  📍 Delivery To
                </Text>
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="600">{orderDetails.customer?.full_name}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {orderDetails.delivery_address?.full_address}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    📞 {orderDetails.customer?.mobile}
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </Grid>
        </VStack>

        <style jsx global>{`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(255, 87, 34, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(255, 87, 34, 0);
            }
          }
        `}</style>
      </Container>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel Order
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to cancel order #{orderDetails?.order_number}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose}>
                No, Keep Order
              </Button>
              <Button 
                colorScheme="red" 
                onClick={cancelOrder} 
                ml={3}
                isLoading={cancelLoading}
              >
                Yes, Cancel Order
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
