'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Center,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useSiteData } from '../Context/SiteDataContext';
import CheckoutPage from '../Checkout/CheckoutPage';
import api from '../../utils/api';
import { clearStoredCart, isComboCartItem, readStoredCart, writeStoredCart } from '../../utils/cartStorage';
import { getCartLineTotal, getCartUnitPrice, resolveCartProduct } from '../../utils/productUnits';

const TIME_SLOTS = [
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
];

function parseTimeToMinutes(value) {
  const [timePart, meridiem] = value.trim().split(' ');
  const [hoursString, minutesString] = timePart.split(':');
  let hours = parseInt(hoursString, 10);
  const minutes = parseInt(minutesString, 10);

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function getAutoSelectedTimeSlot(slots, now = new Date()) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of slots) {
    const [, endLabel] = slot.split(' - ');
    const endMinutes = parseTimeToMinutes(endLabel);

    if (currentMinutes < endMinutes) {
      return slot;
    }
  }

  return slots[slots.length - 1] || '';
}

const PAYMENT_OPTIONS = [
  {
    value: 'Cash on Delivery',
    title: 'Cash on Delivery',
    description: 'Pay when your order reaches your doorstep.',
  },
  {
    value: 'Wallet',
    title: 'Wallet',
    description: 'Use your wallet balance for instant checkout.',
  },
  {
    value: 'Razorpay',
    title: 'Razorpay',
    description: 'Cards, netbanking and secure online payments.',
  },
  {
    value: 'PhonePe UPI',
    title: 'PhonePe UPI',
    description: 'Complete the payment through your preferred UPI app.',
  },
];

const EMPTY_ADDRESS_FORM = {
  address: '',
  city: '',
  state: '',
  pincode: '',
  address_type: 1,
  is_default: false,
};

function getAddressTypeLabel(type) {
  switch (parseInt(type, 10)) {
    case 1:
      return 'Home';
    case 2:
      return 'Work';
    case 3:
      return 'Other';
    default:
      return 'Home';
  }
}

function normalizeAddress(address) {
  if (!address) return null;

  const fullAddress =
    address.full_address ||
    [address.address_line1, address.address_line2, address.city, address.state, address.zip_code, address.country]
      .filter(Boolean)
      .join(', ');

  return {
    ...address,
    full_address: fullAddress,
    address_type_label: address.address_type_label || getAddressTypeLabel(address.address_type),
  };
}

function getPaymentCode(method) {
  switch (method) {
    case 'Cash on Delivery':
      return 'cod';
    case 'Wallet':
      return 'wallet';
    case 'Razorpay':
      return 'razorpay';
    case 'PhonePe UPI':
      return 'phonepe_upi';
    default:
      return method.toLowerCase().replace(/\s+/g, '_');
  }
}

function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

