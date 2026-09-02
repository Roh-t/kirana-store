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
    <div className="w-full bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 border border-green-200/80 rounded-[24px] p-3 sm:p-4 shadow-[0_10px_25px_rgba(16,185,129,0.06)] mb-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-md shrink-0 border-2 border-white">
              {store?.name?.charAt(0) || 'K'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-none truncate">
                  {store?.name}
                </h2>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-green-100 text-green-800 border border-green-200/80">
                  <Radio className="w-2.5 h-2.5 text-green-600 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <p className="mt-1 text-[11px] sm:text-xs text-gray-500 font-medium flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                {store?.address?.street}, {store?.address?.city} • PIN: {store?.address?.pincode}
              </p>
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <StoreSwitcherDropdown
              stores={stores}
              activeStore={store}
              onStoreSwitched={onStoreSwitched}
              onOpenCreateStore={onOpenCreateStore}
            />
          </div>

          <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 via-white to-green-50 p-1.5 rounded-2xl border border-emerald-200/80 shadow-[0_6px_18px_rgba(16,185,129,0.08)] w-full sm:w-auto">
            <span className="inline-flex items-center rounded-xl bg-emerald-600/10 text-emerald-700 px-2 py-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.12em] shrink-0">
              Public
            </span>

            <span className="min-w-0 flex-1 text-[11px] sm:text-xs font-mono text-gray-700 truncate bg-white/70 border border-emerald-100 rounded-xl px-2 py-1.5">
              /s/{store?.slug}
            </span>

            <button
              onClick={copyStoreLink}
              className="p-2 bg-white hover:bg-emerald-50 rounded-xl text-gray-700 transition active:scale-95 border border-emerald-100 shadow-sm"
              title="Copy Public Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95"
              title="Open Customer Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};