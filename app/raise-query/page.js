"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Text,
  VStack,
  Textarea,
  Button,
  useToast,
  FormControl,
  FormLabel,
  Select,
  Icon,
  Flex,
  HStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { promptLogin } from "../../utils/auth";

export default function RaiseQueryPage() {
  const [formData, setFormData] = useState({
    issue_type: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";

  const issueTypes = [
    { value: "product", label: "Product Issue" },
    { value: "service", label: "Service Issue" },
    { value: "driver", label: "Driver Issue" },
    { value: "vendor", label: "Vendor Issue" },
    { value: "website", label: "Website Issue" },
    { value: "other", label: "Any Other" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.issue_type) {
      toast({
        title: "Error",
        description: "Please select an issue type",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter your message",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/query`;

      const res = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        toast({
          title: "Success!",
          description: "Your query has been submitted successfully. We'll get back to you soon.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
        
        // Reset form
        setFormData({
          issue_type: "",
          message: "",
        });
      }
    } catch (error) {
      console.error("Error submitting query:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit query. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      
      if (error.response?.status === 401) {
        promptLogin(router);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" minH="100vh" py={12}>
      <Container maxW="700px">
        <VStack spacing={8}>
          {/* Header */}
          <Box textAlign="center" color="white">
            <Icon viewBox="0 0 24 24" boxSize={16} mb={4}>
              <path
                fill="currentColor"
                d="M21,15A2,2 0 0,1 19,17H7C6.45,17 6,16.55 6,16V4C6,3.45 6.45,3 7,3H19A2,2 0 0,1 21,5V15M1,18V8H3V18A2,2 0 0,0 5,20H17V22H5A4,4 0 0,1 1,18M13,6V8H17V6H13M9,6A1,1 0 0,0 8,7A1,1 0 0,0 9,8A1,1 0 0,0 10,7A1,1 0 0,0 9,6M9,9A1,1 0 0,0 8,10A1,1 0 0,0 9,11A1,1 0 0,0 10,10A1,1 0 0,0 9,9M9,12A1,1 0 0,0 8,13A1,1 0 0,0 9,14A1,1 0 0,0 10,13A1,1 0 0,0 9,12M13,9V11H17V9H13M13,12V14H17V12H13Z"
              />
            </Icon>
            <Text fontSize="4xl" fontWeight="bold" mb={2}>
              Raise a Query
            </Text>
            <Text fontSize="lg" opacity={0.9}>
              {"We're here to help! Let us know what's on your mind."}
            </Text>
          </Box>

          {/* Query Form */}
          <Box
            as="form"
            onSubmit={handleSubmit}
            bg="white"
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="2xl"
            w="100%"
            p={8}
          >
            <VStack spacing={6} align="stretch">
              {/* Issue Type Selection */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="600"
                  color="gray.700"
                  mb={3}
                >
                  🏷️ Select Issue Type
                </FormLabel>
                <Select
                  name="issue_type"
                  value={formData.issue_type}
                  onChange={handleInputChange}
                  placeholder="Choose an issue type"
                  size="lg"
                  borderRadius="lg"
                  focusBorderColor="#667eea"
                  bg="gray.50"
                  _hover={{ bg: "gray.100" }}
                  icon={
                    <Icon viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                      />
                    </Icon>
                  }
                >
                  {issueTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Message */}
              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="600"
                  color="gray.700"
                  mb={3}
                >
                  💬 Your Message
                </FormLabel>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Please describe your issue in detail. The more information you provide, the better we can assist you."
                  rows={8}
                  size="lg"
                  borderRadius="lg"
                  focusBorderColor="#667eea"
                  bg="gray.50"
                  _hover={{ bg: "gray.100" }}
                  resize="vertical"
                />
                <Text fontSize="sm" color="gray.500" mt={2}>
                  {formData.message.length}/500 characters
                </Text>
              </FormControl>

              {/* Info Box */}
              <Box
                bg="blue.50"
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="blue.200"
              >
                <HStack spacing={3} align="start">
                  <Icon viewBox="0 0 24 24" boxSize={6} color="blue.600" mt={0.5}>
                    <path
                      fill="currentColor"
                      d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                    />
                  </Icon>
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="600" color="blue.800">
                      Quick Response Tips
                    </Text>
                    <Text fontSize="sm" color="blue.700">
                      • Include order number if your query is related to an order
                      <br />
                      • Be specific about the product or service in question
                      <br />• We aim to respond within 24-48 hours
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              {/* Submit Button */}
              <Flex gap={3}>
                <Button
                  type="submit"
                  flex={1}
                  size="lg"
                  bgGradient="linear(to-r, #667eea, #764ba2)"
                  color="white"
                  _hover={{
                    bgGradient: "linear(to-r, #5568d3, #6a3f8f)",
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                  transition="all 0.2s"
                  isLoading={isSubmitting}
                  loadingText="Submitting..."
                  leftIcon={
                    <Icon viewBox="0 0 24 24" boxSize={5}>
                      <path
                        fill="currentColor"
                        d="M2,21L23,12L2,3V10L17,12L2,14V21Z"
                      />
                    </Icon>
                  }
                >
                  Submit Query
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => router.push("/")}
                  _hover={{
                    bg: "gray.100",
                  }}
                >
                  Cancel
                </Button>
              </Flex>
            </VStack>
          </Box>

          {/* Additional Help */}
          <Box
            bg="whiteAlpha.200"
            backdropFilter="blur(10px)"
            borderRadius="xl"
            p={6}
            border="1px solid"
            borderColor="whiteAlpha.300"
            color="white"
            textAlign="center"
          >
            <Text fontSize="sm" mb={2}>
              Need immediate assistance?
            </Text>
            <HStack justify="center" spacing={6}>
              <HStack>
                <Icon viewBox="0 0 24 24" boxSize={5}>
                  <path
                    fill="currentColor"
                    d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"
                  />
                </Icon>
                <Text fontSize="sm" fontWeight="600">
                  Call: 1800-123-4567
                </Text>
              </HStack>
              <HStack>
                <Icon viewBox="0 0 24 24" boxSize={5}>
                  <path
                    fill="currentColor"
                    d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"
                  />
                </Icon>
                <Text fontSize="sm" fontWeight="600">
                  support@licious.com
                </Text>
              </HStack>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
