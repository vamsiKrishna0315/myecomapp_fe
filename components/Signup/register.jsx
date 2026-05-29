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
} from "@chakra-ui/react";


import api from "../../utils/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { PasswordInput } from "../Signin/PasswordInput";

// Use environment variables for backend base URL and API type
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:5000";
const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer"; // 'customer' or 'driver'

const Register = () => {
  const router = useRouter();
  const toast = useToast();

  // Redirect to home if already logged in
  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("Token")) {
      router.replace("/");
    }
  }, [router]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    passwordConfirmation: "",
    dob: "", // Date of Birth (YYYY-MM-DD)
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);


  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }

    // No DOB validation as per new requirements

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Please confirm your password";
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };


  const handleSubmit = async () => {
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
      // Dynamic endpoint based on API_TYPE
      const endpoint = `${BASE_URL}/api/v1/${API_TYPE}/register`;
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        password_confirmation: formData.passwordConfirmation,
        dob: formData.dob,
      };

      const response = await api.post(`/api/v1/${API_TYPE}/register`, payload);

      toast({
        title: "🎉 Welcome Aboard!",
        description: response.data.msg || "Your account has been created successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });

      // Auto-login after successful registration
      try {
        const loginEndpoint = `${BASE_URL}/api/v1/customer/login`;
        const loginRes = await api.post(`/api/v1/${API_TYPE}/login`, {
          mobile: formData.mobile,
          password: formData.password,
        });
        const data = loginRes.data.data;
        localStorage.setItem("Token", data.token);
        localStorage.setItem("Customer_id", String(data.customer.id || ""));
        localStorage.setItem("User_name", data.customer.full_name || "");
        localStorage.setItem("User_mobile", data.customer.mobile || "");
        localStorage.setItem("User_email", data.customer.email || "");

        // Store addresses in localStorage
        if (data.customer.addresses && Array.isArray(data.customer.addresses)) {
          localStorage.setItem("User_addresses", JSON.stringify(data.customer.addresses));
        }
        toast({
          title: "Login Successful!",
          description: loginRes.data.message || "Welcome!",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
        router.push("/");
        window.location.reload();
      } catch (loginErr) {
        toast({
          title: "Auto-login Failed",
          description: loginErr.response?.data?.message || "Please login manually.",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
        router.push("/login");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Registration failed. Please try again.";

      toast({
        title: "Oops! Something went wrong",
        description: errorMsg,
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });

      setIsLoading(false);
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
      <Box position="absolute" top="10%" left="5%" w="100px" h="100px" borderRadius="50%" bg="whiteAlpha.200" filter="blur(40px)" />
      <Box position="absolute" top="60%" right="10%" w="150px" h="150px" borderRadius="50%" bg="whiteAlpha.300" filter="blur(60px)" />
      <Box position="absolute" bottom="10%" left="30%" w="120px" h="120px" borderRadius="50%" bg="whiteAlpha.200" filter="blur(50px)" />

      <Flex minH="100vh" align="center" justify="center" position="relative" zIndex="1" py={8} px={4}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={0} alignItems="center">
            {/* Left Side - Branding */}
            <Box display={{ base: "none", lg: "block" }} pr={12}>
              <VStack align="flex-start" spacing={6}>
                <Box>
                  <Heading
                    as="h1"
                    fontSize={{ base: "4xl", md: "6xl" }}
                    fontWeight="900"
                    color="white"
                    lineHeight="1.1"
                    mb={4}
                  >
                    Start Your
                    <br />
                    Delicious
                    <br />
                    Journey
                  </Heading>
                  <Text fontSize="xl" color="whiteAlpha.900" fontWeight="500">
                    Join thousands of food lovers discovering premium quality meats
                  </Text>
                </Box>

                <VStack align="flex-start" spacing={4} mt={8}>
                  {[
                    { icon: "✓", text: "Fresh & Premium Quality" },
                    { icon: "✓", text: "Delivered to Your Doorstep" },
                    { icon: "✓", text: "Exclusive Deals & Offers" },
                  ].map((item, i) => (
                    <HStack key={i} spacing={3}>
                      <Box
                        w="10"
                        h="10"
                        borderRadius="full"
                        bg="whiteAlpha.300"
                        backdropFilter="blur(10px)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="xl"
                        fontWeight="bold"
                        color="white"
                      >
                        {item.icon}
                      </Box>
                      <Text color="white" fontSize="lg" fontWeight="500">
                        {item.text}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </Box>

            {/* Right Side - Form */}
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
                    <Heading
                      as="h2"
                      fontSize="3xl"
                      fontWeight="800"
                      color="white"
                      mb={2}
                    >
                      Create Account
                    </Heading>
                    <Text color="whiteAlpha.900" fontSize="md">
                      Fill in your details to get started
                    </Text>
                  </Box>

                  {/* Name Fields */}
                  <HStack spacing={4}>
                    <FormControl isInvalid={errors.firstName}>
                      <Input
                        placeholder="First Name"
                        size="lg"
                        bg="whiteAlpha.900"
                        border="2px solid transparent"
                        borderRadius="xl"
                        color="gray.800"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        onFocus={() => setFocusedField("firstName")}
                        onBlur={() => setFocusedField(null)}
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
                        {errors.firstName}
                      </FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errors.lastName}>
                      <Input
                        placeholder="Last Name"
                        size="lg"
                        bg="whiteAlpha.900"
                        border="2px solid transparent"
                        borderRadius="xl"
                        color="gray.800"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        onFocus={() => setFocusedField("lastName")}
                        onBlur={() => setFocusedField(null)}
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
                        {errors.lastName}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>

                  {/* DOB Field */}
                  <FormControl isInvalid={errors.dob}>
                    <Input
                      placeholder="Date of Birth (YYYY-MM-DD)"
                      type="date"
                      size="lg"
                      bg="whiteAlpha.900"
                      border="2px solid transparent"
                      borderRadius="xl"
                      color="gray.800"
                      value={formData.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                      onFocus={() => setFocusedField("dob")}
                      onBlur={() => setFocusedField(null)}
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
                      {errors.dob}
                    </FormErrorMessage>
                  </FormControl>

                  {/* Email */}
                  <FormControl isInvalid={errors.email}>
                    <Input
                      placeholder="Email Address"
                      type="email"
                      size="lg"
                      bg="whiteAlpha.900"
                      border="2px solid transparent"
                      borderRadius="xl"
                      color="gray.800"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
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
                      {errors.email}
                    </FormErrorMessage>
                  </FormControl>

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
                      value={formData.mobile}
                      onChange={(e) => handleChange("mobile", e.target.value)}
                      onFocus={() => setFocusedField("mobile")}
                      onBlur={() => setFocusedField(null)}
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
                        password={formData.password}
                        setPassword={(value) => handleChange("password", value)}
                        placeholder="Password"
                      />
                    </Box>
                    <FormErrorMessage color="white" fontWeight="600" bg="blackAlpha.400" px={3} py={1} borderRadius="md" mt={2}>
                      {errors.password}
                    </FormErrorMessage>
                  </FormControl>

                  {/* Confirm Password */}
                  <FormControl isInvalid={errors.passwordConfirmation}>
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
                        password={formData.passwordConfirmation}
                        setPassword={(value) => handleChange("passwordConfirmation", value)}
                        placeholder="Confirm Password"
                      />
                    </Box>
                    <FormErrorMessage color="white" fontWeight="600" bg="blackAlpha.400" px={3} py={1} borderRadius="md" mt={2}>
                      {errors.passwordConfirmation}
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
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    loadingText="Creating your account..."
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
                    Create Account
                  </Button>

                  {/* Login Link */}
                  <Box textAlign="center" pt={2}>
                    <Text color="white" fontSize="md" fontWeight="500">
                      Already have an account?{" "}
                      <Link href="/login" style={{ textDecoration: "none" }}>
                        <Text
                          as="span"
                          fontWeight="700"
                          textDecoration="underline"
                          _hover={{ color: "whiteAlpha.800" }}
                        >
                          Sign In
                        </Text>
                      </Link>
                    </Text>
                  </Box>

                  {/* Privacy */}
                  <Text fontSize="xs" textAlign="center" color="whiteAlpha.800" mt={2}>
                    By signing up, you agree to our{" "}
                    <Link href="https://www.licious.in/terms">
                      <Text as="span" textDecoration="underline" fontWeight="600">
                        Terms
                      </Text>
                    </Link>{" "}
                    and{" "}
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

export default Register;
