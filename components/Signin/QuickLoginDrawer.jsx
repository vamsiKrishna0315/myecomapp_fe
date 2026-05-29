import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Input,
  Box,
  useToast,
  VStack,
  Heading,
  Checkbox,
  HStack,
  Text,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import api from "../../utils/api";
import { AppContext } from "../Context/ContextProvider";
import { useCart } from "../Context/CartContext";
import { PasswordInput } from "./PasswordInput";

const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";

const initialRegisterState = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
  dob: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobilePattern = /^\d{10}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

const QuickLoginDrawer = ({ isOpen, onClose }) => {
  const toast = useToast();
  const appCtx = useContext(AppContext);
  const { refreshCart } = useCart();

  const [loginMode, setLoginMode] = useState("otp");
  const [activeView, setActiveView] = useState("login");
  const [mobile, setMobile] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [editMobile, setEditMobile] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loginErrors, setLoginErrors] = useState({});
  const [registerData, setRegisterData] = useState(initialRegisterState);
  const [registerErrors, setRegisterErrors] = useState({});

  const timerRef = useRef(null);

  const closeDrawer = () => {
    appCtx?.setIsModalVisible(false);
    onClose();
  };

  const persistLogin = (data) => {
    localStorage.setItem("Token", data.token);
    localStorage.setItem("Customer_id", String(data.customer.id || ""));
    localStorage.setItem("User_name", data.customer.full_name || "");
    localStorage.setItem("User_first_name", data.customer.first_name || "");
    localStorage.setItem("User_last_name", data.customer.last_name || "");
    localStorage.setItem("User_mobile", data.customer.mobile || "");
    localStorage.setItem("User_email", data.customer.email || "");

    if (data.customer.addresses && Array.isArray(data.customer.addresses)) {
      localStorage.setItem("User_addresses", JSON.stringify(data.customer.addresses));
    }

    window.dispatchEvent(new Event("userLoggedIn"));
    refreshCart();
  };

  const resetDrawerState = () => {
    setActiveView("login");
    setLoginMode("otp");
    setMobile("");
    setLoginIdentifier("");
    setLoginPassword("");
    setOtpSent(false);
    setOtp("");
    setEditMobile(false);
    setResendTimer(0);
    setLoginErrors({});
    setRegisterData(initialRegisterState);
    setRegisterErrors({});
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetDrawerState();
    }
  }, [isOpen]);

  const validatePasswordLogin = () => {
    const newErrors = {};
    if (!loginIdentifier.trim()) {
      newErrors.loginIdentifier = "Mobile or email is required";
    } else if (
      !emailPattern.test(loginIdentifier.trim()) &&
      !mobilePattern.test(loginIdentifier.trim())
    ) {
      newErrors.loginIdentifier = "Enter a valid mobile number or email";
    }

    if (!loginPassword) {
      newErrors.loginPassword = "Password is required";
    }

    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!registerData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!registerData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    const hasEmail = registerData.email.trim().length > 0;
    const hasMobile = registerData.mobile.trim().length > 0;

    if (!hasEmail && !hasMobile) {
      newErrors.email = "Email or mobile is required";
      newErrors.mobile = "Email or mobile is required";
    }
    if (hasEmail && !emailPattern.test(registerData.email.trim())) {
      newErrors.email = "Enter a valid email";
    }
    if (hasMobile && !mobilePattern.test(registerData.mobile.trim())) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }
    if (!registerData.dob) {
      newErrors.dob = "Date of birth is required";
    }
    if (!registerData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordPattern.test(registerData.password)) {
      newErrors.password =
        "Use 5+ characters with uppercase, lowercase and number";
    }
    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const startResendTimer = () => {
    setResendTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!mobilePattern.test(mobile)) {
      setLoginErrors({ mobile: "Please enter a valid 10-digit mobile number" });
      return;
    }

    setIsOtpLoading(true);
    try {
      await api.post(`/api/v1/customer/send-otp`, { phone: mobile });
      setOtpSent(true);
      setEditMobile(false);
      setLoginErrors({});
      startResendTimer();

      toast({
        title: "OTP Sent",
        description: "Please check your mobile.",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    } catch (err) {
      toast({
        title: "Failed to send OTP",
        description: err.response?.data?.message || "Try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
    setIsOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setLoginErrors({ otp: "Please enter OTP" });
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await api.post(`/api/v1/customer/verify-otp`, {
        phone: mobile,
        otp,
        is_customer: true,
      });

      if (res.data.success) {
        persistLogin(res.data);
        toast({
          title: "Login Successful",
          description: "Welcome! You can now continue shopping.",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
        resetDrawerState();
        closeDrawer();
        setIsOtpLoading(false);
        return;
      }

      toast({
        title: "OTP Verification Failed",
        description: res.data.message || "Invalid OTP",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } catch (err) {
      toast({
        title: "OTP Verification Failed",
        description: err.response?.data?.message || "Invalid OTP",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
    setIsOtpLoading(false);
  };

  const handlePasswordLogin = async () => {
    if (!validatePasswordLogin()) {
      return;
    }

    const identifier = loginIdentifier.trim();
    const payload = {
      password: loginPassword,
    };

    if (emailPattern.test(identifier)) {
      payload.email = identifier;
    } else {
      payload.mobile = identifier;
    }

    setIsPasswordLoading(true);
    try {
      const response = await api.post(`/api/v1/${API_TYPE}/login`, payload);
      persistLogin(response.data.data);
      toast({
        title: "Login Successful",
        description: response.data.message || "Welcome back!",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      resetDrawerState();
      closeDrawer();
    } catch (err) {
      toast({
        title: "Login Failed",
        description: err.response?.data?.message || "Invalid credentials.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
    setIsPasswordLoading(false);
  };

  const handleRegisterChange = (field, value) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }));
    if (registerErrors[field]) {
      setRegisterErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if ((field === "email" || field === "mobile") && (registerErrors.email || registerErrors.mobile)) {
      setRegisterErrors((prev) => ({ ...prev, email: "", mobile: "" }));
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) {
      return;
    }

    setIsRegisterLoading(true);
    try {
      const payload = {
        first_name: registerData.firstName.trim(),
        last_name: registerData.lastName.trim(),
        email: registerData.email.trim() || undefined,
        mobile: registerData.mobile.trim() || undefined,
        password: registerData.password,
        password_confirmation: registerData.confirmPassword,
        dob: registerData.dob,
      };

      const response = await api.post(`/api/v1/${API_TYPE}/register`, payload);

      const loginPayload = {
        password: registerData.password,
      };
      if (registerData.mobile.trim()) {
        loginPayload.mobile = registerData.mobile.trim();
      } else {
        loginPayload.email = registerData.email.trim();
      }

      const loginRes = await api.post(`/api/v1/${API_TYPE}/login`, loginPayload);
      persistLogin(loginRes.data.data);

      toast({
        title: "Registration Successful",
        description: response.data.msg || "Your account has been created.",
        status: "success",
        duration: 2500,
        isClosable: true,
        position: "top",
      });

      resetDrawerState();
      closeDrawer();
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err.response?.data?.msg || err.response?.data?.message || "Please try again.",
        status: "error",
        duration: 3500,
        isClosable: true,
        position: "top",
      });
    }
    setIsRegisterLoading(false);
  };

  const passwordsMatch =
    registerData.password.length > 0 &&
    registerData.confirmPassword.length > 0 &&
    registerData.password === registerData.confirmPassword;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={closeDrawer} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Login with Mobile OTP</DrawerHeader>

        <DrawerBody>
          <VStack spacing={6} align="stretch">
            {activeView === "login" ? (
              <Box
                p={5}
                borderRadius="xl"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
              >
                <Heading size="md" mb={2}>Login</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Choose OTP or password login.
                </Text>

                <HStack spacing={6} mb={4}>
                  <Checkbox
                    isChecked={loginMode === "otp"}
                    onChange={() => {
                      setLoginMode("otp");
                      setLoginErrors({});
                    }}
                    colorScheme="pink"
                  >
                    OTP
                  </Checkbox>
                  <Checkbox
                    isChecked={loginMode === "password"}
                    onChange={() => {
                      setLoginMode("password");
                      setLoginErrors({});
                    }}
                    colorScheme="pink"
                  >
                    Password
                  </Checkbox>
                </HStack>

                {loginMode === "otp" ? (
                  <VStack spacing={4} align="stretch">
                    {!otpSent || editMobile ? (
                      <FormControl isInvalid={Boolean(loginErrors.mobile)}>
                        <Input
                          placeholder="Enter Mobile Number"
                          value={mobile}
                          onChange={(e) => {
                            setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                            if (loginErrors.mobile) {
                              setLoginErrors((prev) => ({ ...prev, mobile: "" }));
                            }
                          }}
                          maxLength={10}
                        />
                        <FormErrorMessage>{loginErrors.mobile}</FormErrorMessage>
                      </FormControl>
                    ) : (
                      <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
                        <Text fontWeight="600">Mobile: {mobile}</Text>
                        <Button size="xs" variant="link" onClick={() => setEditMobile(true)}>
                          Edit
                        </Button>
                      </Box>
                    )}

                    {!otpSent || editMobile ? (
                      <Button colorScheme="pink" isLoading={isOtpLoading} onClick={handleSendOtp} width="100%">
                        Send OTP
                      </Button>
                    ) : (
                      <>
                        <FormControl isInvalid={Boolean(loginErrors.otp)}>
                          <Input
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => {
                              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                              if (loginErrors.otp) {
                                setLoginErrors((prev) => ({ ...prev, otp: "" }));
                              }
                            }}
                            maxLength={6}
                          />
                          <FormErrorMessage>{loginErrors.otp}</FormErrorMessage>
                        </FormControl>
                        <Button colorScheme="pink" isLoading={isOtpLoading} onClick={handleVerifyOtp} width="100%">
                          Verify and Login
                        </Button>
                        <Button variant="outline" isDisabled={resendTimer > 0} onClick={handleSendOtp} width="100%">
                          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                        </Button>
                      </>
                    )}
                  </VStack>
                ) : (
                  <VStack spacing={4} align="stretch">
                    <FormControl isInvalid={Boolean(loginErrors.loginIdentifier)}>
                      <Input
                        placeholder="Mobile or Email"
                        value={loginIdentifier}
                        onChange={(e) => {
                          setLoginIdentifier(e.target.value.trimStart());
                          if (loginErrors.loginIdentifier) {
                            setLoginErrors((prev) => ({ ...prev, loginIdentifier: "" }));
                          }
                        }}
                      />
                      <FormErrorMessage>{loginErrors.loginIdentifier}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={Boolean(loginErrors.loginPassword)}>
                      <PasswordInput
                        password={loginPassword}
                        setPassword={(value) => {
                          setLoginPassword(value);
                          if (loginErrors.loginPassword) {
                            setLoginErrors((prev) => ({ ...prev, loginPassword: "" }));
                          }
                        }}
                        placeholder="Password"
                      />
                      <FormErrorMessage>{loginErrors.loginPassword}</FormErrorMessage>
                    </FormControl>
                    <Button colorScheme="pink" isLoading={isPasswordLoading} onClick={handlePasswordLogin}>
                      Login
                    </Button>
                  </VStack>
                )}

                {loginMode === "password" ? (
                  <>
                    <Divider my={5} />

                    <Box textAlign="center">
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        New user?
                      </Text>
                      <Button
                        variant="outline"
                        colorScheme="pink"
                        width="100%"
                        onClick={() => setActiveView("register")}
                      >
                        Register
                      </Button>
                    </Box>
                  </>
                ) : null}
              </Box>
            ) : (
              <Box
                p={5}
                borderRadius="xl"
                bg="pink.50"
                border="1px solid"
                borderColor="pink.100"
              >
                <HStack justify="space-between" align="center" mb={2}>
                  <Heading size="md">Register</Heading>
                  <Button variant="link" colorScheme="pink" onClick={() => setActiveView("login")}>
                    Back to Login
                  </Button>
                </HStack>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Fill the details below to create your account.
                </Text>

                <VStack spacing={4} align="stretch">
                  <HStack align="start" spacing={3}>
                    <FormControl isInvalid={Boolean(registerErrors.firstName)}>
                      <Input
                        placeholder="First Name"
                        value={registerData.firstName}
                        onChange={(e) => handleRegisterChange("firstName", e.target.value)}
                      />
                      <FormErrorMessage>{registerErrors.firstName}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={Boolean(registerErrors.lastName)}>
                      <Input
                        placeholder="Last Name"
                        value={registerData.lastName}
                        onChange={(e) => handleRegisterChange("lastName", e.target.value)}
                      />
                      <FormErrorMessage>{registerErrors.lastName}</FormErrorMessage>
                    </FormControl>
                  </HStack>

                  <HStack align="start" spacing={3}>
                    <FormControl isInvalid={Boolean(registerErrors.email)}>
                      <Input
                        placeholder="Email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => handleRegisterChange("email", e.target.value)}
                      />
                      <FormErrorMessage>{registerErrors.email}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={Boolean(registerErrors.mobile)}>
                      <Input
                        placeholder="Mobile"
                        type="tel"
                        value={registerData.mobile}
                        onChange={(e) =>
                          handleRegisterChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        maxLength={10}
                      />
                      <FormErrorMessage>{registerErrors.mobile}</FormErrorMessage>
                    </FormControl>
                  </HStack>

                  <FormControl isInvalid={Boolean(registerErrors.dob)}>
                    <Input
                      placeholder="DOB"
                      type="date"
                      value={registerData.dob}
                      onChange={(e) => handleRegisterChange("dob", e.target.value)}
                    />
                    <FormErrorMessage>{registerErrors.dob}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={Boolean(registerErrors.password)}>
                    <PasswordInput
                      password={registerData.password}
                      setPassword={(value) => handleRegisterChange("password", value)}
                      placeholder="Password"
                    />
                    <FormHelperText color="gray.600">
                      Minimum 5 characters with uppercase, lowercase and number.
                    </FormHelperText>
                    <FormErrorMessage>{registerErrors.password}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={Boolean(registerErrors.confirmPassword)}>
                    <PasswordInput
                      password={registerData.confirmPassword}
                      setPassword={(value) => handleRegisterChange("confirmPassword", value)}
                      placeholder="Confirm Password"
                    />
                    {passwordsMatch ? (
                      <FormHelperText color="green.600" display="flex" alignItems="center" gap="2">
                        <CheckIcon />
                        Passwords match
                      </FormHelperText>
                    ) : null}
                    <FormErrorMessage>{registerErrors.confirmPassword}</FormErrorMessage>
                  </FormControl>

                  <Button colorScheme="pink" isLoading={isRegisterLoading} onClick={handleRegister}>
                    Register
                  </Button>
                </VStack>
              </Box>
            )}
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" onClick={closeDrawer}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickLoginDrawer;