const NewCheckout = () => {
  const router = useRouter();
  const toast = useToast();
  const { siteData } = useSiteData();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderUuid, setOrderUuid] = useState(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(null);
  const [useBillingAsDelivery, setUseBillingAsDelivery] = useState(true);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [liveCurrentLocation, setLiveCurrentLocation] = useState({ lat: null, lng: null });
  const [currentLocationAddress, setCurrentLocationAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState(null);
  const [showDeliveryBanner, setShowDeliveryBanner] = useState(false);
  const [isDeliveryTimeLoading, setIsDeliveryTimeLoading] = useState(false);

  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressEditor, setAddressEditor] = useState({
    mode: 'create',
    addressId: null,
    data: EMPTY_ADDRESS_FORM,
  });

  const productIndex = useMemo(() => {
    const index = new Map();
    const categories = siteData?.categories || [];
    categories.forEach((category) => {
      (category.products || []).forEach((product) => index.set(product.id, product));
    });
    return index;
  }, [siteData]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + getCartLineTotal(item, productIndex),
        0
      ),
    [cartItems, productIndex]
  );
  const taxAmount = useMemo(() => subtotal * 0.18, [subtotal]);
  const total = useMemo(() => subtotal - discount + taxAmount, [subtotal, discount, taxAmount]);
  const activeAddress = useCurrentLocation
    ? { id: 'current-location' }
    : useBillingAsDelivery
    ? selectedBillingAddress
    : selectedDeliveryAddress;
  const hasCurrentLocationCoordinates =
    liveCurrentLocation.lat != null && liveCurrentLocation.lng != null;
  const isPlaceOrderDisabled =
    cartItems.length === 0 || (!useCurrentLocation && !activeAddress) || (useCurrentLocation && !hasCurrentLocationCoordinates) || !selectedPayment;
  const currentLocationLabel = (() => {
    if (currentLocationAddress) {
      return currentLocationAddress;
    }

    return 'Enable to use your live location.';
  })();

  const syncAddressesToStorage = (addresses) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('User_addresses', JSON.stringify(addresses));
  };

  function getAddressCoordinates(address) {
    if (!address) return { lat: null, lng: null };

    return {
      lat:
        address.latitude ??
        address.lat ??
        address.address_latitude ??
        address.addressLat ??
        null,
      lng:
        address.longitude ??
        address.lng ??
        address.address_longitude ??
        address.addressLng ??
        null,
    };
  }

  function getSessionCoordinates() {
    if (typeof window === 'undefined') return { lat: null, lng: null };

    const storedLat = sessionStorage.getItem('session-latitude');
    const storedLng = sessionStorage.getItem('session-longitude');

    if (storedLat != null && storedLng != null) {
      return { lat: storedLat, lng: storedLng };
    }

    const storedLocation = sessionStorage.getItem('userLocation');
    if (!storedLocation) {
      return { lat: null, lng: null };
    }

    try {
      const parsedLocation = JSON.parse(storedLocation);
      return {
        lat: parsedLocation?.latitude ?? null,
        lng: parsedLocation?.longitude ?? null,
      };
    } catch (error) {
      console.warn('[Checkout][NewCheckout] unable to parse userLocation from sessionStorage', error);
      return { lat: null, lng: null };
    }
  }

  function getStoredLocationAddress() {
    if (typeof window === 'undefined') return '';

    const storedLocation = sessionStorage.getItem('userLocation');
    if (!storedLocation) return '';

    try {
      const parsedLocation = JSON.parse(storedLocation);
      return parsedLocation?.address ?? '';
    } catch (error) {
      return '';
    }
  }

  function reverseGeocodeCoordinates(latitude, longitude) {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.google?.maps?.Geocoder) {
        resolve('');
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        {
          location: {
            lat: Number(latitude),
            lng: Number(longitude),
          },
        },
        (results, status) => {
          if (status === 'OK' && results?.[0]?.formatted_address) {
            resolve(results[0].formatted_address);
            return;
          }

          resolve('');
        }
      );
    });
  }

  const fetchNearbyVendorsForAddress = useCallback(async (latitude, longitude) => {
    setIsDeliveryTimeLoading(true);

    try {
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || 'customer';
      const endpoint = `/api/v1/${apiType}/nearby-vendors`;
      const payload = { latitude, longitude };

      console.log('[Checkout][NewCheckout] nearby-vendors API request starting', {
        method: 'POST',
        endpoint,
        payload,
      });

      const response = await api.post(endpoint, payload);

      console.log('[Checkout][NewCheckout] nearby-vendors API response received', {
        method: 'POST',
        endpoint,
        payload,
        response: response.data,
      });

      const nearestVendor =
        response.data?.data?.nearest_vendor ||
        response.data?.nearest_vendor ||
        response.data?.data?.[0]?.nearest_vendor ||
        null;
      const hasGoogleEstimate = Boolean(nearestVendor?.has_google_estimate);
      const etaMinutes = nearestVendor?.eta_minutes;
      const numericEta = Number(etaMinutes);

      if (hasGoogleEstimate && Number.isFinite(numericEta)) {
        setDeliveryTime(String(Math.ceil(numericEta) + 1));
        setShowDeliveryBanner(true);
      } else {
        setDeliveryTime(null);
        setShowDeliveryBanner(false);
      }
    } catch (error) {
      console.error('Error calling nearby-vendors API:', error);
      console.error('[Checkout][NewCheckout] nearby-vendors API request failed', {
        method: 'POST',
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setDeliveryTime(null);
      setShowDeliveryBanner(false);
    } finally {
      setIsDeliveryTimeLoading(false);
    }
  }, []);

  const loadSavedAddresses = () => {
    if (typeof window === 'undefined') return;

    const raw = localStorage.getItem('User_addresses');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw).map(normalizeAddress);
      setSavedAddresses(parsed);

      const defaultAddress = parsed.find((address) => address.is_default === 1 || address.is_default === true);
      const fallbackAddress = defaultAddress || parsed[0] || null;
      setSelectedBillingAddress(fallbackAddress);
      setSelectedDeliveryAddress(fallbackAddress);
    } catch (error) {
      console.error('Error parsing stored addresses:', error);
    }
  };

  const fetchCartFromAPI = useCallback(async () => {
    try {
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || 'customer';
      const res = await api.get(`/api/v1/${apiType}/cart`);
      const payload = res.data;
      const items = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      setCartItems(items);
      writeStoredCart(items);
    } catch (error) {
      console.error('Error fetching cart from API:', error);
      toast({
        title: 'Error loading cart',
        description: 'Could not load cart data.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setSelectedTimeSlot(getAutoSelectedTimeSlot(TIME_SLOTS));
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const sessionCoordinates = getSessionCoordinates();
    const storedAddress = getStoredLocationAddress();

    if (sessionCoordinates.lat != null && sessionCoordinates.lng != null) {
      setLiveCurrentLocation({
        lat: sessionCoordinates.lat,
        lng: sessionCoordinates.lng,
      });
    }

    if (storedAddress) {
      setCurrentLocationAddress(storedAddress);
    }
  }, [hasMounted]);

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  useEffect(() => {
    if (useBillingAsDelivery) {
      setSelectedDeliveryAddress(selectedBillingAddress);
    }
  }, [selectedBillingAddress, useBillingAsDelivery]);

  useEffect(() => {
    const storedCart = readStoredCart();
    if (storedCart.length > 0) {
      setCartItems(storedCart);
      setLoading(false);
      return;
    }

    fetchCartFromAPI();
  }, [fetchCartFromAPI]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const removeItem = async (id) => {
    const item = cartItems.find((entry) => entry.id === id);
    if (item && isComboCartItem(item)) {
      return;
    }

    try {
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || 'customer';
      await api.delete(`/api/v1/${apiType}/cart/${id}`);
      const updatedItems = cartItems.filter((item) => item.id !== id);
      setCartItems(updatedItems);
      writeStoredCart(updatedItems);
      toast({
        title: 'Item removed',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error removing item',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const apiType = process.env.NEXT_PUBLIC_API_TYPE || 'customer';
      const res = await api.post(`/api/v1/${apiType}/coupon/validate`, { code: couponCode });

      if (res.data.data && res.data.data.discount) {
        const { discount: couponDiscount } = res.data.data;
        let discountAmount = 0;

        if (parseInt(couponDiscount.type, 10) === 1) {
          discountAmount = Math.min(
            (subtotal * parseFloat(couponDiscount.value)) / 100,
            parseFloat(couponDiscount.max_discount) || Infinity
          );
        } else if (parseInt(couponDiscount.type, 10) === 2) {
          discountAmount = Math.min(
            parseFloat(couponDiscount.value),
            parseFloat(couponDiscount.max_discount) || parseFloat(couponDiscount.value)
          );
        }

        setDiscount(discountAmount);
        toast({
          title: 'Coupon applied',
          description: `Discount: Rs ${discountAmount.toFixed(2)}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      throw new Error(res.data.message || 'Invalid coupon response');
    } catch (error) {
      let errorMessage = 'Invalid coupon code';

      if (error.response?.status === 401) {
        errorMessage = 'Please login to apply coupon.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setDiscount(0);
      setCouponCode('');
      toast({
        title: 'Coupon Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const selectAddress = async (address) => {
    console.log('[Checkout][NewCheckout] selectAddress called', address);
    setUseCurrentLocation(false);
    setSelectedBillingAddress(address);
    setSelectedDeliveryAddress(address);

    if (typeof window === 'undefined' || !address) return;

    const addressCoordinates = getAddressCoordinates(address);
    const sessionCoordinates = getSessionCoordinates();
    const lat = addressCoordinates.lat ?? sessionCoordinates.lat;
    const lng = addressCoordinates.lng ?? sessionCoordinates.lng;

    console.log('[Checkout][NewCheckout] extracted address coordinates', {
      id: address.id,
      addressLat: addressCoordinates.lat,
      addressLng: addressCoordinates.lng,
      sessionLat: sessionCoordinates.lat,
      sessionLng: sessionCoordinates.lng,
      finalLat: lat,
      finalLng: lng,
    });

    if (lat == null || lng == null) {
      console.warn('Selected address has no coordinates for nearby-vendors lookup:', address);
      console.warn('[Checkout][NewCheckout] no session fallback coordinates available either');
      setDeliveryTime(null);
      setShowDeliveryBanner(false);
      return;
    }

    sessionStorage.setItem('session-latitude', String(lat));
    sessionStorage.setItem('session-longitude', String(lng));
    sessionStorage.setItem(
      'userLocation',
      JSON.stringify({
        address: address.full_address || address.address || '',
        latitude: String(lat),
        longitude: String(lng),
        source: 'checkout-selection',
        timestamp: new Date().toISOString(),
      })
    );

    console.log('[Checkout][NewCheckout] session location stored, calling nearby-vendors', {
      source: addressCoordinates.lat != null && addressCoordinates.lng != null ? 'address' : 'session-fallback',
      latitude: String(lat),
      longitude: String(lng),
    });

    await fetchNearbyVendorsForAddress(lat, lng);
  };

  const toggleUseCurrentLocation = async (enabled) => {
    if (!enabled) {
      setUseCurrentLocation(false);
      if (selectedBillingAddress) {
        await selectAddress(selectedBillingAddress);
      }
      return;
    }

    try {
      const liveCoordinates = await getGeolocation();
      const resolvedAddress = (await reverseGeocodeCoordinates(liveCoordinates.lat, liveCoordinates.lng)) || 'Current location';
      const normalizedCoordinates = {
        lat: String(liveCoordinates.lat),
        lng: String(liveCoordinates.lng),
      };

      setLiveCurrentLocation(normalizedCoordinates);
      setCurrentLocationAddress(resolvedAddress);
      setUseCurrentLocation(true);
      sessionStorage.setItem('session-latitude', normalizedCoordinates.lat);
      sessionStorage.setItem('session-longitude', normalizedCoordinates.lng);
      sessionStorage.setItem(
        'userLocation',
        JSON.stringify({
          address: resolvedAddress,
          latitude: normalizedCoordinates.lat,
          longitude: normalizedCoordinates.lng,
          source: 'checkout-live-location',
          timestamp: new Date().toISOString(),
        })
      );

      await fetchNearbyVendorsForAddress(normalizedCoordinates.lat, normalizedCoordinates.lng);
    } catch (error) {
      setUseCurrentLocation(false);
      toast({
        title: 'Current location unavailable',
        description: error.message || 'Allow location access to use your live location.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const startCreateAddress = () => {
    setAddressEditor({
      mode: 'create',
      addressId: null,
      data: EMPTY_ADDRESS_FORM,
    });
    setIsAddressFormOpen(true);
  };

  const startEditingAddress = (addressId) => {
    const address = savedAddresses.find((item) => item.id === addressId);
    if (!address) return;

    setAddressEditor({
      mode: 'edit',
      addressId,
      data: {
        address:
          address.full_address?.replace(/,\s*India$/i, '') ||
          [address.address_line1, address.address_line2].filter(Boolean).join(', '),
        city: address.city || '',
        state: address.state || '',
        pincode: address.zip_code || '',
        address_type: address.address_type || 1,
        is_default: address.is_default === 1 || address.is_default === true,
      },
    });
    setIsAddressFormOpen(true);
  };

  const closeAddressEditor = () => {
    setIsAddressFormOpen(false);
    setSavingAddress(false);
    setAddressEditor({
      mode: 'create',
      addressId: null,
      data: EMPTY_ADDRESS_FORM,
    });
  };

  const handleAddressFormChange = (field, value) => {
    setAddressEditor((current) => ({
      ...current,
      data: {
        ...current.data,
        [field]: value,
      },
    }));
  };

  const validateAddressForm = (data) =>
    data.address.trim() && data.city.trim() && data.state.trim() && data.pincode.trim();

  const saveAddress = async () => {
    const formData = addressEditor.data;
    if (!validateAddressForm(formData)) {
      toast({
        title: 'Incomplete address',
        description: 'Please fill address, city, state and pincode.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const customerId = typeof window !== 'undefined' ? localStorage.getItem('Customer_id') : null;
    if (!customerId) {
      toast({
        title: 'Login required',
        description: 'Customer ID not found. Please login again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSavingAddress(true);

    try {
      let coordinates = { lat: null, lng: null };
      try {
        coordinates = await getGeolocation();
      } catch (geoError) {
        console.warn('Could not get geolocation:', geoError.message);
      }

      const payload = {
        customer_id: parseInt(customerId, 10),
        address_line1: formData.address.split(',')[0]?.trim() || formData.address,
        address_line2: formData.address.includes(',')
          ? formData.address.split(',').slice(1).join(',').trim()
          : '',
        city: formData.city,
        state: formData.state,
        zip_code: formData.pincode,
        country: 'India',
        address_type: formData.address_type || 1,
        is_default: formData.is_default || false,
        status: 1,
        lat: coordinates.lat,
        lng: coordinates.lng,
        google_places_data: null,
      };

      if (payload.is_default) {
        const currentDefaultAddresses = savedAddresses.filter(
          (address) =>
            address.id !== addressEditor.addressId && (address.is_default === 1 || address.is_default === true)
        );

        await Promise.all(
          currentDefaultAddresses.map((address) =>
            api.patch(`/api/v1/customer/address/${address.id}`, {
              customer_id: parseInt(customerId, 10),
              is_default: false,
            })
          )
        );
      }

      let updatedAddresses;

      if (addressEditor.mode === 'edit' && addressEditor.addressId) {
        await api.patch(`/api/v1/customer/address/${addressEditor.addressId}`, payload);

        updatedAddresses = savedAddresses.map((address) => {
          if (address.id !== addressEditor.addressId) {
            return payload.is_default ? { ...address, is_default: false } : address;
          }

          return normalizeAddress({
            ...address,
            ...payload,
            id: address.id,
            full_address: `${payload.address_line1}${payload.address_line2 ? `, ${payload.address_line2}` : ''}, ${payload.city}, ${payload.state}, ${payload.zip_code}, ${payload.country}`,
          });
        });
      } else {
        const response = await api.post('/api/v1/customer/address', payload);
        const newAddressId =
          response.data?.address?.id ||
          response.data?.data?.address?.id ||
          response.data?.data?.id ||
          Date.now();

        const newAddress = normalizeAddress({
          id: newAddressId,
          customer_id: parseInt(customerId, 10),
          ...payload,
          full_address: `${payload.address_line1}${payload.address_line2 ? `, ${payload.address_line2}` : ''}, ${payload.city}, ${payload.state}, ${payload.zip_code}, ${payload.country}`,
        });

        updatedAddresses = [
          ...savedAddresses.map((address) => (payload.is_default ? { ...address, is_default: false } : address)),
          newAddress,
        ];
      }

      setSavedAddresses(updatedAddresses);
      syncAddressesToStorage(updatedAddresses);

      const selectedAddressId = addressEditor.mode === 'edit' ? addressEditor.addressId : updatedAddresses.at(-1)?.id;
      const latestSelected =
        updatedAddresses.find((address) => address.id === selectedAddressId) || updatedAddresses[0] || null;
      if (latestSelected) {
        selectAddress(latestSelected);
      }

      closeAddressEditor();
      toast({
        title: addressEditor.mode === 'edit' ? 'Address updated' : 'Address added',
        description: 'Your saved addresses have been updated.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: addressEditor.mode === 'edit' ? 'Update failed' : 'Creation failed',
        description: error.response?.data?.message || 'Failed to save address.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setSavingAddress(false);
    }
  };

  const clearCheckoutState = () => {
    setCartItems([]);
    clearStoredCart();
    setDiscount(0);
    setCouponCode('');
    setSpecialInstructions('');
  };

  const handlePayment = async (method) => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add products to your cart before placing the order.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!useCurrentLocation && !activeAddress) {
      toast({
        title: 'Address required',
        description: 'Please select a delivery address.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const apiType = process.env.NEXT_PUBLIC_API_TYPE || 'customer';
    const paymentCode = getPaymentCode(method);
    const selectedAddressForOrder = useBillingAsDelivery ? selectedBillingAddress : selectedDeliveryAddress;
    const selectedAddressCoordinates = getAddressCoordinates(selectedAddressForOrder);
    const deliveryCoordinates = useCurrentLocation
      ? liveCurrentLocation
      : {
          lat: selectedAddressCoordinates.lat ?? liveCurrentLocation.lat,
          lng: selectedAddressCoordinates.lng ?? liveCurrentLocation.lng,
        };

    const orderPayload = {
      items: cartItems.map((item) => {
        const product = resolveCartProduct(item, productIndex);
        const cutId = item.cuttype_id || item.product_cut_id || item.cut_id || item.productCutId || 1;
        const unitPrice = getCartUnitPrice(item, productIndex);
        const totalPrice = getCartLineTotal(item, productIndex);

        return {
          product_id: item.product_id,
          category_id: item.category_id || 1,
          cut_id: cutId,
          product_name: item.product?.name || `Product ${item.product_id}`,
          cut_name: item.cut_name || 'Standard',
          unit_price: unitPrice,
          quantity: parseFloat(item.quantity || 1),
          weight: parseFloat(item.weight || item.quantity || 1),
          weight_unit: item.unit || item.quantity_unit || item.weight_unit || 'kg',
          total_price: totalPrice,
          special_instructions: item.special_instructions || '',
          grams_per_piece: product?.grams_per_piece ?? null,
        };
      }),
      billing_address_id: selectedBillingAddress?.id || null,
      delivery_address_id: useCurrentLocation ? null : selectedAddressForOrder?.id || null,
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_time_slot: selectedTimeSlot,
      special_instructions: specialInstructions.trim(),
      coupon_code: couponCode || null,
      billing_type_id: 1,
      payment_method: paymentCode,
      provider: paymentCode,
      lat: deliveryCoordinates.lat != null ? String(deliveryCoordinates.lat) : null,
      lng: deliveryCoordinates.lng != null ? String(deliveryCoordinates.lng) : null,
      customer_location:
        deliveryCoordinates.lat != null && deliveryCoordinates.lng != null
          ? {
              lat: Number(deliveryCoordinates.lat),
              lng: Number(deliveryCoordinates.lng),
            }
          : null,
    };

    try {
      if (method === 'Cash on Delivery') {
        const response = await api.post(`/api/v1/${apiType}/order`, orderPayload);

        if (cartItems.length > 0) {
          await Promise.allSettled(cartItems.map((item) => api.delete(`/api/v1/${apiType}/cart/${item.id}`)));
        }

        clearCheckoutState();
        setOrderSuccess(true);
        setOrderUuid(response.data?.data?.order?.uuid);
        setOrderId(response.data?.data?.order?.order_number);
        return;
      }

      if (method === 'Razorpay') {
        const razorpayOrderResponse = await axios.post('/api/create-razorpay-order', {
          amount: total,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
        });

        if (!razorpayOrderResponse.data.success) {
          throw new Error(razorpayOrderResponse.data.error);
        }

        const razorpayOrder = razorpayOrderResponse.data.order;
        const orderPayloadWithRazorpay = {
          ...orderPayload,
          razorpay_order_id: razorpayOrder.id,
          payment_status: 'pending',
        };

        const response = await api.post(`/api/v1/${apiType}/order`, orderPayloadWithRazorpay);
        const orderData = response.data?.data?.order;
        if (!orderData) {
          throw new Error('Invalid order response');
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'YuMeat',
          description: 'Order Payment',
          order_id: razorpayOrder.id,
          handler: async function (paymentResponse) {
            try {
              await api.post(`/api/v1/${apiType}/payment/verify`, {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                order_uuid: orderData.uuid,
              });

              if (cartItems.length > 0) {
                await Promise.allSettled(cartItems.map((item) => api.delete(`/api/v1/${apiType}/cart/${item.id}`)));
              }

              clearCheckoutState();
              setOrderSuccess(true);
              setOrderUuid(orderData.uuid);
              setOrderId(orderData.order_number);
              toast({
                title: 'Payment successful',
                description: 'Your order has been placed successfully.',
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
            } catch (verifyError) {
              console.error('Payment verification failed:', verifyError);
              toast({
                title: 'Payment verification failed',
                description: 'Please contact support if the amount was debited.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          },
          theme: {
            color: '#d11243',
          },
          modal: {
            ondismiss: function () {
              toast({
                title: 'Payment cancelled',
                description: 'You cancelled the payment process.',
                status: 'warning',
                duration: 3000,
                isClosable: true,
              });
            },
          },
        };

      
      
 console.log("========== Razorpay Debug ==========");
console.log("Key:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
console.log("Order:", razorpayOrder);
console.log("Options:", options);
console.log("====================================");

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        return;
      }

      toast({
        title: `${method} integration`,
        description: 'Payment gateway integration coming soon. Use Cash on Delivery for now.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat()[0]
        : error.response?.data?.message || error.message;

      toast({
        title: 'Order Creation failed',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!hasMounted || loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box bg="white">
      <Box bg="white" minH="calc(100vh - 150px)" py={{ base: 6, md: 10 }}>
      <Box maxW="1320px" mx="auto" px={{ base: 4, md: 6 }}>
        <VStack align="stretch" spacing={2} mb={{ base: 6, md: 8 }}>
          <Text
            fontSize="sm"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="#d11243"
          >
            Checkout
          </Text>
          <Heading size="lg" color="gray.800">
            Review your order and complete payment
          </Heading>
          <Text color="gray.600">
            Confirm your cart, delivery address, and payment method before placing the order.
          </Text>
        </VStack>
        {orderSuccess ? (
          <VStack spacing={8} textAlign="center" py={12}>
            <CheckCircleIcon w={16} h={16} color="green.500" />
            <VStack spacing={3}>
              <Heading size="lg" color="green.600">
                Order placed successfully
              </Heading>
              <Text color="gray.600">Your order has been confirmed.</Text>
              {orderId ? <Text color="gray.500">Order ID: {orderId}</Text> : null}
            </VStack>
            <Button colorScheme="red" size="lg" onClick={() => router.push('/')}>
              Continue Shopping
            </Button>
          </VStack>
        ) : cartItems.length === 0 ? (
          <VStack spacing={6} textAlign="center" py={12}>
            <Heading size="lg" color="gray.700">
              Your cart is empty
            </Heading>
            <Text color="gray.500">Add a few items before proceeding to checkout.</Text>
            <Button colorScheme="red" size="lg" onClick={() => router.push('/')}>
              Go to Dashboard
            </Button>
          </VStack>
        ) : (
          <CheckoutPage
            cartItems={cartItems}
            productIndex={productIndex}
            onRemoveItem={removeItem}
            timeSlots={TIME_SLOTS}
            selectedTimeSlot={selectedTimeSlot}
            onTimeSlotSelect={setSelectedTimeSlot}
            savedAddresses={savedAddresses}
            selectedAddressId={activeAddress?.id || null}
            onSelectAddress={selectAddress}
            onEditAddress={startEditingAddress}
            useBillingAsDelivery={useBillingAsDelivery}
            onToggleUseBillingAsDelivery={setUseBillingAsDelivery}
            onOpenAddAddress={startCreateAddress}
            useCurrentLocation={useCurrentLocation}
            onToggleUseCurrentLocation={toggleUseCurrentLocation}
            currentLocationLabel={currentLocationLabel}
            specialInstructions={specialInstructions}
            onSpecialInstructionsChange={setSpecialInstructions}
            summary={{
              subtotal,
              discount,
              taxAmount,
              total,
            }}
            couponCode={couponCode}
            onCouponChange={setCouponCode}
            onApplyCoupon={applyCoupon}
            paymentOptions={PAYMENT_OPTIONS}
            selectedPaymentMethod={selectedPayment}
            onSelectPaymentMethod={setSelectedPayment}
            onPlaceOrder={() => handlePayment(selectedPayment)}
            isPlaceOrderDisabled={isPlaceOrderDisabled}
            deliveryTime={deliveryTime}
            isDeliveryTimeLoading={isDeliveryTimeLoading}
            showDeliveryBanner={showDeliveryBanner}
          />
        )}
      </Box>
      </Box>

      <Modal isOpen={isAddressFormOpen} onClose={closeAddressEditor} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(6px)" />
        <ModalContent borderRadius="20px" overflow="hidden">
          <ModalBody p={0}>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <Heading size="md">{addressEditor.mode === 'edit' ? 'Edit Address' : 'Add Address'}</Heading>
                <Text color="gray.500" mt={2}>
                  Keep your delivery details updated for faster checkout.
                </Text>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                <label>
                  <Text fontSize="sm" mb={2}>
                    Address
                  </Text>
                  <textarea
                    value={addressEditor.data.address}
                    onChange={(event) => handleAddressFormChange('address', event.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      resize: 'vertical',
                    }}
                  />
                </label>

                <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <label>
                    <Text fontSize="sm" mb={2}>
                      City
                    </Text>
                    <input
                      value={addressEditor.data.city}
                      onChange={(event) => handleAddressFormChange('city', event.target.value)}
                      style={{
                        width: '100%',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px 14px',
                      }}
                    />
                  </label>
                  <label>
                    <Text fontSize="sm" mb={2}>
                      State
                    </Text>
                    <input
                      value={addressEditor.data.state}
                      onChange={(event) => handleAddressFormChange('state', event.target.value)}
                      style={{
                        width: '100%',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px 14px',
                      }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <label>
                    <Text fontSize="sm" mb={2}>
                      Pincode
                    </Text>
                    <input
                      value={addressEditor.data.pincode}
                      onChange={(event) => handleAddressFormChange('pincode', event.target.value)}
                      style={{
                        width: '100%',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px 14px',
                      }}
                    />
                  </label>
                  <label>
                    <Text fontSize="sm" mb={2}>
                      Address Type
                    </Text>
                    <select
                      value={addressEditor.data.address_type}
                      onChange={(event) => handleAddressFormChange('address_type', parseInt(event.target.value, 10))}
                      style={{
                        width: '100%',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        background: '#fff',
                      }}
                    >
                      <option value={1}>Home</option>
                      <option value={2}>Work</option>
                      <option value={3}>Other</option>
                    </select>
                  </label>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={addressEditor.data.is_default}
                    onChange={(event) => handleAddressFormChange('is_default', event.target.checked)}
                  />
                  Set as default address
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <Button variant="outline" onClick={closeAddressEditor}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={saveAddress} isLoading={savingAddress}>
                  {addressEditor.mode === 'edit' ? 'Save Changes' : 'Save Address'}
                </Button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={orderSuccess && Boolean(orderUuid)} onClose={() => setOrderSuccess(false)} size="lg" isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalBody p={0}>
            <VStack spacing={6} py={12} px={8} textAlign="center">
              <CheckCircleIcon w={16} h={16} color="green.500" />
              <VStack spacing={2}>
                <Heading size="lg" color="green.600">
                  Order placed successfully
                </Heading>
                <Text color="gray.600">Your order has been confirmed.</Text>
                <Text color="gray.500">Order ID: {orderId}</Text>
              </VStack>
              <VStack spacing={3} w="full">
                <Button colorScheme="red" size="lg" w="full" onClick={() => router.push('/')}>
                  Continue Shopping
                </Button>
                <Button variant="outline" size="lg" w="full" onClick={() => router.push(`/order/${orderUuid}`)}>
                  View Order Details
                </Button>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NewCheckout;
