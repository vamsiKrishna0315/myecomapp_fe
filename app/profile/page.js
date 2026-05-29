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
  FormControl,
  FormLabel,
  Icon,

  Divider,
  Flex,
  Badge,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { promptLogin } from "../../utils/auth";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    dob: "",
  });
  const router = useRouter();
  const toast = useToast();

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/profile`;

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        setProfile(res.data.data);
        setFormData({
          first_name: res.data.data.first_name || "",
          last_name: res.data.data.last_name || "",
          email: res.data.data.email || "",
          mobile: res.data.data.mobile || "",
          dob: res.data.data.dob || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("Token");
      if (!token) {
        promptLogin(router);
        return;
      }

      const sep = BASE_URL.endsWith("/") ? "" : "/";
      const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/profile`;

      const res = await axios.put(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        setProfile(res.data.data);
        setIsEditing(false);
        
        // Update localStorage
        localStorage.setItem("User_first_name", formData.first_name);
        localStorage.setItem("User_last_name", formData.last_name);
        localStorage.setItem("User_name", `${formData.first_name} ${formData.last_name}`);
        localStorage.setItem("User_email", formData.email);
        localStorage.setItem("User_mobile", formData.mobile);
        
        toast({
          title: "Success",
          description: "Profile updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
        
        // Trigger storage event to update navbar
        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: profile?.email || "",
      mobile: profile?.mobile || "",
      dob: profile?.dob || "",
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Box minH="80vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="#D11243" thickness="4px" />
          <Text color="gray.600">Loading your profile...</Text>
        </VStack>
      </Box>
    );
  }

  const userInitials = profile
    ? ((profile.first_name?.charAt(0) || "") + (profile.last_name?.charAt(0) || "")).toUpperCase()
    : "?";

  return (
    <Box bg="white" minH="100vh" py={8}>
      <Container maxW="600px">
        {/* Profile Header */}
        <VStack spacing={8} align="stretch">
          {/* User Info Section */}
          <Box textAlign="center">
            <Box
              w="80px"
              h="80px"
              bg="#D11243"
              color="white"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
              fontWeight="bold"
              mx="auto"
              mb={4}
            >
              {userInitials}
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              {profile?.full_name}
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Member since {formatDate(profile?.created_at)}
            </Text>
          </Box>

          {/* Edit Button */}
          <Flex justify="center" gap={4}>
            {!isEditing ? (
              <Button
                bg="#D11243"
                color="white"
                px={8}
                onClick={() => setIsEditing(true)}
                _hover={{ bg: "#A00E35" }}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  bg="#D11243"
                  color="white"
                  px={8}
                  onClick={handleSave}
                  _hover={{ bg: "#A00E35" }}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  borderColor="gray.300"
                  px={8}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            )}
          </Flex>

          {/* Profile Form */}
          <Box bg="white" p={6} borderRadius="lg" border="1px solid" borderColor="gray.200">
            <VStack spacing={6} align="stretch">
              {/* First Name */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  First Name
                </FormLabel>
                {isEditing ? (
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    borderColor="gray.300"
                    _focus={{ borderColor: "#D11243", boxShadow: "0 0 0 1px #D11243" }}
                  />
                ) : (
                  <Text fontSize="md" color="gray.800" py={2}>
                    {profile?.first_name || "Not set"}
                  </Text>
                )}
              </FormControl>

              {/* Last Name */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Last Name
                </FormLabel>
                {isEditing ? (
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    borderColor="gray.300"
                    _focus={{ borderColor: "#D11243", boxShadow: "0 0 0 1px #D11243" }}
                  />
                ) : (
                  <Text fontSize="md" color="gray.800" py={2}>
                    {profile?.last_name || "Not set"}
                  </Text>
                )}
              </FormControl>

              {/* Email */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Email Address
                </FormLabel>
                {isEditing ? (
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    borderColor="gray.300"
                    _focus={{ borderColor: "#D11243", boxShadow: "0 0 0 1px #D11243" }}
                  />
                ) : (
                  <Text fontSize="md" color="gray.800" py={2}>
                    {profile?.email || "Not set"}
                  </Text>
                )}
              </FormControl>

              {/* Mobile */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Mobile Number
                </FormLabel>
                {isEditing ? (
                  <Input
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    borderColor="gray.300"
                    _focus={{ borderColor: "#D11243", boxShadow: "0 0 0 1px #D11243" }}
                  />
                ) : (
                  <Text fontSize="md" color="gray.800" py={2}>
                    {profile?.mobile || "Not set"}
                  </Text>
                )}
              </FormControl>

              {/* Date of Birth */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700">
                  Date of Birth
                </FormLabel>
                {isEditing ? (
                  <Input
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                    borderColor="gray.300"
                    _focus={{ borderColor: "#D11243", boxShadow: "0 0 0 1px #D11243" }}
                  />
                ) : (
                  <Text fontSize="md" color="gray.800" py={2}>
                    {formatDate(profile?.dob)}
                  </Text>
                )}
              </FormControl>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
