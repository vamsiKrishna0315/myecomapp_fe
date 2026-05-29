'use client';

import React from "react";
import Link from "next/link";
import { Box, Image, Text } from "@chakra-ui/react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6";
import "./Footer.css";
import { useSiteData } from "../Context/SiteDataContext";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/" },
  { label: "About", href: "/profile" },
  { label: "Contact", href: "/raise-query" },
];

const supportLinks = [
  { label: "Shipping", href: "/orders" },
  { label: "Refund", href: "/raise-query" },
  { label: "Privacy", href: "/profile" },
  { label: "Terms", href: "/profile" },
];

const trustBadges = ["Fresh", "Halal", "Hygienic", "Fast Delivery"];

const socialConfig = [
  { key: "facebook", label: "Facebook", icon: FaFacebookF },
  { key: "instagram", label: "Instagram", icon: FaInstagram },
  { key: "linkedin", label: "LinkedIn", icon: FaLinkedinIn },
  { key: "twitter", label: "X", icon: FaXTwitter },
  { key: "youtube", label: "YouTube", icon: FaYoutube },
];

const Footer = () => {
  const { siteData } = useSiteData();
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

  return (
    <Box as="footer" className="footer_section">
      <Box className="footer_top">
        <Box className="footer_brand">
          <Image width="120px" src="/images/logo/logo.webp" alt="Yumeat logo" />
        </Box>

        <Box className="footer_column">
          <Text className="footer_heading">Quick Links</Text>
          {quickLinks.map((item) => (
            <Link key={item.label} href={item.href} className="footer_link">
              {item.label}
            </Link>
          ))}
        </Box>

        <Box className="footer_column">
          <Text className="footer_heading">Support</Text>
          {supportLinks.map((item) => (
            <Link key={item.label} href={item.href} className="footer_link">
              {item.label}
            </Link>
          ))}
        </Box>

        <Box className="footer_column">
          <Text className="footer_heading">Contact</Text>
          {contactItems.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                className="footer_link footer_contact_link"
                target={item.label === "WhatsApp" ? "_blank" : undefined}
                rel={item.label === "WhatsApp" ? "noreferrer" : undefined}
              >
                <span className="footer_label">{item.label}</span>
                <span>{item.value}</span>
              </a>
            ) : (
              <Box key={item.label} className="footer_link footer_contact_link">
                <span className="footer_label">{item.label}</span>
                <span>{item.value}</span>
              </Box>
            )
          )}
          {storeContactInfo?.business_hours ? (
            <Text className="footer_hours">{storeContactInfo.business_hours}</Text>
          ) : null}
        </Box>
      </Box>

      <Box className="footer_divider" />

      <Box className="footer_trust">
        <Text className="footer_heading">Trust Badges</Text>
        <Box className="footer_badges">
          {trustBadges.map((badge) => (
            <Text key={badge} className="footer_badge">
              {badge}
            </Text>
          ))}
        </Box>
      </Box>

      <Box className="footer_divider" />

      <Box className="footer_bottom">
        <Box className="footer_social">
          <Text className="footer_heading">Social Icons</Text>
          <Box className="footer_social_icons">
            {socialLinks.length > 0 ? socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="footer_social_link"
                >
                  <Icon />
                </a>
              );
            }) : <Text className="footer_social_empty">No social links available.</Text>}
          </Box>
        </Box>

        <Text className="footer_copy">© {year} YUMEAT. All rights reserved.</Text>
      </Box>
    </Box>
  );
};

export default Footer;
