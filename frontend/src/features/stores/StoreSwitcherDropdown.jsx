import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { Store, ChevronDown, Plus, Check } from 'lucide-react';

export const StoreSwitcherDropdown = ({ stores, activeStore, onStoreSwitched, onOpenCreateStore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { login } = useAuth();

  const handleSwitch = async (targetStore) => {
    if (targetStore._id === activeStore?._id) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      const res = await authService.switchStore(targetStore._id);
      login(res.data, res.data.token);
      onStoreSwitched(targetStore);
      setIsOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to switch store workspace');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
      >
        <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
          {activeStore?.name?.charAt(0) || 'K'}
        </div>
        <div className="text-left hidden sm:block">
          <span className="text-xs font-bold text-gray-900 block leading-tight">{activeStore?.name}</span>
          <span className="text-[10px] text-gray-500 block leading-tight">Switch Store Branch</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-2 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 block">
            Your Store Workspaces
          </span>

          {stores.map((s) => {
            const isActive = s._id === activeStore?._id;

            return (
              <button
                key={s._id}
                onClick={() => handleSwitch(s)}
                className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs font-medium transition ${
                  isActive ? 'bg-green-50 text-green-800 font-bold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="truncate">
                  <span className="block truncate">{s.name}</span>
                  <span className="text-[10px] text-gray-400 font-normal">{s.address?.city}</span>
                </div>
                {isActive && <Check className="w-4 h-4 text-green-600 shrink-0" />}
              </button>
            );
          })}

          <div className="border-t pt-1 mt-1 border-gray-100">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenCreateStore();
              }}
              className="w-full text-left p-2 rounded-xl text-xs font-bold text-green-700 hover:bg-green-50 flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Add Another Store Branch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};