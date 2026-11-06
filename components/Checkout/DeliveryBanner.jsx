'use client';

import React from 'react';
import { HiLightningBolt } from 'react-icons/hi';

const DeliveryBanner = ({ deliveryTime, loading = false, visible = false }) => {
  if (!visible || !deliveryTime) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-red-600 to-brand text-white rounded-2xl p-4 sm:p-5 shadow-premium mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <HiLightningBolt className="w-6 h-6 text-yellow-300 animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-white/80 block">
            EXPRESS DISPATCH
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-white">
            Cold-Chain Delivery In Transit
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-xl shadow-xs self-stretch sm:self-auto justify-center">
        {loading ? (
          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
        <span className="text-xs font-bold text-gray-500">Delivering in</span>
        <span className="text-lg sm:text-xl font-black text-brand tracking-tight">
          {deliveryTime} mins
        </span>
      </div>
    </div>
  );
};

export default DeliveryBanner;
