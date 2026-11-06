'use client';

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import {
  HiMenu,
  HiOutlineLocationMarker,
  HiOutlineShoppingCart,
  HiOutlineUser,
  HiOutlineHome,
  HiOutlineViewGrid,
  HiOutlineSearch,
  HiCheck,
} from "react-icons/hi";
import Bag_Drawer from "../Bag/Bag_Drawer";
import QuickLoginDrawer from "../Signin/QuickLoginDrawer";
import Search from "../ProductData/Search";
import { AppContext } from "../Context/ContextProvider";
import { useSiteData } from "../Context/SiteDataContext";
import { useCart } from "../Context/CartContext";
import { clearAuthStorage } from "../../utils/auth";
import { buildCategoryNavigationItems } from "../../utils/seo";
import { readCartSnapshot } from "../../utils/cartStorage";

export default function Navbar() {
  const router = useRouter();
  const toast = useToast();
  const [username, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const [savedAddress, setSavedAddress] = useState("");

  const drawerBag = useDisclosure();
  const quickLoginDrawer = useDisclosure();
  const mobileNavDrawer = useDisclosure();

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const ctx = React.useContext(AppContext);
  const { cartCount, refreshCart } = useCart();
  const [localCartCount, setLocalCartCount] = useState(cartCount);
  const { siteData, loading, assetUrl } = useSiteData();

  // Instant cart count synchronizer
  useEffect(() => {
    setLocalCartCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const updateCount = () => {
      const { count } = readCartSnapshot();
      setLocalCartCount(count);
    };

    updateCount();
    window.addEventListener("cartStorageUpdated", updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener("cartStorageUpdated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  // User and location synchronizer
  const updateUser = useCallback(() => {
    if (typeof window === "undefined") return;

    const fullName = localStorage.getItem("User_name") || "";
    const firstName = localStorage.getItem("User_first_name") || "";
    const lastName = localStorage.getItem("User_last_name") || "";
    const loc = sessionStorage.getItem("userLocation") || localStorage.getItem("userLocation");

    setUserName(fullName);

    if (loc) {
      try {
        const parsed = JSON.parse(loc);
        setSavedAddress(parsed.address || "");
      } catch (_) {
        setSavedAddress(loc);
      }
    }

    if (firstName && lastName) {
      setUserInitials((firstName.charAt(0) + lastName.charAt(0)).toUpperCase());
    } else if (fullName) {
      setUserInitials(fullName.substring(0, 2).toUpperCase());
    } else {
      setUserInitials("");
    }
  }, []);

  useEffect(() => {
    updateUser();
    window.addEventListener("storage", updateUser);
    window.addEventListener("userLoggedIn", updateUser);
    window.addEventListener("userLoggedOut", updateUser);
    window.addEventListener("userLocationUpdated", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("userLoggedIn", updateUser);
      window.removeEventListener("userLoggedOut", updateUser);
      window.removeEventListener("userLocationUpdated", updateUser);
    };
  }, [updateUser]);

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

    const openLocModal = () => {
      handleDetectLocation();
    };

    window.addEventListener("openAuthDrawer", openDrawer);
    window.addEventListener("openLocationModal", openLocModal);

    return () => {
      window.removeEventListener("openAuthDrawer", openDrawer);
      window.removeEventListener("openLocationModal", openLocModal);
    };
  }, [ctx, quickLoginDrawer]);

  const handleLogout = () => {
    clearAuthStorage();
    setUserName("");
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

  // Location persistence logic
  const persistSelectedLocation = (address, latitude = null, longitude = null) => {
    const locObj = {
      address,
      latitude: latitude != null ? String(latitude) : null,
      longitude: longitude != null ? String(longitude) : null,
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("userLocation", JSON.stringify(locObj));
      localStorage.setItem("userLocation", JSON.stringify(locObj));
      if (latitude != null) sessionStorage.setItem("session-latitude", String(latitude));
      if (longitude != null) sessionStorage.setItem("session-longitude", String(longitude));
      window.dispatchEvent(new Event("userLocationUpdated"));
    }

    setSavedAddress(address);

    toast({
      title: "Delivery Location Updated",
      description: `Delivering to: ${address}`,
      status: "success",
      duration: 2500,
      position: "top",
      isClosable: true,
    });
  };

  const fallbackIpLocation = async () => {
    try {
      const resp = await fetch("https://ipapi.co/json/");
      if (resp.ok) {
        const data = await resp.json();
        const city = data?.city;
        const region = data?.region;
        const lat = data?.latitude;
        const lon = data?.longitude;
        if (city) {
          const address = region ? `${city}, ${region}` : city;
          persistSelectedLocation(address, lat, lon);
          return true;
        }
      }
    } catch (_) {}

    try {
      const resp = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client");
      if (resp.ok) {
        const data = await resp.json();
        const city = data?.city || data?.locality;
        const state = data?.principalSubdivision;
        if (city) {
          const address = state ? `${city}, ${state}` : city;
          persistSelectedLocation(address, data?.latitude, data?.longitude);
          return true;
        }
      }
    } catch (_) {}

    return false;
  };

  const handleDetectLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      await fallbackIpLocation();
      return;
    }

    setIsDetectingLocation(true);

    // Check if permission is already permanently blocked in browser site settings
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permStatus = await navigator.permissions.query({ name: "geolocation" });
        if (permStatus.state === "denied") {
          toast({
            title: "Location is Blocked in Browser",
            description: "Click the tune/lock icon in your browser address bar (left of localhost:3000) to allow Location access, then click again.",
            status: "warning",
            duration: 6000,
            position: "top",
            isClosable: true,
          });
          await fallbackIpLocation();
          setIsDetectingLocation(false);
          return;
        }
      } catch (_) {}
    }

    try {
      // Use standard accuracy (false) so browser prompts for permission and works on all Windows PCs
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      let detectedAddress = "Current Live Location";

      // Reverse geocode if Google Maps Geocoder is available
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const res = await new Promise((res) => {
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === "OK" && results?.[0]?.formatted_address) {
              res(results[0].formatted_address);
            } else {
              res("");
            }
          });
        });
        if (res) detectedAddress = res;
      } else {
        // Reverse geocoding via OpenStreetMap or coordinates
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          if (resp.ok) {
            const data = await resp.json();
            const city = data?.address?.city || data?.address?.town || data?.address?.suburb || data?.address?.state_district;
            const road = data?.address?.road || data?.address?.neighbourhood;
            if (road && city) {
              detectedAddress = `${road}, ${city}`;
            } else if (data?.display_name) {
              detectedAddress = data.display_name.split(",").slice(0, 3).join(", ");
            }
          }
        } catch (_) {
          detectedAddress = `GPS Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        }
      }

      persistSelectedLocation(detectedAddress, latitude, longitude);
    } catch (err) {
      console.warn("Geolocation error:", err);
      if (err.code === 1) {
        toast({
          title: "Permission Denied",
          description: "Click the lock icon in your address bar and set Location to 'Allow', then click Choose Location again.",
          status: "warning",
          duration: 5000,
          position: "top",
          isClosable: true,
        });
      }
      // Seamlessly fallback to IP-based city detection
      const ipSuccess = await fallbackIpLocation();
      if (!ipSuccess && err.code !== 1) {
        toast({
          title: "Location Detection Unavailable",
          description: "Unable to detect GPS. Please ensure your browser location permissions are enabled.",
          status: "warning",
          duration: 3500,
          position: "top",
          isClosable: true,
        });
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const categoryNavigationItems = buildCategoryNavigationItems(
    (siteData?.categories || []).filter((category) => (category?.is_live ?? 1) && (category?.status ?? 1))
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all">
        {/* Full-width Desktop Navbar */}
        <div className="hidden lg:flex w-full max-w-[1600px] mx-auto px-6 lg:px-12 h-20 items-center justify-between gap-6 xl:gap-8">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 transition-transform hover:opacity-90">
            <img
              src="/images/logo/logo.webp"
              alt="Yumeat Logo"
              className="h-11 w-auto object-contain"
            />
          </Link>

          {/* Location Picker - Direct Click to Detect */}
          <div
            className="flex items-center gap-2.5 bg-gray-50/90 hover:bg-white border border-gray-200/80 hover:border-brand/40 shadow-card-subtle hover:shadow-premium rounded-xl px-3.5 py-2 cursor-pointer transition-all max-w-[240px] group"
            onClick={handleDetectLocation}
            title={savedAddress ? `Delivering to: ${savedAddress} (Click to re-detect)` : "Click to detect live location"}
          >
            <div className="relative flex items-center justify-center">
              {isDetectingLocation ? (
                <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <HiOutlineLocationMarker className="w-5 h-5 text-brand flex-shrink-0 group-hover:scale-110 transition-transform" />
              )}
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Deliver To <span className="text-[9px] text-emerald-600 font-bold lowercase tracking-normal bg-emerald-50 px-1 rounded">live</span>
              </span>
              <span className="text-xs font-semibold text-gray-800 truncate group-hover:text-brand transition-colors">
                {isDetectingLocation ? "Detecting location..." : (savedAddress || "Choose Location")}
              </span>
            </div>
          </div>

          {/* Expanded Search Bar */}
          <div className="flex-1 max-w-2xl mx-2">
            <Search />
          </div>

          {/* Categories Dropdown */}
          <div className="flex-shrink-0">
            <Menu>
              <MenuButton className="flex items-center gap-2 font-semibold text-gray-700 hover:text-brand text-sm transition-colors py-2.5 px-3.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200">
                <span>Categories</span>
                <span className="text-xs text-gray-400">▼</span>
              </MenuButton>
              <Portal>
                <MenuList className="z-50 shadow-2xl border border-gray-100 rounded-2xl p-2 bg-white min-w-[240px]">
                  {loading ? (
                    <div className="p-4 text-xs text-gray-400 text-center">Loading categories...</div>
                  ) : (
                    categoryNavigationItems.map((item) => (
                      <MenuItem
                        key={item.key}
                        onClick={() => router.push(item.href)}
                        className="rounded-xl hover:bg-red-50 text-gray-700 hover:text-brand transition-colors p-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image && /^https?:\/\//i.test(item.image) ? item.image : assetUrl(item.image) || "/images/logo/logo.webp"}
                            alt={item.name}
                            className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-100 p-1"
                          />
                          <span className="font-semibold text-sm">{item.name}</span>
                        </div>
                      </MenuItem>
                    ))
                  )}
                </MenuList>
              </Portal>
            </Menu>
          </div>

          {/* User Profile / Quick Login */}
          <div className="flex items-center gap-4 xl:gap-6 flex-shrink-0">
            {!username ? (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-brand transition-colors py-2.5 px-4 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <HiOutlineUser className="w-5 h-5 text-gray-500" />
                <span>Quick Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/profile")}
                title={username ? `Profile (${username})` : "Profile"}
                className="w-9 h-9 rounded-full bg-brand hover:bg-[#b00f38] active:scale-95 text-white text-xs font-bold flex items-center justify-center shadow-xs transition-all focus:outline-none cursor-pointer"
                aria-label="Profile"
              >
                {userInitials || "MK"}
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => drawerBag.onOpen()}
              className="relative flex items-center gap-2.5 bg-brand hover:bg-[#b00f38] active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <HiOutlineShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Cart</span>
              {localCartCount > 0 && (
                <span className="bg-white text-brand text-xs font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shadow-xs">
                  {localCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col bg-white/95 backdrop-blur-md">
          {/* Top Bar: Clean h-14 */}
          <div className="flex items-center justify-between px-3 h-14 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={mobileNavDrawer.onOpen}
                className="p-1.5 text-gray-700 hover:text-brand focus:outline-none"
                aria-label="Open menu"
              >
                <HiMenu className="w-6 h-6" />
              </button>
              <Link href="/" className="flex items-center">
                <img
                  src="/images/logo/logo.webp"
                  alt="Yumeat Logo"
                  className="h-7 w-auto object-contain"
                />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {/* Deliver to address pill - Direct Click to Detect */}
              <div
                onClick={handleDetectLocation}
                className="flex items-center gap-1.5 bg-gray-50 hover:bg-red-50 border border-gray-200/80 rounded-xl px-2 py-1 cursor-pointer max-w-[130px] sm:max-w-[180px] transition-colors"
                title={savedAddress ? `Delivering to: ${savedAddress} (Click to re-detect)` : "Click to detect live location"}
              >
                <div className="relative flex items-center justify-center">
                  {isDetectingLocation ? (
                    <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <HiOutlineLocationMarker className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                  )}
                  <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-700 truncate">
                  {isDetectingLocation ? "Detecting..." : (savedAddress ? savedAddress.split(",")[0] : "Location")}
                </span>
              </div>

              {/* Login / Profile */}
              {!username ? (
                <button
                  onClick={handleLogin}
                  className="px-2.5 py-1 text-xs font-bold text-brand hover:bg-red-50 rounded-lg"
                >
                  Login
                </button>
              ) : (
                <div
                  onClick={() => router.push("/profile")}
                  className="w-7 h-7 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {userInitials || "MK"}
                </div>
              )}

              {/* Cart Button */}
              <button
                onClick={() => drawerBag.onOpen()}
                aria-label="Cart"
                className="relative p-1.5 text-gray-700 hover:text-brand"
              >
                <HiOutlineShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {localCartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {localCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Row: Full width */}
          <div className="px-3 pb-2 pt-1.5">
            <Search />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        onClose={mobileNavDrawer.onClose}
        isOpen={mobileNavDrawer.isOpen}
      >
        <DrawerOverlay />
        <DrawerContent className="max-w-xs bg-white">
          <DrawerCloseButton className="top-4 right-4 text-gray-500" />
          <DrawerHeader className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <img src="/images/logo/logo.webp" alt="Yumeat" className="h-7 w-auto" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Navigation</span>
            </div>
          </DrawerHeader>
          <DrawerBody className="p-4 space-y-6 overflow-y-auto">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              {username ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                      {userInitials || "MK"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{username}</p>
                      <p className="text-[11px] text-gray-500">Welcome back!</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-brand hover:underline cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    mobileNavDrawer.onClose();
                    handleLogin();
                  }}
                  className="w-full py-2.5 bg-brand text-white font-bold rounded-xl text-sm shadow hover:bg-brand-600 transition-colors cursor-pointer"
                >
                  Login / Register
                </button>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Shop by Category</p>
              <div className="grid grid-cols-2 gap-2.5">
                {categoryNavigationItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={mobileNavDrawer.onClose}
                    className="flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-brand-100 hover:bg-red-50/50 transition-all text-center"
                  >
                    <img
                      src={item.image && /^https?:\/\//i.test(item.image) ? item.image : assetUrl(item.image) || "/images/logo/logo.webp"}
                      alt={item.name}
                      className="w-11 h-11 rounded-lg object-contain mb-1.5"
                    />
                    <span className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My Account</p>
              <nav className="flex flex-col space-y-1">
                <Link
                  href="/orders"
                  onClick={mobileNavDrawer.onClose}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  My Orders
                </Link>
                <Link
                  href="/profile"
                  onClick={mobileNavDrawer.onClose}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Profile Details
                </Link>
                <Link
                  href="/referral"
                  onClick={mobileNavDrawer.onClose}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Refer & Earn
                </Link>
                <Link
                  href="/raise-query"
                  onClick={mobileNavDrawer.onClose}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Help & Support
                </Link>
              </nav>
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Bag_Drawer onClose={drawerBag.onClose} isOpen={drawerBag.isOpen} />
      <QuickLoginDrawer onClose={quickLoginDrawer.onClose} isOpen={quickLoginDrawer.isOpen} />

      {/* Fixed Mobile Bottom Bar (Thumb-friendly Navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 lg:hidden px-2 py-1.5 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-gray-600 hover:text-brand transition-colors py-1 px-3"
        >
          <HiOutlineHome className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </Link>
        <button
          type="button"
          onClick={mobileNavDrawer.onOpen}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-brand transition-colors py-1 px-3"
        >
          <HiOutlineViewGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Categories</span>
        </button>
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            const searchEl = document.querySelector('input[type="text"]');
            searchEl?.focus();
          }}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-brand transition-colors py-1 px-3"
        >
          <HiOutlineSearch className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Search</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (username) router.push("/orders");
            else handleLogin();
          }}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-brand transition-colors py-1 px-3"
        >
          <HiOutlineUser className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">{username ? "Orders" : "Account"}</span>
        </button>
        <button
          type="button"
          onClick={() => drawerBag.onOpen()}
          className="relative flex flex-col items-center justify-center text-gray-600 hover:text-brand transition-colors py-1 px-3"
        >
          <div className="relative">
            <HiOutlineShoppingCart className="w-5 h-5" />
            {localCartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {localCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">Cart</span>
        </button>
      </nav>
    </>
  );
}
