'use client';

import React, { useEffect, useState } from "react";
import {
  Box,
  useDisclosure,
  ListItem,
  UnorderedList,
  Text,
  Image,
  Input,
  Menu,
  MenuButton,
  Portal,
  MenuList,
  MenuItem,
  Hide,
  Circle,
  Avatar,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import "./Navbar.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Bag_Drawer from "../Bag/Bag_Drawer";
import QuickLoginDrawer from "../Signin/QuickLoginDrawer";
import Search from "../ProductData/Search";
import { AppContext } from "../Context/ContextProvider";
import MenuComponent from "../menucomponent/MenuComponent";
import { useSiteData } from "../Context/SiteDataContext";
import { useCart } from "../Context/CartContext";
import { clearAuthStorage } from "../../utils/auth";

const Navbar = () => {
  const router = useRouter();
  const [username, setuserName] = useState("");
  const [userInitials, setUserInitials] = useState("");

  useEffect(() => {
    const updateUser = () => {
      const fullName = localStorage.getItem("User_name") || "";
      const firstName = localStorage.getItem("User_first_name") || "";
      const lastName = localStorage.getItem("User_last_name") || "";
      
      setuserName(fullName);
      
      // Get initials: first letter of first_name + first letter of last_name
      if (firstName && lastName) {
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        setUserInitials(initials);
      } else if (fullName) {
        // Fallback: use first two letters of full name
        const initials = fullName.substring(0, 2).toUpperCase();
        setUserInitials(initials);
      } else {
        setUserInitials("");
      }
    };
    
    updateUser();
    
    // Listen for storage changes from other tabs
    window.addEventListener("storage", updateUser);
    
    // Listen for custom login event from same tab
    window.addEventListener("userLoggedIn", updateUser);
    window.addEventListener("userLoggedOut", updateUser);
    
    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("userLoggedIn", updateUser);
      window.removeEventListener("userLoggedOut", updateUser);
    };
  }, []);
  const drawerBag = useDisclosure();
  const quickLoginDrawer = useDisclosure();
  const ctx = React.useContext(AppContext);
  const { cartCount, refreshCart } = useCart();

  useEffect(() => {
    if (ctx?.isModalVisible) {
      quickLoginDrawer.onOpen();
    }
  }, [ctx?.isModalVisible, quickLoginDrawer]);

  useEffect(() => {
    const openDrawer = () => {
      ctx?.setIsModalVisible(true);
      quickLoginDrawer.onOpen();
    };

    window.addEventListener("openAuthDrawer", openDrawer);
    return () => window.removeEventListener("openAuthDrawer", openDrawer);
  }, [ctx, quickLoginDrawer]);

  // Rely on CartProvider to refresh on mount; no extra call here.

  const handleLogout = () => {
    clearAuthStorage();
    setuserName("");
    setUserInitials("");
    refreshCart();
    ctx?.userLogout?.();
    window.dispatchEvent(new Event("userLoggedOut"));
    router.push("/");
  };
  const handleLogin = () => {
    ctx?.setIsModalVisible(true);
    quickLoginDrawer.onOpen();
  };
  const { siteData, assetUrl, loading } = useSiteData();

  return (
    <>
      <Box className="header_wrapper">
        {/* <Box className="navbar_top">
          <Hide below="lg">
            <Box className="container">
              <Box className="header_menu">
                
              </Box>
              <Box className="header_right">
                <UnorderedList>
                  <ListItem className="certification">
                    FSSC 200 Certification{" "}
                  </ListItem>
                  <ListItem className="about-us">About Us</ListItem>
                  <ListItem className="careers">Careers</ListItem>
                  <ListItem className="contact-us">Contact Us</ListItem>
                </UnorderedList>
              </Box>
            </Box>
          </Hide>
        </Box> */}

        <Box className="bottom_header">
          <Box className="bottom_container">
            <Box className="bottom_header_logo">
              <Link href="/">
                <Image
                  ml={{ base: "0px", md: "30px", lg: "10px" }}
                  src="/images/logo/logo.webp"
                  alt="licious_logo"
                  height="40px"
                />
              </Link>
            </Box>
            <Hide below="lg">
              <Box className="location">
               
                <Box className="city_location">
                  <Box className="city"></Box>
                  <Box className="location_data">
                    <Box className="location_name"></Box>
                    <Image
                      src="/images/icons/location.png"
                      alt="drop-down"
                      style={{
                        height: "24px",
                        width: "24px",
                        margin: "5px 0 0 8px",
                      }}
                    />
                  </Box>
                </Box>
                <Box className="loc_screen"></Box>
              </Box>
              <Box className="search_bar" zIndex={1}>
                {/* <Input
                className="search_input"
                placeholder="Search for any delicious product"
                type={"search"}
              /> */}
                <Search />
              </Box>
            </Hide>
            <Box className="categories_menu">
              {/* <Image
                src="https://www.licious.in/img/rebranding/category-dropdown-icon.svg"
                alt="categories"
              /> */}
              <Box className="cateogires_menu" _hover={{ color: "#D11243" }}>
                <Menu>
                  {/* <MenuButton
                    _hover={{ color: "#D11243" }}
                    style={{
                      marginLeft: "8px",
                      // fontSize: "12px",
                      lineHeight: "14px",
                      color: "#000",
                    }}
                    fontSize={{ base: "25px", md: "20px", lg: "16px" }}
                    // className="categories_icon_scrollbar"
                  >
                    Categories
                  </MenuButton> */}
                  <Portal className="categories_icon_scrollbar">
                    <MenuList
                      className="scroll_data_head"
                      display={"inline-grid"}
                      overflow="hidden"
                      borderRadius={"8px"}
                      padding="20px"
                      backgroundColor={"#fff"}
                      boxShadow="0 2px 12px 0 rgb(0 0 0 / 16% ) "
                      marginLeft={"-100px"}
                      marginTop="14px"
                    >
                      {loading ? (
                        <Box>
                          {[...Array(4)].map((_, idx) => (
                            <Box
                              key={idx}
                              display="flex"
                              alignItems="center"
                              padding="10px"
                              mb="8px"
                            >
                              <SkeletonCircle size="10" flexShrink={0} />
                              <Skeleton
                                height="16px"
                                width="120px"
                                ml="10px"
                              />
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        siteData?.categories
                          ?.filter((c) => (c?.is_live ?? 1) && (c?.status ?? 1))
                          ?.map((cat) => {
                            const slug = (cat.category_type || cat.category_name).toLowerCase().replace(/\s+/g, "-");
                            return (
                              <Link key={cat.id} href={`/category/${slug}`}>
                                <Box className="scroll_data" display="flex" alignItems="center" padding="10px" cursor="pointer" _hover={{ bg: "#f4f5ff" }}>
                                  <Image
                                    height={"36px"}
                                    width="36px"
                                    marginRight="14px"
                                    src={cat.category_image_url || assetUrl(cat.category_image)}
                                    alt={cat.category_name}
                                  />
                                  <Box color="#4b4f54" fontWeight={"500"} lineHeight="19px" fontSize={"16px"}>
                                    {cat.category_name}
                                  </Box>
                                </Box>
                              </Link>
                            );
                          })
                      )}
                    </MenuList>
                  </Portal>
                </Menu>
              </Box>
            </Box>

              <Box className="profile_section">
              <Box className="profile">
                <Box className="profile_container" display="flex" gap="20px">
                  {!username && (
                    <>
                      <Box
                        className="username_container"
                        fontSize={{ base: "27px", md: "20px", lg: "16px" }}
                        marginLeft={{ base: "60px", md: "20px", lg: "16px" }}
                        textColor="#5c5c5c"
                        cursor="pointer"
                      >
                        <Box onClick={handleLogin}>Quick Login</Box>
                      </Box>
                    </>
                  )}
                  {username && (
                    <Box
                      className="username_container"
                      marginLeft={{ base: "60px", md: "20px", lg: "16px" }}
                      cursor="pointer"
                    >
                      <Menu>
                        <MenuButton>
                          <Circle
                            size="40px"
                            bg="#D11243"
                            color="white"
                            fontWeight="bold"
                            fontSize="16px"
                            _hover={{ bg: "#A00E35" }}
                            transition="background 0.2s"
                          >
                            {userInitials}
                          </Circle>
                        </MenuButton>
                        <Portal>
                          <MenuList>
                            <MenuItem onClick={() => router.push("/orders")}>
                              My Orders
                            </MenuItem>
                            <MenuItem onClick={() => router.push("/profile")}>
                              Profile
                            </MenuItem>
                            <MenuItem onClick={() => router.push("/raise-query")}>
                              Raise a Query
                            </MenuItem>
                            <MenuItem onClick={handleLogout} color="red.500">
                              Logout
                            </MenuItem>
                          </MenuList>
                        </Portal>
                      </Menu>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box className="cart_section" position="relative">
                <a className="cart_data">
                  <Image
                    color={"#000"}
                    cursor="pointer"
                    src="/images/icons/cart_icon.svg"
                    alt="cart"
                    onClick={() => drawerBag.onOpen()}
                    height="30px"
                    width="28px"
                  />
                </a>
                {cartCount > 0 && (
                  <Box position="absolute" top="-6px" right="-6px" bg="#D11243" color="#fff" borderRadius="full" fontSize="12px" px="6px" py="1px">
                    {cartCount}
                  </Box>
                )}
              </Box>
              <Hide below="md">
                <Box className="cart_details" fontSize={{ base: "25px", md: "20px", lg: "16px" }}>
                  <Text className="cart_text">Cart{cartCount > 0 ? ` (${cartCount})` : ""}</Text>
                </Box>
              </Hide>
            </Box>
          </Box>
        </Box>
      </Box>
      <Bag_Drawer onClose={drawerBag.onClose} isOpen={drawerBag.isOpen} />
      <QuickLoginDrawer onClose={quickLoginDrawer.onClose} isOpen={quickLoginDrawer.isOpen} />
    </>
  );
};

export default Navbar;
