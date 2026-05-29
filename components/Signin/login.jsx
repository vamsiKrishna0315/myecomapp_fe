'use client';

import {
  Input,
  Box,
  Text,
  Button,
  FormControl,
  FormErrorMessage,
  Heading,
  VStack,
  HStack,
  useToast,
  Flex,
  Container,
  SimpleGrid,
  Image,
  Spinner,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

import { PasswordInput } from "./PasswordInput";

// Use environment variables for backend base URL and API type
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:5000";
const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer"; // 'customer' or 'driver'

const Login = () => {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  // Redirect to home if already logged in
  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("Token")) {
      router.replace("/");
    }
  }, [router]);

  const validateForm = () => {
    const newErrors = {};
    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClick = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    setIsLoading(true);
    try {
      const endpoint = `${BASE_URL}/api/v1/customer/login`;
      const response = await axios.post(endpoint, {
        mobile: mobile,
        password: password,
      });
      const data = response.data.data;
      // Store token and user info
      localStorage.setItem("Token", data.token);
      localStorage.setItem("User_name", data.customer.full_name || "");
      localStorage.setItem("User_mobile", data.customer.mobile || "");
      localStorage.setItem("User_email", data.customer.email || "");
      // Optionally store more user info as needed
      toast({
        title: "Login Successful!",
        description: response.data.message || "Welcome back!",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      router.replace("/");
    } catch (err) {
      setIsLoading(false);
      setError(true);
      toast({
        title: "Login Failed",
        description: err.response?.data?.message || "Invalid credentials or server error.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden">
      {/* Animated Background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #d11243 75%, #ff6b6b 100%)"
        backgroundSize="400% 400%"
        animation="gradient 15s ease infinite"
        sx={{
          '@keyframes gradient': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }}
      />

      {/* Floating Shapes */}
      <Box position="absolute" top="15%" left="8%" w="90px" h="90px" borderRadius="50%" bg="whiteAlpha.200" filter="blur(40px)" />
      <Box position="absolute" top="70%" right="12%" w="120px" h="120px" borderRadius="50%" bg="whiteAlpha.300" filter="blur(60px)" />
      <Box position="absolute" bottom="12%" left="35%" w="100px" h="100px" borderRadius="50%" bg="whiteAlpha.200" filter="blur(50px)" />

      <Flex minH="100vh" align="center" justify="center" position="relative" zIndex="1" py={8} px={4}>
        <Container maxW="container.sm">
          <SimpleGrid columns={1} spacing={0} alignItems="center">
            <Box>
              <Box
                bg="whiteAlpha.200"
                backdropFilter="blur(20px)"
                borderRadius="3xl"
                border="1px solid"
                borderColor="whiteAlpha.300"
                p={{ base: 6, md: 10 }}
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
              >
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center" mb={2}>
                    <Image w="120px" m="auto" src="/images/logo/logo.webp" alt="Logo" mb={2} />
                    <Heading
                      as="h2"
                      fontSize="3xl"
                      fontWeight="800"
                      color="white"
                      mb={2}
                    >
                      Sign In
                    </Heading>
                    <Text color="whiteAlpha.900" fontSize="md">
                      Welcome back! Please login to your account
                    </Text>
                  </Box>


                  {/* Mobile */}
                  <FormControl isInvalid={errors.mobile}>
                    <Input
                      placeholder="Mobile Number"
                      type="tel"
                      size="lg"
                      bg="whiteAlpha.900"
                      border="2px solid transparent"
                      borderRadius="xl"
                      color="gray.800"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      _placeholder={{ color: "gray.500" }}
                      _hover={{ bg: "white" }}
                      _focus={{
                        bg: "white",
                        borderColor: "#d11243",
                        boxShadow: "0 0 0 3px rgba(209, 18, 67, 0.1)",
                      }}
                      transition="all 0.2s"
                    />
                    <FormErrorMessage color="white" fontWeight="600" bg="blackAlpha.400" px={3} py={1} borderRadius="md" mt={2}>
                      {errors.mobile}
                    </FormErrorMessage>
                  </FormControl>

                  {/* Password */}
                  <FormControl isInvalid={errors.password}>
                    <Box
                      bg="whiteAlpha.900"
                      borderRadius="xl"
                      border="2px solid transparent"
                      _hover={{ bg: "white" }}
                      _focusWithin={{
                        bg: "white",
                        borderColor: "#d11243",
                        boxShadow: "0 0 0 3px rgba(209, 18, 67, 0.1)",
                      }}
                      transition="all 0.2s"
                    >
                      <PasswordInput
                        password={password}
                        setPassword={setPassword}
                        placeholder="Password"
                      />
                    </Box>
                    <FormErrorMessage color="white" fontWeight="600" bg="blackAlpha.400" px={3} py={1} borderRadius="md" mt={2}>
                      {errors.password}
                    </FormErrorMessage>
                  </FormControl>

                  {/* Submit Button */}
                  <Button
                    size="lg"
                    h="56px"
                    bg="white"
                    color="#d11243"
                    fontSize="lg"
                    fontWeight="700"
                    borderRadius="xl"
                    onClick={handleClick}
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
                      bg: "white",
                    }}
                    _active={{
                      transform: "translateY(0)",
                    }}
                    transition="all 0.3s"
                    mt={2}
                  >
                    Sign In
                  </Button>

                  {/* Register Link */}
                  <Box textAlign="center" pt={2}>
                    <Text color="white" fontSize="md" fontWeight="500">
                      {"Don't have an account? " }
                      <Link href="/signup" style={{ textDecoration: "none" }}>
                        <Text
                          as="span"
                          fontWeight="700"
                          textDecoration="underline"
                          _hover={{ color: "whiteAlpha.800" }}
                        >
                          Register
                        </Text>
                      </Link>
                    </Text>
                  </Box>

                  {/* Privacy */}
                  <Text fontSize="xs" textAlign="center" color="whiteAlpha.800" mt={2}>
                    By signing in, you agree to our{' '}
                    <Link href="https://www.licious.in/terms">
                      <Text as="span" textDecoration="underline" fontWeight="600">
                        Terms
                      </Text>
                    </Link>{' '}
                    and{' '}
                    <Link href="https://www.licious.in/privacy">
                      <Text as="span" textDecoration="underline" fontWeight="600">
                        Privacy Policy
                      </Text>
                    </Link>
                  </Text>
                </VStack>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Flex>
    </Box>
  );
};

export default Login;
