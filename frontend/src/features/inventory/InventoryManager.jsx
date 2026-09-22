import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { Warehouse, Plus, Minus, AlertTriangle, History, Check, X, ArrowUpRight, ArrowDownLeft, Package, Search, Filter, ChevronLeft, ChevronRight, BarChart3, ChevronDown, ChevronUp, Scale } from 'lucide-react';

export const InventoryManager = ({ storeId }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityShift, setQuantityShift] = useState('');
  const [type, setType] = useState('PURCHASE');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [isSavingShift, setIsSavingShift] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [stockLimit, setStockLimit] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [categorySummary, setCategorySummary] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [partialSaleSavingId, setPartialSaleSavingId] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [adjustingStockId, setAdjustingStockId] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory(storeId, {
        page: currentPage,
        limit: 20,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        stockFilter,
        ...(selectedCategory ? { categoryName: selectedCategory } : {}),
        ...(stockFilter === 'BELOW' && stockLimit !== '' ? { stockLimit } : {})
      });
      setInventory(Array.isArray(res.data) ? res.data : []);
      setCategorySummary(Array.isArray(res.meta?.categorySummary) ? res.meta.categorySummary : []);
      setPagination(res.pagination || { currentPage, totalPages: 1, totalRecords: res.data?.length || 0 });
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
  }, [storeId, currentPage, searchQuery, stockFilter, stockLimit, selectedCategory]);

  const updateSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const updateStockFilter = (value) => {
    setStockFilter(value);
    setCurrentPage(1);
  };

  const selectCategory = (categoryName) => {
    setSelectedCategory((current) => {
      const nextCategory = current === categoryName ? '' : categoryName;
      setExpandedCategories(nextCategory ? { [nextCategory]: true } : {});
      return nextCategory;
    });
    setCurrentPage(1);
  };

  const toggleSummary = async () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }

    setShowSummary(true);
    if (summary || summaryLoading) return;

    try {
      setSummaryError(null);
      setSummaryLoading(true);
      const res = await inventoryService.getInventorySummary(storeId);
      setSummary(res.data);
    } catch (err) {
      setSummaryError(err.message || 'Failed to load stock summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const applySummaryFilter = (filter) => {
    setStockFilter(filter);
    setCurrentPage(1);
    setShowSummary(false);
  };

  const openAdjustModal = (item, defaultType = 'PURCHASE') => {
    setSelectedItem(item);
    setType(defaultType);
    setQuantityShift('');
    setReason('');
    setError(null);
    setIsSavingShift(false);
    setShowModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (isSavingShift || !selectedItem) return;

    setError(null);
    setIsSavingShift(true);

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
      setSummary(null);
      fetchInventory();
    } catch (err) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setIsSavingShift(false);
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

  const handlePartialSaleToggle = async (item, allowPartialSale) => {
    const product = item.productId;
    if (!product?._id || partialSaleSavingId === product._id) return;

    const previousValue = Boolean(product.allowPartialSale);
    setPartialSaleSavingId(product._id);
    setInventory((prev) => prev.map((entry) => (
      entry._id === item._id
        ? { ...entry, productId: { ...entry.productId, allowPartialSale } }
        : entry
    )));

    try {
      await productService.updateProduct(storeId, product._id, { allowPartialSale });
    } catch (err) {
      setInventory((prev) => prev.map((entry) => (
        entry._id === item._id
          ? { ...entry, productId: { ...entry.productId, allowPartialSale: previousValue } }
          : entry
      )));
      setError(err.message || 'Failed to update partial sale setting');
    } finally {
      setPartialSaleSavingId(null);
    }
  };

  const lowStockCount = inventory.filter((inv) => inv.stockQuantity <= inv.reorderPoint).length;
  const filteredInventory = inventory;
  const groupedInventory = filteredInventory.reduce((groups, item) => {
    const categoryName = item.productId?.categoryId?.name || 'Other items';
    if (!groups[categoryName]) groups[categoryName] = [];
    groups[categoryName].push(item);
    return groups;
  }, {});

  const toggleCategory = (categoryName) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [categoryName]: !previous[categoryName]
    }));
  };

  const quickAdjustStock = async (item, quantityDelta) => {
    if (adjustingStockId || (quantityDelta < 0 && item.stockQuantity <= 0)) return;

    setError(null);
    setAdjustingStockId(item._id);
    try {
      const res = await inventoryService.adjustStock(storeId, {
        productId: item.productId._id,
        quantityDelta,
        type: quantityDelta > 0 ? 'PURCHASE' : 'CORRECTION',
        reason: quantityDelta > 0 ? 'Quick restock' : 'Quick stock reduction'
      });
      const newStock = res.data?.inventory?.stockQuantity;
      setInventory((previous) => previous.map((entry) => (
        entry._id === item._id
          ? { ...entry, stockQuantity: Number.isFinite(Number(newStock)) ? Number(newStock) : entry.stockQuantity + quantityDelta }
          : entry
      )));
      setSummary(null);
    } catch (err) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setAdjustingStockId(null);
    }
  };

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

        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              {lowStockCount} Low Stock Alert(s)
            </div>
          )}
          <button
            type="button"
            onClick={toggleSummary}
            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            aria-expanded={showSummary}
          >
            <BarChart3 className="w-3.5 h-3.5 text-green-700" />
            Summary
            {showSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {showSummary && (
        <div className="rounded-xl border border-green-100 bg-green-50/60 p-3">
          {summaryLoading ? (
            <p className="text-xs text-gray-500">Loading stock summary...</p>
          ) : summaryError ? (
            <p className="text-xs text-red-600">{summaryError}</p>
          ) : summary ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <p className="text-[10px] text-gray-500">Unique items</p>
                <p className="text-sm font-black text-gray-900">{summary.totalItems}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Total items</p>
                <p className="text-sm font-black text-gray-900">{summary.totalStock}</p>
              </div>
              <button
                type="button"
                onClick={() => applySummaryFilter('LOW')}
                className="text-left rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 -mx-1 cursor-pointer shadow-sm hover:bg-amber-100 transition"
                title="Show items that need restocking"
              >
                <p className="text-[10px] text-gray-500">Restock needed</p>
                <p className="text-sm font-black text-amber-700">{summary.restockNeeded} items</p>
              </button>
              <button
                type="button"
                onClick={() => applySummaryFilter('LOW')}
                className="text-left rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 -mx-1 cursor-pointer shadow-sm hover:bg-amber-100 transition"
                title="Show low-stock products"
              >
                <p className="text-[10px] text-gray-500">Low stock</p>
                <p className="text-sm font-black text-amber-700">{summary.lowStock} products</p>
              </button>
              <button
                type="button"
                onClick={() => applySummaryFilter('OUT')}
                className="text-left rounded-lg border border-red-200 bg-red-50 px-2 py-1 -mx-1 cursor-pointer shadow-sm hover:bg-red-100 transition"
                title="Show out-of-stock products"
              >
                <p className="text-[10px] text-gray-500">Out of stock</p>
                <p className="text-sm font-black text-red-600">{summary.outOfStock} products</p>
              </button>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Search item, Hindi name, brand or barcode..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/60"
          />
        </label>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={stockFilter}
            onChange={(e) => updateStockFilter(e.target.value)}
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

      {categorySummary.length > 0 && (
        <div className="rounded-2xl border border-green-100 bg-green-50/40 p-2.5">
          <div className="flex items-center justify-between gap-2 px-1 mb-2">
            <p className="text-[11px] font-extrabold text-gray-700">Indian sub-categories</p>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => selectCategory(selectedCategory)}
                className="text-[10px] font-bold text-green-700 hover:text-green-900"
              >
                Show all
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {categorySummary.map((category) => (
              <button
                type="button"
                key={category.name}
                onClick={() => selectCategory(category.name)}
                className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-left transition ${
                  selectedCategory === category.name
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                }`}
                aria-pressed={selectedCategory === category.name}
              >
                <span className="block text-[11px] font-extrabold">{category.name}</span>
                <span className={`text-[10px] font-semibold ${selectedCategory === category.name ? 'text-green-50' : 'text-gray-400'}`}>
                  {category.count} items
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {filteredInventory.map((inv) => {
            const product = inv.productId;
            const isLow = inv.stockQuantity <= inv.reorderPoint;
            const packSize = Number(product?.unitQuantity) || 1;
            const unit = product?.unit || 'UNIT';
            const totalQuantity = inv.stockQuantity * packSize;

            return (
              <div key={inv._id} className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm hover:border-green-300 transition">
                <div className="h-24 w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                  {product?.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-2" loading="lazy" />
                  ) : (
                    <Package className="w-7 h-7 text-gray-300" />
                  )}
                </div>
                <div className="mt-2 min-w-0">
                  <p className="font-extrabold text-[11px] leading-4 text-gray-900 line-clamp-2 min-h-8">{product?.name || 'Unnamed item'}</p>
                  <p className="text-[10px] text-gray-500 truncate">{packSize} {unit} · Reorder at {inv.reorderPoint}</p>
                </div>

                <div className="mt-2 flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-extrabold ${inv.stockQuantity === 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-700'}`}>
                    {inv.stockQuantity === 0 ? 'OUT' : isLow ? 'LOW' : `${totalQuantity} ${unit}`}
                  </span>
                  <span className="text-xs font-black text-gray-900">{inv.stockQuantity}</span>
                </div>

                <div className="mt-2 space-y-1.5">
                  <div className="flex w-full items-center gap-1.5">
                    <div className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => quickAdjustStock(inv, -1)}
                        disabled={adjustingStockId === inv._id || inv.stockQuantity <= 0}
                        className="flex h-9 w-10 shrink-0 items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Decrease stock by 1 item"
                        aria-label={`Decrease ${product?.name} stock`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-black text-gray-800">{inv.stockQuantity}</span>
                      <button
                        type="button"
                        onClick={() => quickAdjustStock(inv, 1)}
                        disabled={adjustingStockId === inv._id}
                        className="flex h-9 w-10 shrink-0 items-center justify-center text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Increase stock by 1 item"
                        aria-label={`Increase ${product?.name} stock`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => quickAdjustStock(inv, 10)}
                      disabled={adjustingStockId === inv._id}
                      title="Add 10 items quickly"
                      className="h-9 shrink-0 px-2.5 bg-green-50 text-green-700 active:bg-green-100 border border-green-200 rounded-xl text-[10px] font-extrabold transition active:scale-95"
                    >
                      +10
                    </button>
                  </div>
                  <div className="flex w-full items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePartialSaleToggle(inv, !product?.allowPartialSale)}
                      disabled={partialSaleSavingId === product?._id}
                      className={`h-8 flex-1 rounded-xl border text-[10px] font-bold transition ${
                        product?.allowPartialSale
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-500 hover:text-green-700 hover:border-green-200'
                      } disabled:opacity-50`}
                      title={product?.allowPartialSale ? 'Disable partial unit selling' : 'Allow partial unit selling'}
                    >
                      <Scale className="inline-block mr-0.5 h-3 w-3" />
                      {product?.allowPartialSale ? 'Partial On' : 'Partial'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openAdjustModal(inv, 'PURCHASE')}
                      className="h-8 flex-1 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-500 hover:text-gray-800"
                      title="Enter a custom stock adjustment"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => viewHistory(inv)}
                      className="h-8 flex-1 border border-gray-200 text-gray-600 active:bg-gray-100 rounded-xl flex items-center justify-center"
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

      {!loading && pagination.totalRecords > 0 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-[11px] text-gray-500 font-semibold">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1}-{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of {pagination.totalRecords}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={!pagination.hasPrevPage}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-[11px] font-bold text-gray-700">{pagination.currentPage} / {pagination.totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!pagination.hasNextPage}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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
                <p className="text-[11px] text-green-700 font-semibold mt-0.5">
                  1 item = {selectedItem.productId?.unitQuantity || 1} {selectedItem.productId?.unit || 'UNIT'}
                </p>
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
                  Quantity ({selectedItem.productId?.allowPartialSale ? 'units / packs' : 'items / packs'})
                </label>
                <input
                  type="number"
                  required
                  min="0.001"
                  step="any"
                  placeholder="e.g. 10"
                  value={quantityShift}
                  onChange={(e) => setQuantityShift(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  {selectedItem.productId?.allowPartialSale
                    ? 'Partial units are allowed for this item.'
                    : 'Enter the number of packs/items, not the total weight.'}
                </p>
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
                  disabled={isSavingShift}
                  className="px-4 py-2 bg-green-600 active:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 disabled:cursor-wait disabled:opacity-70"
                >
                  {isSavingShift ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Shift
                    </>
                  )}
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
                        {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta} item(s)
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Stock: {tx.newStock} item(s)
                      </span>
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