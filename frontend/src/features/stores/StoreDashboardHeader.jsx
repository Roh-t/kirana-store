import React, { useState } from 'react';
import { StoreSwitcherDropdown } from './StoreSwitcherDropdown';
import { Copy, ExternalLink, Check, MapPin, Radio, Settings, Plus } from 'lucide-react';

export const StoreDashboardHeader = ({ store, stores = [], onStoreSwitched, onOpenCreateStore }) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/s/${store?.slug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-3.5 mb-3">
      {/* 1. Main Store Overview Card */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-emerald-50/80 via-green-50/50 to-teal-50/70 border border-emerald-100/90 p-4 sm:p-5 shadow-[0_4px_20px_rgba(16,185,129,0.05)]">
        {/* Decorative Store graphic in background */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-40 sm:opacity-70 select-none">
          <svg width="170" height="110" viewBox="0 0 170 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M110 40H160V100H110V40Z" fill="#34D399" fillOpacity="0.3" />
            <path d="M100 30L135 12L170 30V40H100V30Z" fill="#10B981" fillOpacity="0.45" />
            <circle cx="150" cy="70" r="14" fill="#059669" fillOpacity="0.2" />
            <path d="M120 65H135V100H120V65Z" fill="#047857" fillOpacity="0.35" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            {/* Store Initial Icon */}
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm shrink-0 border-2 border-white">
              {store?.name?.charAt(0) || 'S'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none truncate">
                  {store?.name}
                </h2>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100/90 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500 font-medium flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>
                  {store?.address?.street}, {store?.address?.city}
                  <span className="ml-1 text-gray-400">• PIN: {store?.address?.pincode}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Manage Store / Public Link Action */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              onClick={copyStoreLink}
              className="p-2 bg-white hover:bg-emerald-50 rounded-xl text-gray-700 transition active:scale-95 border border-gray-200/80 shadow-2xs"
              title="Copy Public Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-2xs border border-gray-200/80 active:scale-95"
              title="Open Customer Storefront"
            >
              <Settings className="w-3.5 h-3.5 text-gray-600" />
              <span>Manage Store</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Store Workspace Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-black tracking-wider text-gray-400 uppercase">
          Your Store Workspace
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70 text-left transition group active:scale-98"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-950 group-hover:text-emerald-900 leading-tight">
                Add Store
              </div>
              <div className="text-[10px] font-semibold text-emerald-600">New Branch</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};