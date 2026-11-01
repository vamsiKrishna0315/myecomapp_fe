"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useToast,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { HiSparkles, HiArrowRight } from "react-icons/hi";
import News from "./News";
import TrustBar from "./TrustBar";
import ProductCard from "./ProductCard";
import { useSiteData } from "../Context/SiteDataContext";
import { buildCategoryNavigationItems } from "../../utils/seo";
import { addProductToCart } from "../../redux/ProductReducer/action";
import { AppContext } from "../Context/ContextProvider";
import { useCart } from "../Context/CartContext";
import { getAllowedUnits, getDisplayPrice, getInitialUnit, getUnitText } from "../../utils/productUnits";

const LOCATION_LATITUDE_KEY = "session-latitude";
const LOCATION_LONGITUDE_KEY = "session-longitude";
const USER_LOCATION_KEY = "userLocation";

let googleMapsScriptPromise = null;

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
      existingScript.addEventListener("error", (err) => reject(err));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
  return googleMapsScriptPromise;
}

function HeroNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      type="button"
      className={`${className || ""} !hidden sm:!flex !w-11 sm:!w-12 !h-11 sm:!h-12 !bg-white/95 hover:!bg-white !backdrop-blur-md !shadow-premium hover:!shadow-premium-hover !rounded-full !items-center !justify-center !text-gray-800 hover:!text-brand !right-3 sm:!right-6 lg:!right-8 !z-30 transition-all focus:outline-none hover:scale-105 active:scale-95`}
      style={{ ...style }}
      onClick={onClick}
      aria-label="Next banner"
    >
      <ChevronRightIcon className="!w-6 !h-6" />
    </button>
  );
}

function HeroPrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      type="button"
      className={`${className || ""} !hidden sm:!flex !w-11 sm:!w-12 !h-11 sm:!h-12 !bg-white/95 hover:!bg-white !backdrop-blur-md !shadow-premium hover:!shadow-premium-hover !rounded-full !items-center !justify-center !text-gray-800 hover:!text-brand !left-3 sm:!left-6 lg:!left-8 !z-30 transition-all focus:outline-none hover:scale-105 active:scale-95`}
      style={{ ...style }}
      onClick={onClick}
      aria-label="Previous banner"
    >
      <ChevronLeftIcon className="!w-6 !h-6" />
    </button>
  );
}

function CustomNextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      type="button"
      className={`${className || ""} !hidden lg:!flex !w-11 !h-11 !bg-white !shadow-premium hover:!shadow-premium-hover !border !border-gray-200 !rounded-full !items-center !justify-center !text-gray-700 hover:!text-white hover:!bg-brand hover:!border-brand !-right-2 sm:!-right-5 !z-30 transition-all focus:outline-none hover:scale-105 active:scale-95`}
      style={{ ...style }}
      onClick={onClick}
      aria-label="Next slide"
    >
      <ChevronRightIcon className="!w-6 !h-6" />
    </button>
  );
}

function CustomPrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      type="button"
      className={`${className || ""} !hidden lg:!flex !w-11 !h-11 !bg-white !shadow-premium hover:!shadow-premium-hover !border !border-gray-200 !rounded-full !items-center !justify-center !text-gray-700 hover:!text-white hover:!bg-brand hover:!border-brand !-left-2 sm:!-left-5 !z-30 transition-all focus:outline-none hover:scale-105 active:scale-95`}
      style={{ ...style }}
      onClick={onClick}
      aria-label="Previous slide"
    >
      <ChevronLeftIcon className="!w-6 !h-6" />
    </button>
  );
}

