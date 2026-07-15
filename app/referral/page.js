"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Spinner,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import api from "../../utils/api";
import { promptLogin } from "../../utils/auth";

export default function ReferralPage() {
  const [referral, setReferral] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  const apiType = process.env.NEXT_PUBLIC_API_TYPE || "customer";

  useEffect(() => {
    loadReferral();
  }, []);

  const loadReferral = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const [generateRes, analyticsRes] = await Promise.all([
        api.post(`/api/v1/${apiType}/referral/generate`),
        api.get(`/api/v1/${apiType}/referral/analytics`),
      ]);

      setReferral(generateRes.data?.data || null);
      setAnalytics(analyticsRes.data?.data || null);
    } catch (error) {
      if (error.response?.status === 401) {
        promptLogin(router);
        return;
      }

      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load your referral link.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!referral?.share_url) return;

    try {
      await navigator.clipboard.writeText(referral.share_url);
      toast({
        title: "Copied",
        description: "Referral link copied to clipboard.",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    } catch (_) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  };

  if (loading) {
    return (
      <Box minH="80vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="#D11243" thickness="4px" />
          <Text color="gray.600">Loading your referral link...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg="white" minH="100vh" py={8}>
      <Container maxW="600px">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Refer & Earn
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Share your link — you get credit for every successful order placed with it.
            </Text>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                Your referral code
              </Text>
              <HStack>
                <Input value={referral?.code || ""} isReadOnly borderColor="gray.300" />
                <Button
                  bg="#D11243"
                  color="white"
                  px={6}
                  onClick={handleCopy}
                  _hover={{ bg: "#A00E35" }}
                  flexShrink={0}
                >
                  Copy Link
                </Button>
              </HStack>
              <Text fontSize="xs" color="gray.500" wordBreak="break-all">
                {referral?.share_url}
              </Text>
            </VStack>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <Text fontSize="sm" fontWeight="600" color="gray.700" mb={4}>
              Performance
            </Text>
            <SimpleGrid columns={2} spacing={4}>
              <Stat>
                <StatLabel>Total Orders</StatLabel>
                <StatNumber>{analytics?.total_orders ?? 0}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Successful Orders</StatLabel>
                <StatNumber>{analytics?.successful_orders ?? 0}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Pending Orders</StatLabel>
                <StatNumber>{analytics?.pending_orders ?? 0}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Discount Given</StatLabel>
                <StatNumber>Rs {Number(analytics?.total_discount_given ?? 0).toFixed(2)}</StatNumber>
              </Stat>
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
