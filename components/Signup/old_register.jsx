'use client';

import {
  Stack,
  Input,
  Box,
  Text,
  Button,
  FormLabel,
  Spinner,
  FormControl,
  FormErrorMessage,
  InputGroup,
  InputLeftElement,
  Icon,
  Heading,
  VStack,
  HStack,
  useToast,
  Divider,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { backendSite } from "../backendSiteLink/backendSite";
import { PasswordInput } from "../Signin/PasswordInput";

const Register = () => {
  const router = useRouter();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    passwordConfirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    } else if (!/^\d{10,11}$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid mobile number (10-11 digits)";
    }

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
      const response = await axios.post(`${backendSite}/users/register`, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        password_confirmation: formData.passwordConfirmation,
      });

      toast({
        title: "Success!",
        description: response.data.msg || "Registration successful",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      router.push("/login");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Registration failed. Please try again.";
      
      toast({
        title: "Registration Failed",
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
    <Box
      minH="100vh"
      bg="linear-gradient(135deg, #fef5f7 0%, #fff 100%)"
      py={{ base: 8, md: 12 }}
      px={4}
    >
      <Box
        maxW="480px"
        mx="auto"
        bg="white"
        borderRadius="2xl"
        boxShadow="xl"
        overflow="hidden"
      >
        {/* Header Section */}
        <Box
          bg="linear-gradient(135deg, #d11243 0%, #e91e63 100%)"
          py={8}
          px={6}
          textAlign="center"
        >
          <Heading
            as="h1"
            size="xl"
            color="white"
            fontWeight="bold"
            mb={2}
          >
            Create Account
          </Heading>
          <Text color="whiteAlpha.900" fontSize="sm">
            Join us for an amazing experience
          </Text>
        </Box>

        {/* Form Section */}
        <Box p={{ base: 6, md: 8 }}>
          <VStack spacing={5} align="stretch">
            {/* Name Fields Row */}
            <HStack spacing={4}>
              <FormControl isInvalid={errors.firstName}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  First Name
                </FormLabel>
                <Input
                  placeholder="John"
                  size="lg"
                  borderRadius="lg"
                  focusBorderColor="#d11243"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  _hover={{ borderColor: "#d11243" }}
                />
                <FormErrorMessage fontSize="xs">{errors.firstName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.lastName}>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Last Name
                </FormLabel>
                <Input
                  placeholder="Doe"
                  size="lg"
                  borderRadius="lg"
                  focusBorderColor="#d11243"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  _hover={{ borderColor: "#d11243" }}
                />
                <FormErrorMessage fontSize="xs">{errors.lastName}</FormErrorMessage>
              </FormControl>
            </HStack>

            {/* Email Field */}
            <FormControl isInvalid={errors.email}>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                Email Address
              </FormLabel>
              <Input
                placeholder="john.doe@example.com"
                type="email"
                size="lg"
                borderRadius="lg"
                focusBorderColor="#d11243"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                _hover={{ borderColor: "#d11243" }}
              />
              <FormErrorMessage fontSize="xs">{errors.email}</FormErrorMessage>
            </FormControl>

            {/* Mobile Field */}
            <FormControl isInvalid={errors.mobile}>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                Mobile Number
              </FormLabel>
              <Input
                placeholder="1234567890"
                type="tel"
                size="lg"
                borderRadius="lg"
                focusBorderColor="#d11243"
                value={formData.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                _hover={{ borderColor: "#d11243" }}
              />
              <FormErrorMessage fontSize="xs">{errors.mobile}</FormErrorMessage>
            </FormControl>

            {/* Password Field */}
            <FormControl isInvalid={errors.password}>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                Password
              </FormLabel>
              <PasswordInput
                password={formData.password}
                setPassword={(value) => handleChange("password", value)}
              />
              <FormErrorMessage fontSize="xs">{errors.password}</FormErrorMessage>
            </FormControl>

            {/* Confirm Password Field */}
            <FormControl isInvalid={errors.passwordConfirmation}>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                Confirm Password
              </FormLabel>
              <PasswordInput
                password={formData.passwordConfirmation}
                setPassword={(value) => handleChange("passwordConfirmation", value)}
              />
              <FormErrorMessage fontSize="xs">{errors.passwordConfirmation}</FormErrorMessage>
            </FormControl>

            {/* Submit Button */}
            <Button
              bg="linear-gradient(135deg, #d11243 0%, #e91e63 100%)"
              color="white"
              size="lg"
              fontSize="md"
              fontWeight="600"
              borderRadius="lg"
              h="54px"
              mt={4}
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText="Creating Account..."
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "lg",
              }}
              transition="all 0.2s"
              _active={{
                transform: "translateY(0)",
              }}
            >
              Create Account
            </Button>

            {/* Divider */}
            <Divider my={2} />

            {/* Login Link */}
            <Box textAlign="center">
              <Text color="gray.600" fontSize="sm">
                Already have an account?{" "}
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <Text
                    as="span"
                    color="#d11243"
                    fontWeight="600"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Sign In
                  </Text>
                </Link>
              </Text>
            </Box>

            {/* Privacy Policy */}
            <Text fontSize="xs" textAlign="center" color="gray.500" mt={2}>
              By signing up, you agree to our{" "}
              <Link
                href="https://www.licious.in/terms"
                style={{ color: "#d11243", fontWeight: "500" }}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="https://www.licious.in/privacy"
                style={{ color: "#d11243", fontWeight: "500" }}
              >
                Privacy Policy
              </Link>
            </Text>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
