'use client';

import React, { useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { HiOutlineMail, HiOutlineCheckCircle } from "react-icons/hi";
import { useSiteData } from "../Context/SiteDataContext";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/" },
  { label: "About", href: "/profile" },
  { label: "Contact", href: "/raise-query" },
];

const supportLinks = [
  { label: "Shipping Policy", href: "/orders" },
  { label: "Refund Policy", href: "/raise-query" },
  { label: "Privacy Policy", href: "/profile" },
  { label: "Terms of Service", href: "/profile" },
];

const trustBadges = [
  "100% Fresh Guarantee",
  "Certified Halal",
  "0°C–4°C Cold-Chain",
  "90-Min Fast Delivery",
];

const socialConfig = [
  { key: "facebook", label: "Facebook", icon: FaFacebookF },
  { key: "instagram", label: "Instagram", icon: FaInstagram },
  { key: "linkedin", label: "LinkedIn", icon: FaLinkedinIn },
  { key: "twitter", label: "X", icon: FaXTwitter },
  { key: "youtube", label: "YouTube", icon: FaYoutube },
];

export default function Footer() {
  const { siteData } = useSiteData();
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const storeContactInfo = siteData?.store_contact_info;
  const storeData = siteData?.store_data;
  const year = new Date().getFullYear();

  const address = storeData?.total_address || [
    storeData?.address_1,
    storeData?.address_2,
    storeData?.city,
    storeData?.distict,
    storeData?.state,
    storeData?.pincode,
    storeData?.country,
  ].filter(Boolean).join(", ");

  const contactItems = [
    { label: "Address", value: address },
    { label: "Phone", value: storeContactInfo?.phone || storeData?.phone, href: (storeContactInfo?.phone || storeData?.phone) ? `tel:${storeContactInfo?.phone || storeData?.phone}` : null },
    { label: "WhatsApp", value: storeContactInfo?.whatsapp_number, href: storeContactInfo?.whatsapp_number ? `https://wa.me/${storeContactInfo.whatsapp_number}` : null },
    { label: "Email", value: storeContactInfo?.email || storeData?.email, href: (storeContactInfo?.email || storeData?.email) ? `mailto:${storeContactInfo?.email || storeData?.email}` : null },
  ].filter((item) => item.value);

  const socialLinks = socialConfig
    .map((item) => ({
      ...item,
      href: storeData?.[item.key],
    }))
    .filter((item) => item.href);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput("");
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-12 sm:mt-20 text-gray-700">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-18">
        {/* Newsletter Subscription Banner */}
        <div className="bg-gradient-to-r from-red-50/80 via-red-50/40 to-white border border-red-100 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 mb-10 sm:mb-14 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 shadow-card-subtle">
          <div className="max-w-xl text-center lg:text-left">
            <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-brand bg-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-100 inline-block mb-1.5 sm:mb-2">
              EXCLUSIVE OFFERS
            </span>
            <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
              Get weekend special cut deals in your inbox
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Be the first to know about seasonal seafood catches, festival cuts & chef recipes.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex-1 max-w-md flex flex-col sm:flex-row gap-2">
            {subscribed ? (
              <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl py-2.5 px-4 text-xs font-bold">
                <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Thank you! Subscribed to fresh updates.</span>
              </div>
            ) : (
              <>
                <div className="relative flex-1">
                  <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full h-10 sm:h-11 pl-10 sm:pl-11 pr-3 sm:pr-4 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 sm:h-11 px-5 sm:px-6 bg-brand hover:bg-brand-600 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center flex-shrink-0"
                >
                  Join
                </button>
              </>
            )}
          </form>
        </div>

        {/* Responsive 4-column grid (2-column on mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 lg:gap-14">
          {/* Brand info: Full-width on mobile */}
          <div className="col-span-2 lg:col-span-1 space-y-3 sm:space-y-4">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <img src="/images/logo/logo.webp" alt="YUMEAT logo" className="h-9 sm:h-11 w-auto object-contain" />
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-sm">
              Premium meats, poultry, and seafood delivered fresh and hygienically to your doorstep with end-to-end 0°C–4°C cold-chain assurance.
            </p>
          </div>

          {/* Quick Links: 1 column on mobile */}
          <div className="col-span-1">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-gray-400 mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-brand transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support: 1 column on mobile */}
          <div className="col-span-1">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-gray-400 mb-3 sm:mb-4">Support & Policy</h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-brand transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact: Full width on mobile */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-gray-400 mb-3 sm:mb-4">Contact & Store</h3>
            <div className="space-y-3">
              {contactItems.map((item) =>
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.label === "WhatsApp" ? "_blank" : undefined}
                    rel={item.label === "WhatsApp" ? "noreferrer" : undefined}
                    className="block group"
                  >
                    <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400">{item.label}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-700 group-hover:text-brand transition-colors line-clamp-2">{item.value}</span>
                  </a>
                ) : (
                  <div key={item.label}>
                    <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400">{item.label}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-700 line-clamp-2">{item.value}</span>
                  </div>
                )
              )}
              {storeContactInfo?.business_hours && (
                <p className="text-[11px] sm:text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-700">Hours: </span>
                  {storeContactInfo.business_hours}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 sm:my-12 border-gray-100" />

        {/* Quality Badges Bar: Clean 2x2 grid on mobile */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 py-1 sm:py-2">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400">Our Quality Promise</span>
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center justify-center text-center px-2.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-red-50 text-brand border border-red-100 shadow-xs"
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6 sm:my-8 border-gray-100" />

        {/* Bottom Bar: Social + Copyright */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] sm:text-xs text-gray-400 text-center sm:text-right font-medium">
            © {year} YUMEAT Store. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {socialLinks.length > 0 ? (
              socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-brand hover:text-white flex items-center justify-center text-gray-600 transition-all shadow-xs"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>
                );
              })
            ) : (
              <span className="text-xs text-gray-400">Follow YUMEAT on social media</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
