"use client";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Center,
  Box,
  List,
  Container,
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
  Button,
  Hide,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  IconButton,
} from "@chakra-ui/react";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import News from "./News";
import "slick-carousel/slick/slick-theme.css";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./HomePage.css";
import { useSiteData } from "../Context/SiteDataContext";
import { useDispatch } from "react-redux";
import { addProductToCart } from "../../redux/ProductReducer/action";
import React from "react";
import { AppContext } from "../Context/ContextProvider";
import { useCart } from "../Context/CartContext";

const LOCATION_LATITUDE_KEY = "session-latitude";
const LOCATION_LONGITUDE_KEY = "session-longitude";
const USER_LOCATION_KEY = "userLocation";

let googleMapsScriptPromise = null;

function clearSessionLocationStorage() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(LOCATION_LATITUDE_KEY);
  sessionStorage.removeItem(LOCATION_LONGITUDE_KEY);
  sessionStorage.removeItem(USER_LOCATION_KEY);
}

function loadGoogleMapsPlaces(apiKey) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is missing"));
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-places-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function parseStoredLocation() {
  if (typeof window === "undefined") return null;

  const latitude = sessionStorage.getItem(LOCATION_LATITUDE_KEY);
  const longitude = sessionStorage.getItem(LOCATION_LONGITUDE_KEY);
  const savedLocation = sessionStorage.getItem(USER_LOCATION_KEY);

  if (!savedLocation && !latitude && !longitude) {
    return null;
  }

  try {
    const parsed = savedLocation ? JSON.parse(savedLocation) : {};
    return {
      ...parsed,
      latitude: latitude ?? parsed?.latitude ?? null,
      longitude: longitude ?? parsed?.longitude ?? null,
    };
  } catch (error) {
    return {
      address: "",
      latitude,
      longitude,
    };
  }
}

function SmapleNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", color: "black", right: "-8px" }}
      onClick={onClick}
    >
      <ChevronRightIcon w={"40px"} h={"40px"} />
    </div>
  );
}
//

function SmaplePrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: "block", color: "black" }}
      onClick={onClick}
    >
      <ChevronLeftIcon w={"40px"} h={"40px"} />
    </div>
  );
}

