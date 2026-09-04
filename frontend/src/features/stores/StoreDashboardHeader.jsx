import React, { useState } from 'react';
import { StoreSwitcherDropdown } from './StoreSwitcherDropdown';
import { Copy, ExternalLink, Check, MapPin, Radio } from 'lucide-react';

export const StoreDashboardHeader = ({ store, stores = [], onStoreSwitched, onOpenCreateStore }) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${window.location.origin}/s/${store?.slug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-transparent sm:bg-gradient-to-br sm:from-white sm:via-green-50/30 sm:to-emerald-50/50 border-0 sm:border sm:border-green-200/80 rounded-none sm:rounded-[20px] p-0 sm:p-3.5 shadow-none sm:shadow-[0_8px_22px_rgba(16,185,129,0.06)] mb-3">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2.5 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 border border-green-200/80 rounded-[20px] p-2.5 shadow-[0_8px_22px_rgba(16,185,129,0.06)] sm:bg-transparent sm:border-0 sm:rounded-none sm:p-0 sm:shadow-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-xl flex items-center justify-center font-black text-lg sm:text-xl shadow-md shrink-0 border-2 border-white">
              {store?.name?.charAt(0) || 'K'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-lg font-black text-gray-900 tracking-tight leading-none truncate">
                  {store?.name}
                </h2>

                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold bg-green-100 text-green-800 border border-green-200/80">
                  <Radio className="w-2 h-2 text-green-600 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500 font-medium flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-green-600 shrink-0" />
                {store?.address?.street}, {store?.address?.city} • PIN: {store?.address?.pincode}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white border border-gray-200 rounded-[20px] p-2 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:bg-transparent sm:border-0 sm:rounded-none sm:p-0 sm:shadow-none">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <StoreSwitcherDropdown
              stores={stores}
              activeStore={store}
              onStoreSwitched={onStoreSwitched}
              onOpenCreateStore={onOpenCreateStore}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 via-white to-green-50 p-1 rounded-xl border border-emerald-200/80 shadow-[0_4px_12px_rgba(16,185,129,0.06)] w-full sm:w-auto">
            <span className="hidden sm:inline-flex items-center rounded-lg bg-emerald-600/10 text-emerald-700 px-1.5 py-1 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.12em] shrink-0">
              Public
            </span>

            <span className="min-w-0 flex-1 text-[10px] sm:text-xs font-mono text-gray-700 truncate bg-white/70 border border-emerald-100 rounded-lg px-1.5 py-1 sm:block hidden">
              /s/{store?.slug}
            </span>

            <button
              onClick={copyStoreLink}
              className="p-1.5 bg-white hover:bg-emerald-50 rounded-lg text-gray-700 transition active:scale-95 border border-emerald-100 shadow-sm"
              title="Copy Public Link"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
              title="Open Customer Storefront"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Manage Store</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};