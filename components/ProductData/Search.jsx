'use client';

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { HiOutlineSearch, HiX } from "react-icons/hi";
import { buildProductRoutePath } from "../../utils/seo";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";
  const API_TYPE = process.env.NEXT_PUBLIC_API_TYPE || "customer";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      setShowResults(true);

      try {
        const sep = BASE_URL.endsWith("/") ? "" : "/";
        const url = `${BASE_URL}${sep}api/v1/${API_TYPE}/category`;

        const res = await axios.post(url, {
          category_name: searchQuery,
        });

        if (res.data?.success && res.data?.data) {
          let products = [];
          const categoryData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];

          categoryData.forEach((category) => {
            if (category.products && Array.isArray(category.products)) {
              products = [...products, ...category.products];
            }
          });

          const filteredProducts = products.filter((product) =>
            product.name?.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setSearchResults(filteredProducts.slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, BASE_URL, API_TYPE]);

  const handleProductClick = (product) => {
    router.push(buildProductRoutePath(product));
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <div className="w-full relative" ref={searchRef}>
      <div className="relative flex items-center">
        <HiOutlineSearch className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          placeholder="Search for fresh chicken, mutton, fish & cuts..."
          className="w-full h-11 pl-10 pr-9 text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-400 bg-gray-50/90 hover:bg-white focus:bg-white border border-gray-200/90 focus:border-brand rounded-xl shadow-xs focus:ring-2 focus:ring-brand/10 transition-all outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Clear search"
          >
            <HiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-premium-hover border border-gray-100 max-h-96 overflow-y-auto z-50 p-2 divide-y divide-gray-50">
          {loading ? (
            <div className="py-8 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium">Searching fresh cuts...</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-red-50/40 cursor-pointer transition-colors group"
              >
                <img
                  src={product.primary_image_url || "/images/logo/logo.webp"}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.src = "/images/logo/logo.webp";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-brand transition-colors truncate">
                    {product.name}
                  </p>
                  {product.price && (
                    <p className="text-xs font-black text-brand mt-0.5">
                      ₹{parseFloat(product.price).toFixed(2)}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </div>
            ))
          ) : searchQuery ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm font-bold text-gray-700">No matching cuts found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for &quot;Chicken&quot;, &quot;Mutton&quot;, or &quot;Fish&quot;
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Search;
