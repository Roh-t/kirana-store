import React, { useState } from 'react';
import { StoreSwitcherDropdown } from './StoreSwitcherDropdown';
import { NotificationFeed } from '../notifications/NotificationFeed';
import { Copy, ExternalLink, Check, MapPin, Store as StoreIcon, Radio } from 'lucide-react';

export const StoreDashboardHeader = ({ store, stores = [], onStoreSwitched, onOpenCreateStore }) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/s/${store?.slug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-linear-to-br from-white via-green-50/30 to-emerald-50/50 border border-green-200/60 rounded-3xl p-4 sm:p-6 shadow-sm mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Store Avatar & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-600 to-emerald-700 text-white rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0 border-2 border-white">
            {store?.name?.charAt(0) || 'K'}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-none">
                {store?.name}
              </h2>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-green-100 text-green-800 border border-green-200/80">
                <Radio className="w-2.5 h-2.5 text-green-600 animate-pulse" />
                ONLINE
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
              {store?.address?.street}, {store?.address?.city} • PIN: {store?.address?.pincode}
            </p>
          </div>
        </div>

        {/* Right Side: Store Switcher & Customer Link */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-200/60">
          <StoreSwitcherDropdown
            stores={stores}
            activeStore={store}
            onStoreSwitched={onStoreSwitched}
            onOpenCreateStore={onOpenCreateStore}
          />

          <NotificationFeed storeId={store?._id} />

          {/* Public Storefront QR Link Bar */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-xs font-mono text-gray-500 max-w-[130px] sm:max-w-[170px] truncate pl-2">
              /s/{store?.slug}
            </span>

            <button
              onClick={copyStoreLink}
              className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-700 transition active:scale-95 border border-gray-200"
              title="Copy Public Link"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs active:scale-95"
              title="Open Customer Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};