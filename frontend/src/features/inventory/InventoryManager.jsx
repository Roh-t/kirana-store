import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { Warehouse, Plus, AlertTriangle, History, Check, X, ArrowUpRight, ArrowDownLeft, Package, Search, Filter } from 'lucide-react';

export const InventoryManager = ({ storeId }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityShift, setQuantityShift] = useState('');
  const [type, setType] = useState('PURCHASE');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [stockLimit, setStockLimit] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory(storeId);
      setInventory(res.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchInventory();
    }
  }, [storeId]);

  const openAdjustModal = (item, defaultType = 'PURCHASE') => {
    setSelectedItem(item);
    setType(defaultType);
    setQuantityShift('');
    setReason('');
    setError(null);
    setShowModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const shift = Number(quantityShift);
    const finalDelta = type === 'DAMAGE' || type === 'CORRECTION' ? -Math.abs(shift) : Math.abs(shift);

    try {
      await inventoryService.adjustStock(storeId, {
        productId: selectedItem.productId._id,
        quantityDelta: finalDelta,
        type,
        reason
      });
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to update stock');
    }
  };

  const viewHistory = async (item) => {
    setHistoryItem(item);
    try {
      const res = await inventoryService.getTransactions(storeId, item.productId._id);
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const lowStockCount = inventory.filter((inv) => inv.stockQuantity <= inv.reorderPoint).length;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredInventory = inventory.filter((inv) => {
    const product = inv.productId;
    const matchesSearch = !normalizedSearch || [product?.name, product?.regionalName]
      .filter(Boolean)
      .some((name) => name.toLowerCase().includes(normalizedSearch));
    const matchesStockFilter = stockFilter === 'ALL'
      || (stockFilter === 'LOW' && inv.stockQuantity <= inv.reorderPoint)
      || (stockFilter === 'OUT' && inv.stockQuantity <= 0)
      || (stockFilter === 'BELOW' && stockLimit !== '' && inv.stockQuantity < Number(stockLimit));

    return matchesSearch && matchesStockFilter;
  });

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Stock Inventory</h3>
            <p className="text-[11px] text-gray-500">Track & Restock Items</p>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            {lowStockCount} Low Stock Alert(s)
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item name..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/60"
          />
        </label>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="flex-1 sm:w-48 px-2.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white font-semibold text-gray-700"
            aria-label="Filter stock levels"
          >
            <option value="ALL">All stock levels</option>
            <option value="LOW">At or below reorder point</option>
            <option value="OUT">Out of stock</option>
            <option value="BELOW">Below a quantity</option>
          </select>

          {stockFilter === 'BELOW' && (
            <input
              type="number"
              min="0"
              step="any"
              value={stockLimit}
              onChange={(e) => setStockLimit(e.target.value)}
              placeholder="Qty"
              className="w-16 px-2.5 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-semibold"
              aria-label="Stock quantity limit"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400 font-bold">Loading stock balances...</div>
      ) : inventory.length === 0 ? (
        <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-bold">No inventory records</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-bold">No items match this search or filter</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredInventory.map((inv) => {
            const product = inv.productId;
            const isLow = inv.stockQuantity <= inv.reorderPoint;

            return (
              <div key={inv._id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                  {product?.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">{product?.name}</span>
                    {product?.regionalName && (
                      <span className="text-xs text-green-700 font-bold truncate">{product.regionalName}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">
                    Reorder Threshold: {inv.reorderPoint} {product?.unit}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isLow ? 'text-amber-600' : inv.stockQuantity === 0 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {inv.stockQuantity} {product?.unit}
                    </span>
                    {isLow && <span className="text-[9px] text-amber-600 font-extrabold block">LOW</span>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openAdjustModal(inv, 'PURCHASE')}
                      className="px-2.5 py-1.5 bg-green-50 text-green-700 active:bg-green-100 border border-green-200 rounded-xl text-xs font-extrabold flex items-center gap-1 transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Restock
                    </button>
                    <button
                      onClick={() => viewHistory(inv)}
                      className="p-1.5 border border-gray-200 text-gray-600 active:bg-gray-100 rounded-xl"
                      title="View Stock Log"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Update Stock Balance</h4>
                <p className="text-xs text-gray-500">{selectedItem.productId?.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adjustment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none bg-white font-bold"
                >
                  <option value="PURCHASE">PURCHASE (Restock Add)</option>
                  <option value="CORRECTION">CORRECTION (Stock Reduction)</option>
                  <option value="DAMAGE">DAMAGE (Spoiled / Lost)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity ({selectedItem.productId?.unit})
                </label>
                <input
                  type="number"
                  required
                  min="0.001"
                  step="any"
                  placeholder="e.g. 50"
                  value={quantityShift}
                  onChange={(e) => setQuantityShift(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received new stock batch"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 active:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 active:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Drawer */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 mb-2">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Stock Movement Log</h4>
                <p className="text-xs text-gray-500">{historyItem.productId?.name}</p>
              </div>
              <button onClick={() => setHistoryItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-1">
              {transactions.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No transaction logs recorded yet.</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx._id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-800">{tx.type}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {tx.reason && <p className="text-[11px] text-gray-500">{tx.reason}</p>}
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold flex items-center justify-end ${
                          tx.quantityDelta > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.quantityDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta}
                      </span>
                      <span className="text-[10px] text-gray-400 block">Stock: {tx.newStock}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};