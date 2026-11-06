'use client';

import React from 'react';
import { HiOutlineChatAlt2 } from 'react-icons/hi';

const SPECIAL_INSTRUCTIONS_MAX_LENGTH = 250;

const SpecialInstructionsSection = ({ value = '', onChange }) => {
  const remainingCharacters = SPECIAL_INSTRUCTIONS_MAX_LENGTH - (value?.length || 0);

  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-card-subtle p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-brand flex items-center justify-center flex-shrink-0 mt-0.5">
            <HiOutlineChatAlt2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
              Special Delivery Notes
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Leave instructions for the rider or packing team (e.g., leave at door, call on arrival).
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-gray-400 flex-shrink-0 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
          {remainingCharacters} left
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, SPECIAL_INSTRUCTIONS_MAX_LENGTH))}
        rows={3}
        placeholder="Example: Call on arrival, handle with extra ice pack, gate code #421..."
        className="w-full p-3.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200/90 focus:border-brand focus:ring-2 focus:ring-brand/10 rounded-xl outline-none transition-all resize-none"
      />
    </section>
  );
};

export default SpecialInstructionsSection;