const HomePage = ({ initialSiteData = null }) => {
  const [data, setData] = useState([]);
  const [bonelessData, setBonelessData] = useState([]);
  const [breakfast, setBreakfast] = useState([]);
  const [newsData, setnewsData] = useState([]);
  const [selectedCuts, setSelectedCuts] = useState({});
  const [quantities, setQuantities] = useState({});
  const [quantityUnits, setQuantityUnits] = useState({});
  const [showFlashBanner, setShowFlashBanner] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const { siteData: contextSiteData, assetUrl } = useSiteData();
  const siteData = contextSiteData ?? initialSiteData;
  const dispatch = useDispatch();
  const ctx = React.useContext(AppContext);
  const toast = useToast();
  const { refreshCart } = useCart();
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;

  // Extract best seller products
  const bestSellerProducts = useMemo(() => {
    const allProducts = [];
    const categories = siteData?.categories || [];
    categories.forEach((category) => {
      const products = category?.products || [];
      products.forEach((product) => {
        if (product.is_best_seller === true || product.is_best_seller === 1) {
          allProducts.push(product);
        }
      });
    });
    return allProducts;
  }, [siteData]);

  const allCategoryProducts = useMemo(() => {
    const categories = siteData?.categories || [];
    return categories.flatMap((category) => category?.products || []);
  }, [siteData]);

  useEffect(() => {
    console.log("All products count:", allCategoryProducts.length);
  }, [allCategoryProducts]);

  // Extract why us items
  const whyUsData = useMemo(() => {
    const items = siteData?.why_us || [];
    return items.filter((item) => (item?.show_live ?? 1) && (item?.status ?? 1));
  }, [siteData]);

  // Get active flash banners
  const flashBanners = useMemo(() => {
    const banners = siteData?.flash_banners;
    if (!banners) return [];
    // Handle if flash_banners is a single object instead of array
    const bannerArray = Array.isArray(banners) ? banners : [banners];
    return bannerArray.filter((b) => (b?.is_live ?? 1) && (b?.status ?? 1));
  }, [siteData]);

  // Check if flash banner should be shown
  useEffect(() => {
    if (typeof window !== 'undefined' && flashBanners.length > 0) {
      const hasSeenFlashBanner = localStorage.getItem('hasSeenFlashBanner');
      if (!hasSeenFlashBanner) {
        setShowFlashBanner(true);
      }
    }
  }, [flashBanners]);

  // Check if location modal should be shown
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocation = parseStoredLocation();
      if (storedLocation) {
        setUserLocation(storedLocation);
        setLocationInput(storedLocation.address || "");
      }

      const hasCoordinates =
        Boolean(sessionStorage.getItem(LOCATION_LATITUDE_KEY)) &&
        Boolean(sessionStorage.getItem(LOCATION_LONGITUDE_KEY));

      if (!hasCoordinates && !showFlashBanner) {
        // Show location modal after flash banner is closed or if no flash banner
        const timer = setTimeout(() => {
          setShowLocationModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [showFlashBanner]);

  useEffect(() => {
    const trimmedInput = locationInput.trim();
    if (!showLocationModal || trimmedInput.length < 2) {
      setLocationSuggestions([]);
      return undefined;
    }

    if (!isGoogleReady) {
      if (!googleMapsApiKey) {
        setGoogleLoadError("Address search is unavailable because the Google Maps API key is missing.");
        return undefined;
      }

      loadGoogleMapsPlaces(googleMapsApiKey)
        .then(() => {
          setIsGoogleReady(true);
          setGoogleLoadError("");
        })
        .catch((error) => {
          console.error("Google Maps failed to load:", error.message);
          setIsGoogleReady(false);
          setGoogleLoadError(
            "Address search is unavailable. Enable Maps JavaScript API and Places API for this Google Maps key."
          );
        });

      return undefined;
    }

    const timer = window.setTimeout(() => {
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        {
          input: trimmedInput,
          types: ["geocode"],
        },
        (predictions, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
            setLocationSuggestions([]);
            return;
          }

          setLocationSuggestions(predictions.slice(0, 5));
        }
      );
    }, 250);

    return () => window.clearTimeout(timer);
  }, [googleMapsApiKey, isGoogleReady, locationInput, showLocationModal]);

  // Handle temporary closing flash banner (just close, show again next time)
  const handleCloseFlashBanner = () => {
    setShowFlashBanner(false);
  };

  // Handle permanent dismiss - Don't show anymore
  const handleDontShowAnymore = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenFlashBanner', '1');
    }
    setShowFlashBanner(false);
  };

  // Handle flash banner redirect
  const handleFlashBannerClick = (redirectLink) => {
    if (redirectLink) {
      setShowFlashBanner(false);
      window.location.href = redirectLink;
    }
  };

  const persistLocation = ({ latitude, longitude, address, source, placeId = null }) => {
    const normalizedLocation = {
      address: address || "",
      latitude: String(latitude),
      longitude: String(longitude),
      source,
      placeId,
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem(LOCATION_LATITUDE_KEY, normalizedLocation.latitude);
      sessionStorage.setItem(LOCATION_LONGITUDE_KEY, normalizedLocation.longitude);
      sessionStorage.setItem(USER_LOCATION_KEY, JSON.stringify(normalizedLocation));
      window.dispatchEvent(new Event("userLocationUpdated"));
    }

    setUserLocation(normalizedLocation);
    setLocationInput(normalizedLocation.address);
    setLocationSuggestions([]);
    setShowLocationModal(false);
  };

  const reverseGeocodeCoordinates = (latitude, longitude) =>
    new Promise((resolve) => {
      if (!window.google?.maps?.Geocoder) {
        resolve("");
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        {
          location: {
            lat: latitude,
            lng: longitude,
          },
        },
        (results, status) => {
          if (status === "OK" && results?.[0]?.formatted_address) {
            resolve(results[0].formatted_address);
            return;
          }

          resolve("");
        }
      );
    });

  const ensureGoogleMapsReady = async () => {
    if (window.google?.maps?.places) {
      setIsGoogleReady(true);
      setGoogleLoadError("");
      return true;
    }

    if (!googleMapsApiKey) {
      setGoogleLoadError("Address search is unavailable because the Google Maps API key is missing.");
      return false;
    }

    try {
      await loadGoogleMapsPlaces(googleMapsApiKey);
      setIsGoogleReady(true);
      setGoogleLoadError("");
      return true;
    } catch (error) {
      console.error("Google Maps failed to load:", error.message);
      setIsGoogleReady(false);
      setGoogleLoadError(
        "Address search is unavailable. Enable Maps JavaScript API and Places API for this Google Maps key."
      );
      return false;
    }
  };

  const resolvePlaceSelection = async (placeId) => {
    const googleReady = await ensureGoogleMapsReady();
    if (!googleReady || !window.google?.maps?.places?.PlacesService) {
      toast({
        title: "Location search unavailable",
        description: googleLoadError || "Google Places could not be loaded.",
        status: "error",
        duration: 3500,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setIsResolvingLocation(true);
    const placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
    placesService.getDetails(
      {
        placeId,
        fields: ["formatted_address", "geometry", "name", "place_id"],
      },
      (place, status) => {
        setIsResolvingLocation(false);

        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          toast({
            title: "Could not select location",
            description: "Please try a different address.",
            status: "error",
            duration: 2500,
            isClosable: true,
            position: "top",
          });
          return;
        }

        persistLocation({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          address: place.formatted_address || place.name || locationInput.trim(),
          source: "google-places",
          placeId: place.place_id || placeId,
        });

        toast({
          title: "Location saved",
          description: place.formatted_address || place.name || "Selected location saved successfully.",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "top",
        });
      }
    );
  };

  // Handle location detection
  const handleDetectLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast({
        title: "Location unsupported",
        description: "Geolocation is not available in this browser.",
        status: "error",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setIsDetectingLocation(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log("Detected location:", latitude, longitude);
      const detectedAddress = await reverseGeocodeCoordinates(latitude, longitude);

      persistLocation({
        latitude,
        longitude,
        address: detectedAddress || "Current location",
        source: "browser-geolocation",
      });

      toast({
        title: "Location detected",
        description: detectedAddress || "Your current coordinates were saved.",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      const denied = error?.code === 1;
      toast({
        title: denied ? "Location permission denied" : "Could not detect location",
        description: denied
          ? "Allow location access or choose an address from the dropdown."
          : "Please try again or search for your location below.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Handle manual location submit
  const handleLocationSubmit = async () => {
    if (!locationInput.trim()) {
      toast({
        title: "Location required",
        description: "Please enter your location.",
        status: "warning",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const googleReady = await ensureGoogleMapsReady();
    if (!googleReady || !window.google?.maps?.Geocoder) {
      toast({
        title: "Location search unavailable",
        description:
          googleLoadError || "Enable Maps JavaScript API and Places API, then try searching again.",
        status: "warning",
        duration: 3500,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setIsResolvingLocation(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: locationInput.trim() }, (results, status) => {
      setIsResolvingLocation(false);

      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        toast({
          title: "Location not found",
          description: "Please pick a location from the dropdown suggestions.",
          status: "warning",
          duration: 2500,
          isClosable: true,
          position: "top",
        });
        return;
      }

      persistLocation({
        latitude: results[0].geometry.location.lat(),
        longitude: results[0].geometry.location.lng(),
        address: results[0].formatted_address || locationInput.trim(),
        source: "manual-search",
        placeId: results[0].place_id || null,
      });

      toast({
        title: "Location saved",
        description: results[0].formatted_address || locationInput.trim(),
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    });
  };

  const heroSlides = useMemo(() => {
    const banners = siteData?.banners || [];
    return banners
      .filter((b) => (b?.show_live ?? 1) && (b?.status ?? 1))
      .map((b) => ({
        id: b.id,
        src: b.banner_path_url || assetUrl(b.banner_path),
        href: b.redirect_link || null,
      }));
  }, [siteData, assetUrl]);

  const heroSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    nextArrow: <SmapleNextArrow />,
    prevArrow: <SmaplePrevArrow />,
    pauseOnHover: true,
    fade: false,
  };

  let settings = {
    dots: true,
    infintie: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    nextArrow: <SmapleNextArrow />,
    prevArrow: <SmaplePrevArrow />,
    responsive: [
      {
        breakpoint: 1284,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
        },
      },
    ],
  };

  const whyUsSettings = {
    dots: true,
    infinite: whyUsData.length > 1,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: whyUsData.length > 1,
    autoplaySpeed: 3000,
    arrows: false,
    pauseOnHover: true,
    fade: false,
    responsive: [
      {
        breakpoint: 1284,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: whyUsData.length > 1,
        },
      },
    ],
  };

  // useEffect(() => {
  //   axios.get("https://licious-database.vercel.app/bestsellers").then((res) => {
  //     setData(res.data);
  //   });
  // }, []);
  // useEffect(() => {
  //   axios
  //     .get("https://licious-database.vercel.app/bonelesscuts")
  //     .then((res) => {
  //       setBonelessData(res.data);
  //     });
  // }, []);
  // useEffect(() => {
  //   axios.get("https://licious-database.vercel.app/breakfast").then((res) => {
  //     setBreakfast(res.data);
  //   });
  // }, []);
  // useEffect(()=>{
  //   axios.get('https://licious-database.vercel.app/news').then((res)=>{
  //     setnewsData(res.data)
  //   })
  // })

  const handleAddToCart = (p) => {
    const hasCuts = Array.isArray(p.cuttypes) && p.cuttypes.length > 0;
    const selectedCutId = selectedCuts[p.id];
    if (hasCuts && !selectedCutId) {
      toast({
        title: "Select a cut type",
        description: "Please choose a cut from the dropdown.",
        status: "warning",
        duration: 2500,
        isClosable: true,
        position: "top",
      });
      return;
    }
    const customerId = (typeof window !== 'undefined') ? localStorage.getItem('Customer_id') : null;
    if (!customerId) {
      ctx?.handleClick?.();
      return;
    }
    const qty = Number(quantities[p.id] ?? 1);
    const unit = quantityUnits[p.id] ?? "gram";
    if (!qty || qty <= 0) {
      toast({
        title: "Enter quantity",
        description: "Quantity must be at least 1.",
        status: "warning",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    const payload = {
      customer_id: Number(customerId),
      product_id: p.id,
      product_cut_id: selectedCutId ?? null,
      quantity: qty,
      quantity_unit: unit,
    };
    dispatch(addProductToCart(payload))
      .then(() => {
        toast({
          title: "Added to cart",
          status: "success",
          duration: 1500,
          isClosable: true,
          position: "top",
        });
        refreshCart();
      })
      .catch((err) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || "Failed to add to cart";
        if (status === 401 || /Unauthenticated/i.test(String(msg))) {
          toast({
            title: "Please login",
            description: "Login required to add items to cart.",
            status: "warning",
            duration: 2500,
            isClosable: true,
            position: "top",
          });
          ctx?.handleClick?.();
          return;
        }
        toast({
          title: "Error",
          description: msg,
          status: "error",
          duration: 2500,
          isClosable: true,
          position: "top",
        });
      });
  };

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleBeforeUnload = () => {
      clearSessionLocationStorage();
    };

    const handleUserLoggedOut = () => {
      clearSessionLocationStorage();
      setUserLocation(null);
      setLocationInput("");
      setLocationSuggestions([]);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("userLoggedOut", handleUserLoggedOut);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("userLoggedOut", handleUserLoggedOut);
    };
  }, []);

  return (
    <div>
      {/* Flash Banner Modal */}
      <Modal 
        isOpen={showFlashBanner && flashBanners.length > 0} 
        onClose={handleCloseFlashBanner}
        size="xl"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent maxW="600px" bg="transparent" boxShadow="none">
          <ModalCloseButton
            position="absolute"
            top="-40px"
            right="-10px"
            color="white"
            bg="red.500"
            borderRadius="full"
            _hover={{ bg: "red.600" }}
            zIndex={1}
          />
          <ModalBody p={0} position="relative">
            {flashBanners.map((banner, index) => {
              const imageUrl = banner.image_url || (banner.image ? assetUrl(`storage/${banner.image}`) : '');
              console.log('Flash Banner Data:', banner);
              console.log('Final Image URL:', imageUrl);
              return (
                <Box 
                  key={banner.id || index}
                  onClick={() => banner.redirect_link && handleFlashBannerClick(banner.redirect_link)}
                  cursor={banner.redirect_link ? "pointer" : "default"}
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <Image
                    src={imageUrl}
                    alt={banner.name || "Flash Banner"}
                    width="100%"
                    borderRadius="lg"
                    onError={(e) => {
                      console.error('Flash banner image failed to load:', e.target.src);
                    }}
                  />
                </Box>
              );
            })}
            <Box
              position="absolute"
              bottom="20px"
              left="50%"
              transform="translateX(-50%)"
              display="flex"
              gap={3}
              flexDirection="column"
              alignItems="center"
            >
              <Button
                colorScheme="red"
                onClick={handleCloseFlashBanner}
                size="lg"
                fontWeight="bold"
                minW="200px"
              >
                Continue to Site
              </Button>
              <Button
                variant="outline"
                colorScheme="whiteAlpha"
                onClick={handleDontShowAnymore}
                size="sm"
                fontWeight="bold"
                bg="blackAlpha.600"
                color="white"
                _hover={{ bg: "blackAlpha.800" }}
                minW="200px"
              >
                Don&apos;t Show Anymore
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Location Permission Modal */}
      <Modal
        isOpen={showLocationModal} 
        onClose={() => setShowLocationModal(false)}
        size="md"
        isCentered
        closeOnOverlayClick={false}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={6}>
            <Box textAlign="center" mb={4}>
              <Box fontSize="24px" mb={2}>📍</Box>
              <Text fontSize="xl" fontWeight="bold" mb={2}>
                Location Permission
              </Text>
              <Text fontSize="sm" color="gray.600">
                Please provide your delivery location for the best experience.
              </Text>
            </Box>

            <Box display="flex" flexDirection="column" gap={3}>
              <Button
                colorScheme="blackAlpha"
                bg="black"
                color="white"
                size="lg"
                onClick={handleDetectLocation}
                _hover={{ bg: "gray.800" }}
                isLoading={isDetectingLocation}
              >
                Detect Location
              </Button>

              <Box display="flex" alignItems="center" gap={2}>
                <Box flex={1} height="1px" bg="gray.300" />
                <Text fontSize="sm" color="gray.500">OR</Text>
                <Box flex={1} height="1px" bg="gray.300" />
              </Box>

              <Input
                placeholder="Search your address or area"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                size="lg"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLocationSubmit();
                  }
                }}
              />

              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                overflow="hidden"
                display={locationSuggestions.length > 0 ? "block" : "none"}
              >
                {locationSuggestions.map((suggestion, index) => (
                  <Box
                    key={`${suggestion.place_id}-${index}`}
                    px={4}
                    py={3}
                    cursor="pointer"
                    borderBottom={index === locationSuggestions.length - 1 ? "none" : "1px solid"}
                    borderColor="gray.100"
                    _hover={{ bg: "gray.50" }}
                    onClick={() => resolvePlaceSelection(suggestion.place_id)}
                  >
                    <Text fontSize="sm" fontWeight="600" color="gray.800">
                      {suggestion.structured_formatting?.main_text || suggestion.description}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {suggestion.structured_formatting?.secondary_text || suggestion.description}
                    </Text>
                  </Box>
                ))}
              </Box>

              {!isGoogleReady && locationInput.trim().length >= 2 ? (
                <Text fontSize="xs" color="gray.500">
                  Loading location search...
                </Text>
              ) : null}

              {googleLoadError ? (
                <Text fontSize="xs" color="red.500">
                  {googleLoadError}
                </Text>
              ) : null}

              {userLocation?.address ? (
                <Text fontSize="xs" color="gray.600">
                  Current saved location: {userLocation.address}
                </Text>
              ) : null}

              <Button
                colorScheme="red"
                size="lg"
                onClick={handleLocationSubmit}
                isDisabled={!locationInput.trim() || isResolvingLocation}
                isLoading={isResolvingLocation}
              >
                Use This Location
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Box>
        <Box background={"#eaeaea"}>
          <Slider {...heroSettings}>
            {heroSlides.map((b) => (
              <Box key={b.id || b.src}>
                {b.href ? (
                  <a href={b.href}>
                    <Image border="0" src={b.src} alt="banner" />
                  </a>
                ) : (
                  <Image border="0" src={b.src} alt="banner" />
                )}
              </Box>
            ))}
          </Slider>
        </Box>
      </Box>

      <Box>
        <Center>
          <Box w={"70%"}>
            <Text as="h2" className="title_heading" fontSize={"22px"}>
              Shop by categories
            </Text>
            <Box className="subtitle_text_name">
              Freshest meats just for you
            </Box>
          </Box>
        </Center>
        <Center>
          <Box className="shop_categories_data">
            <UnorderedList className="cateogoires_titles">
              {(siteData?.categories || []).filter((c) => (c?.is_live ?? 1) && (c?.status ?? 1)).map((cat) => (
                <ListItem key={cat.id}>
                  <Link href={`/category/${(cat.category_type || cat.category_name).toLowerCase().replace(/\s+/g, "-")}`}>
                    <Box className="list_data" cursor="pointer">
                      <Box className="list_img_categories">
                        <figure>
                          <Image src={cat.category_image_url || assetUrl(cat.category_image)} alt={cat.category_name} />
                        </figure>
                      </Box>
                      <Text className="text">{cat.category_name}</Text>
                    </Box>
                  </Link>
                </ListItem>
              ))}
            </UnorderedList>
          </Box>
        </Center>
      </Box>

      {/* <Hide below="lg">
        <Box className="metaopia_heading">
          <Box className="metopia_banner_data">
            <Image
              className="metopia_logo"
              src="https://www.licious.in/img/rebranding/loyalty_licious_logo.svg"
              alt="meatopia-image"
            />
            <Button className="metopia_join_now">JOIN NOW</Button>
          </Box>
          <hr></hr>
          <Box className="meatopia_bottom">
            <b>
              Join MEATOPIA to get free delivery on all orders with cart value
              more than Rs.99.
            </b>
          </Box>
        </Box>
      </Hide> */}
      <Center>
        {/* <Box className="know_about_licious">
          <Text as="h2">Know the Licious way</Text>
          <UnorderedList>
            <ListItem>
              Premium
              <Text>Produce</Text>
            </ListItem>
            <ListItem>
              World-class central
              <Text>Production unit</Text>
            </ListItem>
            <ListItem>
              150 Quality
              <Text>Checks</Text>
            </ListItem>
            <ListItem>
              Delivered Fresh
              <Text>Everyday</Text>
            </ListItem>
            <ListItem>
              Extraordinary
              <Text>cooking</Text>
            </ListItem>
          </UnorderedList>
          <Box className="discovered_licious_way">
            Discover How
            <Image
              src="https://www.licious.in/img/rebranding/arrow.png"
              alt="discovered licious"
            />
          </Box>
        </Box> */}
      </Center>
      {/* <Hide below="lg">
        <Box className="bank_offer">
          <Image
            src="https://dao54xqhg9jfa.cloudfront.net/OMS-StaticBanner/a5372f18-3f0a-a801-0160-cb20957f3acd/original/static-bank-units-nov-web.jpg?format=webp"
            alt="bank-offer"
          />
        </Box>
      </Hide> */}

      <Box ml="80px" mt="20px">
        <Text
          as="h2"
          fontSize={"22px"}
          fontWeight="600"
          color={"#4a4a4a"}
          display={"inline-block"}
        >
          Best Sellers
        </Text>
      </Box>

      <div style={{ margin: "auto", justifyContent: "center", width: "85%", marginTop: "20px" }}>
        {bestSellerProducts.length > 0 ? (
          <Slider {...settings}>
            {bestSellerProducts.map((p) => (
              <Box
                key={p.id}
                margin="auto"
                borderWidth={"1px"}
                borderRadius="lg"
                overflow={"hidden"}
                p={3}
              >
                <Link href={`/product/${p.id}`} style={{ cursor: 'pointer' }}>
                  <Image
                    src={p.primary_image_url || assetUrl(p.primary_image)}
                    alt={p.name}
                    width="100%"
                    height="200px"
                    objectFit="cover"
                    _hover={{ opacity: 0.8 }}
                    transition="opacity 0.2s"
                  />
                </Link>
                <Box mt={3}>
                  <Link href={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Text fontWeight="600" fontSize="16px" _hover={{ color: '#D11243' }} cursor="pointer" mb={2}>
                      {p.name}
                    </Text>
                  </Link>
                  {p.price && <Text color="gray.700" fontWeight="bold" mb={3}>₹{p.price}</Text>}
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Select
                      size="sm"
                      placeholder={p.cuttypes?.length ? "Select cut type" : "No cuts available"}
                      value={selectedCuts[p.id] ?? ""}
                      onChange={(e) => setSelectedCuts((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))}
                      isDisabled={!p.cuttypes || p.cuttypes.length === 0}
                    >
                      {(p.cuttypes || []).map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                      ))}
                    </Select>
                    
                    <Box display="flex" gap={2}>
                      <Input
                        size="sm"
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={quantities[p.id] ?? ""}
                        onChange={(e) => setQuantities((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        flex={1}
                      />
                      <Select
                        size="sm"
                        value={quantityUnits[p.id] ?? "gram"}
                        onChange={(e) => setQuantityUnits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        flex={1}
                      >
                        <option value="gram">gram</option>
                        <option value="kg">kg</option>
                        <option value="piece">piece</option>
                        <option value="pack">pack</option>
                      </Select>
                    </Box>
                    
                    <Button 
                      width="100%" 
                      height="42px"
                      colorScheme="red" 
                      size="sm"
                      onClick={() => handleAddToCart(p)}
                    >
                      Add To Cart
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Slider>
        ) : (
          <Box p={4}>
            <Text>No best seller products available.</Text>
          </Box>
        )}
      </div>

      <Box ml="80px" mt="50px">
        <Text
          as="h2"
          fontSize={"22px"}
          fontWeight="600"
          color={"#4a4a4a"}
          display={"inline-block"}
        >
          All Products
        </Text>
      </Box>

      <div style={{ margin: "auto", justifyContent: "center", width: "85%", marginTop: "20px" }}>
        {allCategoryProducts.length > 0 ? (
          <Slider {...settings}>
            {allCategoryProducts.map((p) => (
              <Box
                key={`all-product-${p.id}`}
                margin="auto"
                borderWidth={"1px"}
                borderRadius="lg"
                overflow={"hidden"}
                p={3}
              >
                <Link href={`/product/${p.id}`} style={{ cursor: "pointer" }}>
                  <Image
                    src={p.primary_image_url || assetUrl(p.primary_image)}
                    alt={p.name}
                    width="100%"
                    height="200px"
                    objectFit="cover"
                    _hover={{ opacity: 0.8 }}
                    transition="opacity 0.2s"
                  />
                </Link>
                <Box mt={3}>
                  <Link href={`/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <Text fontWeight="600" fontSize="16px" _hover={{ color: "#D11243" }} cursor="pointer" mb={2}>
                      {p.name}
                    </Text>
                  </Link>
                  {p.price && <Text color="gray.700" fontWeight="bold" mb={3}>â‚¹{p.price}</Text>}

                  <Box display="flex" flexDirection="column" gap={2}>
                    <Select
                      size="sm"
                      placeholder={p.cuttypes?.length ? "Select cut type" : "No cuts available"}
                      value={selectedCuts[p.id] ?? ""}
                      onChange={(e) => setSelectedCuts((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))}
                      isDisabled={!p.cuttypes || p.cuttypes.length === 0}
                    >
                      {(p.cuttypes || []).map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                      ))}
                    </Select>

                    <Box display="flex" gap={2}>
                      <Input
                        size="sm"
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={quantities[p.id] ?? ""}
                        onChange={(e) => setQuantities((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        flex={1}
                      />
                      <Select
                        size="sm"
                        value={quantityUnits[p.id] ?? "gram"}
                        onChange={(e) => setQuantityUnits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        flex={1}
                      >
                        <option value="gram">gram</option>
                        <option value="kg">kg</option>
                        <option value="piece">piece</option>
                        <option value="pack">pack</option>
                      </Select>
                    </Box>

                    <Button
                      width="100%"
                      height="42px"
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleAddToCart(p)}
                    >
                      Add To Cart
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Slider>
        ) : (
          <Box p={4}>
            <Text>No products available.</Text>
          </Box>
        )}
      </div>

      <Box ml="80px" mt="50px" mb="20px">
        <Text
          as="h2"
          fontSize={"22px"}
          fontWeight="600"
          color={"#4a4a4a"}
          display={"inline-block"}
        >
          Why Us
        </Text>
      </Box>

      <div style={{ margin: "auto", justifyContent: "center", width: "85%", marginTop: "20px" }}>
        {whyUsData.length > 0 ? (
          <Slider {...whyUsSettings}>
            {whyUsData.map((item) => (
              <div key={item.id} className="w-64 h-64 mx-auto rounded-xl shadow-md overflow-hidden">
                <img
                  src={assetUrl(item.image)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="mt-2 text-center">
                  <p className="font-semibold text-lg">{item.title}</p>
                </div>
              </div>
            ))}
          </Slider>
        ) : (
          <div className="p-4">
            <p>No why us items available.</p>
          </div>
        )}
      </div>



      {/* <Box ml="80px" mt="50px" mb="20px">
        <Text
          as="h2"
          fontSize={"22px"}
          fontWeight="600"
          color={"#4a4a4a"}
          display={"inline-block"}
        >
          Boneless Cuts
        </Text>
      </Box> */}


      {/* <Box ml="80px" mt="50px" mb="20px">
        <Text
          as="h2"
          fontSize={"22px"}
          fontWeight="600"
          color={"#4a4a4a"}
          display={"inline-block"}
        >
          Breakfast & Sneaking Specials
        </Text>
      </Box>

      <div style={{ margin: "auto", justifyContent: "center", width: "85%" }}>
        <Slider {...settings}>
          {breakfast.filter(el => el && el.id).map((el) => {
            return (
              <Box
                key={el.id}
                margin="auto"
                borderWidth={"1px"}
                borderRadius="lg"
                overflow={"hidden"}
              >
                <Image src={el.image} alt={el.title} />
                <Box className="best_seller_item_detail">
                  <Box className="best_seller_item_title">
                    <span className="best_seller_product_name">{el.title}</span>
                  </Box>
                  <Box className="best_seller_item_desc">{el.subtitle}</Box>
                  <Text className="best_seller_item_weight">
                    <span>{el.qty}</span>
                  </Text>
                  <Box className="best_seller_item_action">
                    <Box className="rate">
                      <span className="best_seller_price">₹{el.price}</span>
                    </Box>
                    <Hide below="md">
                      <Box className="action">
                        <Box className="action_slider">
                          <Button>Add To Cart</Button>
                        </Box>
                      </Box>
                    </Hide>
                  </Box>
                  <hr></hr>
                </Box>
                <Box className="product_messages">
                  <Box className="icon_messages">
                    <Image
                      src="https://www.licious.in/img/rebranding/express_delivery.svg"
                      alt="delivery image"
                    />
                    <span className="delivery_time">{el.time}</span>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Slider>
      </div> */}

      {/* <Hide below="lg">
        <Box className="blogs">
          <Box className="header">
            <Text as="h2">Check out our blog</Text>
          </Box>
          <Box className="checkoutblogs">
            <Box className="img_holder">
              <Image
                src="https://www.licious.in/blog/wp-content/uploads/2022/12/Shutterstock_1903754353.jpg"
                alt="blogimage1"
              />
              <Text as="h2">
                Chicken Korma is a Mughlai Classis That Everyone Should Know How
                to Make!
              </Text>
            </Box>
            <Box className="img_holder">
              <Image
                src="https://www.licious.in/blog/wp-content/uploads/2022/12/Shutterstock_2208727095.jpg"
                alt="blogimage1"
              />
              <Text as="h2">
                Sri Lankan Chicken Curry is Unmissable - Make this Recipe Today!
              </Text>
            </Box>
            <Box className="img_holder">
              <Image
                src="https://www.licious.in/blog/wp-content/uploads/2022/12/Shutterstock_677330572.jpg"
                alt="blogimage1"
              />
              <Text as="h2">
                Make The Delectable Chicken Curry With Coconut Milk Easily At
                Home!
              </Text>
            </Box>
          </Box>
        </Box>
      </Hide>
      <Hide below="md">
        <Box className="licious_meat">
          <Image
            src="https://d2407na1z3fc0t.cloudfront.net/homepageStaticBanner/homepageStaticBanner_62a34b8cba7db"
            alt="meat"
          />
        </Box>
      </Hide> */}

      <Box>
  
      </Box>
    </div>
  );
};
export default HomePage;
