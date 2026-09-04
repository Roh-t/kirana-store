import React, { useState } from 'react';
import { StoreSwitcherDropdown } from './StoreSwitcherDropdown';
import { Copy, ExternalLink, Check, MapPin, Settings, Plus } from 'lucide-react';

export const StoreDashboardHeader = ({ store, stores = [], onStoreSwitched, onOpenCreateStore }) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/s/${store?.slug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-2.5 mb-2.5">
      {/* 1. Main Store Card */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-emerald-50/90 via-green-50/60 to-teal-50/80 border border-emerald-100/90 p-3 sm:p-4 shadow-[0_2px_12px_rgba(16,185,129,0.05)]">
        {/* Subtle Decorative Shop Graphic */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-30 sm:opacity-50 select-none">
          <svg width="130" height="85" viewBox="0 0 170 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M110 40H160V100H110V40Z" fill="#34D399" fillOpacity="0.4" />
            <path d="M100 30L135 12L170 30V40H100V30Z" fill="#10B981" fillOpacity="0.5" />
            <circle cx="150" cy="70" r="14" fill="#059669" fillOpacity="0.3" />
            <path d="M120 65H135V100H120V65Z" fill="#047857" fillOpacity="0.4" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Store Initial Icon */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-lg sm:text-xl shadow-xs shrink-0 border border-white/80">
              {store?.name?.charAt(0) || 'S'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight truncate">
                  {store?.name || 'My Store'}
                </h2>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100/90 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500 font-medium flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">
                  {store?.address?.street || '08, Bagsewaniya'}, {store?.address?.city || 'Bhopal'} • PIN: {store?.address?.pincode || '462043'}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              onClick={copyStoreLink}
              className="p-1.5 bg-white hover:bg-emerald-50 rounded-lg text-gray-700 transition active:scale-95 border border-gray-200 shadow-2xs"
              title="Copy Public Link"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-800 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 shadow-2xs border border-gray-200 active:scale-95"
              title="Open Customer Storefront"
            >
              <Settings className="w-3 h-3 text-gray-600" />
              <span>Manage Store</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Workspace Selector */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">
          Your Store Workspace
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <StoreSwitcherDropdown
              stores={stores}
              activeStore={store}
              onStoreSwitched={onStoreSwitched}
              onOpenCreateStore={onOpenCreateStore}
            />
          </div>

          <button
            onClick={onOpenCreateStore}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/70 text-left transition group active:scale-98"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-black text-emerald-950 group-hover:text-emerald-900 leading-tight">
                Add Store
              </div>
              <div className="text-[9px] font-semibold text-emerald-600 leading-none">New Branch</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};