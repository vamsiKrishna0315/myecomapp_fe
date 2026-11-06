'use client';

import React from "react";
import { HiOutlineShieldCheck, HiOutlineTruck, HiSparkles } from "react-icons/hi";

const pillars = [
  {
    icon: (
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100/60 shadow-xs">
        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m-4-14l8 8m0-8l-8 8" />
        </svg>
      </div>
    ),
    badge: "0°C – 4°C CHILLED",
    title: "Always Fresh, Never Frozen",
    desc: "Strict cold-chain ensures pure texture and natural juices.",
  },
  {
    icon: (
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-red-50 text-brand flex items-center justify-center flex-shrink-0 border border-red-100/60 shadow-xs">
        <HiSparkles className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
    ),
    badge: "ARTISANAL CUTS",
    title: "Freshly Cut Upon Order",
    desc: "Master butchers trim every cut tailored for your recipe.",
  },
  {
    icon: (
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100/60 shadow-xs">
        <HiOutlineTruck className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
    ),
    badge: "EXPRESS DISPATCH",
    title: "90-Min Fast Delivery",
    desc: "Delivered cold in insulated packs directly to you.",
  },
  {
    icon: (
      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100/60 shadow-xs">
        <HiOutlineShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>
    ),
    badge: "CERTIFIED PURITY",
    title: "100% Halal & Clean",
    desc: "No antibiotic residues, zero chemicals, lab-tested safe.",
  },
];

export default function TrustBar() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-8 lg:px-12 mt-2.5 sm:-mt-6 lg:-mt-8 relative z-20">
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 p-3.5 sm:p-6 lg:p-7">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 divide-gray-100">
          {pillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className={`flex items-start gap-2.5 sm:gap-4 ${
                idx > 0 ? "lg:border-l lg:border-gray-100 lg:pl-6" : ""
              }`}
            >
              {pillar.icon}
              <div className="flex-1 min-w-0">
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400 block truncate mb-0.5">
                  {pillar.badge}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-snug truncate sm:whitespace-normal">
                  {pillar.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