const HomePage = ({ initialSiteData = null }) => {
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

  const whyUsData = useMemo(() => {
    const items = siteData?.why_us || [];
    return items.filter((item) => (item?.show_live ?? 1) && (item?.status ?? 1));
  }, [siteData]);

  const categoryNavigationItems = useMemo(() => {
    const categories = (siteData?.categories || []).filter(
      (category) => (category?.is_live ?? 1) && (category?.status ?? 1)
    );
    return buildCategoryNavigationItems(categories);
  }, [siteData]);

  const flashBanners = useMemo(() => {
    const banners = siteData?.flash_banners;
    if (!banners) return [];
    const bannerArray = Array.isArray(banners) ? banners : [banners];
    return bannerArray.filter((b) => (b?.show_live ?? 1) && (b?.status ?? 1));
  }, [siteData]);

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

  // Flash banner display logic
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("hasSeenFlashBanner");
      if (!hasSeen && flashBanners.length > 0) {
        setShowFlashBanner(true);
      }
    }
  }, [flashBanners]);

  const handleCloseFlashBanner = () => setShowFlashBanner(false);
  const handleDontShowAnymore = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hasSeenFlashBanner", "1");
    }
    setShowFlashBanner(false);
  };
  const handleFlashBannerClick = (redirectLink) => {
    if (redirectLink) {
      setShowFlashBanner(false);
      window.location.href = redirectLink;
    }
  };

  // Google Maps & Location Logic
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(USER_LOCATION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserLocation(parsed);
        setLocationInput(parsed.address || "");
      } catch (_) {}
    }
  }, []);

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

  const handleDetectLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast({ title: "Geolocation not supported", status: "error", position: "top" });
      return;
    }
    setIsDetectingLocation(true);
    try {
      const position = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const { latitude, longitude } = position.coords;
      let address = "Current location";
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const res = await new Promise((r) =>
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (res, status) => {
            if (status === "OK" && res?.[0]?.formatted_address) r(res[0].formatted_address);
            else r("");
          })
        );
        if (res) address = res;
      }
      persistLocation({ latitude, longitude, address, source: "browser-geolocation" });
      toast({ title: "Location detected", description: address, status: "success", position: "top" });
    } catch (e) {
      toast({ title: "Location detection failed", status: "warning", position: "top" });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleAddToCart = (p) => {
    const hasCuts = Array.isArray(p.cuttypes) && p.cuttypes.length > 0;
    const selectedCutId = selectedCuts[p.id];
    if (hasCuts && !selectedCutId) {
      toast({ title: "Please choose a cut type", status: "warning", position: "top", duration: 2500 });
      return;
    }
    const customerId = typeof window !== "undefined" ? localStorage.getItem("Customer_id") : null;
    if (!customerId) {
      ctx?.handleClick?.();
      return;
    }
    const qty = Number(quantities[p.id] ?? 1);
    const unit = quantityUnits[p.id] ?? getInitialUnit(p);
    if (!qty || qty <= 0) {
      toast({ title: "Quantity must be at least 1", status: "warning", position: "top" });
      return;
    }
    const pricePerUnit = parseFloat(getDisplayPrice(p, unit) || 0);
    const total = parseFloat(pricePerUnit * qty || 0);

    const payload = {
      customer_id: Number(customerId),
      product_id: p.id,
      product_cut_id: selectedCutId ?? null,
      quantity: qty,
      quantity_unit: unit,
      unit: unit,
      price_per_unit: pricePerUnit,
      total: total,
    };
    dispatch(addProductToCart(payload))
      .then(() => {
        toast({ title: "Added to cart", status: "success", duration: 1500, position: "top" });
        refreshCart();
      })
      .catch((err) => {
        toast({
          title: "Failed to add to cart",
          description: err?.response?.data?.message || "Please login first",
          status: "warning",
          position: "top",
        });
      });
  };

  const getSelectedUnitForProduct = (p) => quantityUnits[p.id] ?? getInitialUnit(p);
  const getDisplayPriceForProduct = (p) => getDisplayPrice(p, getSelectedUnitForProduct(p));

  // Slider Configurations
  const heroSettings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: true,
    nextArrow: <HeroNextArrow />,
    prevArrow: <HeroPrevArrow />,
    pauseOnHover: true,
  };

  const productSliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    responsive: [
      {
        breakpoint: 1380,
        settings: { slidesToShow: 3, slidesToScroll: 1 },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2.3, slidesToScroll: 1, arrows: false },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 2.1, slidesToScroll: 1, arrows: false },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1.25, slidesToScroll: 1, arrows: false },
      },
      {
        breakpoint: 440,
        settings: { slidesToShow: 1.15, slidesToScroll: 1, arrows: false },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] pb-24 sm:pb-20">
      {/* Flash Banner Modal */}
      <Modal isOpen={showFlashBanner && flashBanners.length > 0} onClose={handleCloseFlashBanner} isCentered size="xl">
        <ModalOverlay bg="black/70" />
        <ModalContent className="!bg-transparent !shadow-none !border-none max-w-lg p-0">
          <ModalCloseButton className="!bg-white !rounded-full !shadow-md !top-2 !right-2 !z-30 text-gray-700" />
          <ModalBody className="p-0 relative rounded-2xl overflow-hidden bg-white shadow-2xl">
            {flashBanners.map((banner, index) => {
              const imageUrl = banner.image_url || (banner.image ? assetUrl(`storage/${banner.image}`) : "");
              return (
                <div
                  key={banner.id || index}
                  onClick={() => banner.redirect_link && handleFlashBannerClick(banner.redirect_link)}
                  className={banner.redirect_link ? "cursor-pointer" : ""}
                >
                  <img src={imageUrl} alt={banner.name || "Flash Banner"} className="w-full object-cover" />
                </div>
              );
            })}
            <div className="p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleDontShowAnymore}
                className="text-xs text-gray-500 hover:text-gray-700 underline order-2 sm:order-1"
              >
                Don&apos;t show again
              </button>
              <button
                onClick={handleCloseFlashBanner}
                className="w-full sm:w-auto px-6 py-2.5 bg-brand text-white text-sm font-bold rounded-xl hover:bg-brand-600 order-1 sm:order-2"
              >
                Continue
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Hero Banner Carousel - 100% Full Width End-to-End */}
      <section className="w-full relative overflow-hidden bg-white">
        <div className="w-full hero-slider">
          <Slider {...heroSettings}>
            {heroSlides.map((b) => (
              <div key={b.id || b.src} className="outline-none">
                {b.href ? (
                  <a href={b.href} className="block w-full">
                    <img
                      src={b.src}
                      alt="Promotional Banner"
                      className="w-full h-auto aspect-[4000/1133] object-contain sm:object-cover sm:h-[240px] md:h-[300px] lg:h-[360px] xl:h-[420px] 2xl:h-auto 2xl:aspect-[4000/1133] block"
                    />
                  </a>
                ) : (
                  <img
                    src={b.src}
                    alt="Promotional Banner"
                    className="w-full h-auto aspect-[4000/1133] object-contain sm:object-cover sm:h-[240px] md:h-[300px] lg:h-[360px] xl:h-[420px] 2xl:h-auto 2xl:aspect-[4000/1133] block"
                  />
                )}
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* Signature Cold-Chain Trust & Assurance Bar */}
      <TrustBar />

      {/* Shop By Categories - Mobile Swipe Strip & Tablet/Desktop Symmetrical Row */}
      <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-8 lg:px-12 mt-10 sm:mt-18">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-100 pb-3 sm:pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-brand bg-red-50/90 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-100/70 inline-flex items-center gap-1.5 mb-1.5 sm:mb-2">
              <HiSparkles className="w-3.5 h-3.5 text-brand" /> FRESH FROM FARM
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Shop by Categories</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Freshest meats and cuts curated for your kitchen</p>
          </div>
        </div>

        {/* Mobile: Smooth Horizontal Scrollable Categories */}
        <div className="flex sm:hidden overflow-x-auto no-scrollbar gap-2.5 pb-2 -mx-3 px-3 snap-x">
          {categoryNavigationItems.map((item) => (
            <Link
              key={`mob-${item.key}`}
              href={item.href}
              className="w-[102px] flex-shrink-0 snap-start group flex flex-col items-center bg-white rounded-2xl p-3 border border-gray-200/80 hover:border-brand/40 shadow-card-subtle text-center transition-all"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-red-50/50 via-white to-gray-50 flex items-center justify-center p-2 mb-2 border border-gray-100">
                <img
                  src={
                    item.image && /^https?:\/\//i.test(item.image)
                      ? item.image
                      : assetUrl(item.image) || "/images/logo/logo.webp"
                  }
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-black text-gray-800 line-clamp-1">
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Tablet & Desktop: Clean Symmetrical Balanced Grid */}
        <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6">
          {categoryNavigationItems.map((item) => (
            <Link
              key={`desk-${item.key}`}
              href={item.href}
              className="group flex flex-col items-center bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/70 hover:border-brand/40 shadow-card-subtle hover:shadow-premium-hover transition-all duration-300 text-center hover:-translate-y-1"
            >
              <div className="w-20 h-20 sm:w-22 sm:h-22 lg:w-24 lg:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50/50 via-white to-gray-50 flex items-center justify-center p-2.5 mb-3 border border-gray-100 group-hover:border-red-200 transition-all shadow-xs">
                <img
                  src={
                    item.image && /^https?:\/\//i.test(item.image)
                      ? item.image
                      : assetUrl(item.image) || "/images/logo/logo.webp"
                  }
                  alt={item.name}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-gray-800 group-hover:text-brand transition-colors line-clamp-1">
                {item.name}
              </span>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand transition-colors mt-0.5 inline-flex items-center gap-0.5">
                Explore cuts <HiArrowRight className="w-2.5 h-2.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-8 lg:px-12 mt-12 sm:mt-20">
        <div className="mb-4 sm:mb-6 flex items-end justify-between border-b border-gray-100 pb-3 sm:pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-brand bg-red-50/90 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-100/70 inline-flex items-center gap-1.5 mb-1.5 sm:mb-2">
              🔥 POPULAR PICKS
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Best Sellers</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Most loved cuts and kitchen favorites, delivered chilled</p>
          </div>
          {bestSellerProducts.length > 4 && (
            <span className="text-xs font-bold text-brand hover:text-brand-700 hidden sm:inline-flex items-center gap-1 cursor-pointer">
              Swipe for more <HiArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {bestSellerProducts.length > 0 ? (
          <div className="relative px-0 sm:px-4">
            <Slider {...productSliderSettings}>
              {bestSellerProducts.map((p) => (
                <div key={p.id} className="p-1.5 sm:p-3 h-full">
                  <ProductCard
                    product={p}
                    selectedCut={selectedCuts[p.id]}
                    onSelectCut={(cutId) => setSelectedCuts((prev) => ({ ...prev, [p.id]: cutId }))}
                    quantity={quantities[p.id]}
                    onChangeQuantity={(val) => setQuantities((prev) => ({ ...prev, [p.id]: val }))}
                    selectedUnit={getSelectedUnitForProduct(p)}
                    onChangeUnit={(unit) => setQuantityUnits((prev) => ({ ...prev, [p.id]: unit }))}
                    displayPrice={getDisplayPriceForProduct(p)}
                    unitText={getUnitText(getSelectedUnitForProduct(p))}
                    allowedUnits={getAllowedUnits(p)}
                    onAddToCart={() => handleAddToCart(p)}
                    assetUrl={assetUrl}
                  />
                </div>
              ))}
            </Slider>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center text-gray-500 border border-gray-100 shadow-card-subtle">
            No best seller products available right now.
          </div>
        )}
      </section>

      {/* Explore All Products Section */}
      <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-8 lg:px-12 mt-12 sm:mt-22">
        <div className="mb-4 sm:mb-6 flex items-end justify-between border-b border-gray-100 pb-3 sm:pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-brand bg-red-50/90 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-100/70 inline-flex items-center gap-1.5 mb-1.5 sm:mb-2">
              🥩 MASTER BUTCHERY
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Explore All Products</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Wide selection of farm-fresh poultry, meats & seafood</p>
          </div>
        </div>

        {allCategoryProducts.length > 0 ? (
          <div className="relative px-0 sm:px-4">
            <Slider {...productSliderSettings}>
              {allCategoryProducts.map((p) => (
                <div key={`all-prod-${p.id}`} className="p-1.5 sm:p-3 h-full">
                  <ProductCard
                    product={p}
                    selectedCut={selectedCuts[p.id]}
                    onSelectCut={(cutId) => setSelectedCuts((prev) => ({ ...prev, [p.id]: cutId }))}
                    quantity={quantities[p.id]}
                    onChangeQuantity={(val) => setQuantities((prev) => ({ ...prev, [p.id]: val }))}
                    selectedUnit={getSelectedUnitForProduct(p)}
                    onChangeUnit={(unit) => setQuantityUnits((prev) => ({ ...prev, [p.id]: unit }))}
                    displayPrice={getDisplayPriceForProduct(p)}
                    unitText={getUnitText(getSelectedUnitForProduct(p))}
                    allowedUnits={getAllowedUnits(p)}
                    onAddToCart={() => handleAddToCart(p)}
                    assetUrl={assetUrl}
                  />
                </div>
              ))}
            </Slider>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center text-gray-500 border border-gray-100 shadow-card-subtle">
            No products available at the moment.
          </div>
        )}
      </section>

      {/* Why Choose Us Section */}
      {whyUsData.length > 0 && (
        <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-8 lg:px-12 mt-12 sm:mt-24">
          <div className="mb-4 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">
            <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-brand bg-red-50/90 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-100/70 inline-flex items-center gap-1.5 mb-1.5 sm:mb-2">
              🛡️ QUALITY STANDARDS
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Why Choose Us</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Our uncompromising standard for quality, safety, and cold-chain freshness</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {whyUsData.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200/80 hover:border-brand/30 rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center shadow-card-subtle hover:shadow-premium-hover transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-3 sm:mb-4 bg-gradient-to-br from-red-50/60 to-white flex items-center justify-center p-2.5 sm:p-3.5 border border-red-100/60 shadow-xs group-hover:scale-105 transition-transform">
                  <img src={assetUrl(item.image)} alt={item.title} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-extrabold text-xs sm:text-base text-gray-900 group-hover:text-brand transition-colors">{item.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* In the News Section */}
      <News />
    </div>
  );
};

export default HomePage;
