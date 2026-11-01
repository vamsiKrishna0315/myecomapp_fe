'use client';

import React from 'react';
import { HiOutlineLocationMarker, HiPlus, HiCheck } from 'react-icons/hi';

const AddressSection = ({
  savedAddresses = [],
  selectedAddressId,
  onSelectAddress,
  onEditAddress,
  useBillingAsDelivery,
  onToggleUseBillingAsDelivery,
  onOpenAddAddress,
  useCurrentLocation,
  onToggleUseCurrentLocation,
  currentLocationLabel,
}) => {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-card-subtle p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-brand flex items-center justify-center flex-shrink-0">
            <HiOutlineLocationMarker className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Delivery Address</h2>
            <p className="text-xs text-gray-500">Select where you want your fresh order delivered</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAddAddress}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-brand hover:bg-[#b00f38] active:scale-[0.98] rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <HiPlus className="w-4 h-4" />
          <span>Add Address</span>
        </button>
      </div>

      {/* Live Location Toggle */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-gray-50/60 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-gray-900">
            Deliver to current live location
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {currentLocationLabel || 'Use your live GPS coordinates for pin-point delivery.'}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useCurrentLocation}
          onClick={() => onToggleUseCurrentLocation(!useCurrentLocation)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            useCurrentLocation ? 'bg-brand' : 'bg-gray-300'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              useCurrentLocation ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Billing Address Toggle */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-gray-50/60 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-gray-900">
            Use billing address as delivery address
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Keep billing and delivery details synchronized for this order.
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useBillingAsDelivery}
          onClick={() => onToggleUseBillingAsDelivery(!useBillingAsDelivery)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            useBillingAsDelivery ? 'bg-brand' : 'bg-gray-300'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              useBillingAsDelivery ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Address Cards Grid */}
      {!useCurrentLocation && (
        <div className="space-y-3">
          {savedAddresses.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              <HiOutlineLocationMarker className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No saved addresses found</p>
              <p className="text-xs text-gray-500 mt-1 mb-3">Add an address to continue with your checkout</p>
              <button
                type="button"
                onClick={onOpenAddAddress}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-brand bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <HiPlus className="w-3.5 h-3.5" />
                Add New Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {savedAddresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                const selectAddress = () => {
                  console.log('[Checkout][AddressSection] address selection triggered', {
                    id: address.id,
                    type: address.address_type_label,
                    fullAddress: address.full_address,
                    latitude: address.latitude ?? address.lat ?? address.address_latitude ?? null,
                    longitude: address.longitude ?? address.lng ?? address.address_longitude ?? null,
                  });
                  onSelectAddress(address);
                };

                return (
                  <div
                    key={address.id}
                    onClick={selectAddress}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        selectAddress();
                      }
                    }}
                    className={`relative text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-brand bg-red-50/20 ring-2 ring-brand/10 shadow-xs'
                        : 'border-gray-200/90 bg-white hover:border-brand/40 hover:bg-gray-50/50 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? 'border-brand bg-brand'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-gray-900 capitalize">
                            {address.address_type_label || 'Address'}
                          </span>
                          {(address.is_default === 1 || address.is_default === true) && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onEditAddress(address.id);
                          }}
                          className="text-xs font-bold text-gray-500 hover:text-brand transition-colors px-2 py-0.5 rounded hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 pl-6">
                        {address.full_address}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-brand pl-6">
                        <HiCheck className="w-3.5 h-3.5" />
                        <span>Delivering to this address</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AddressSection;
