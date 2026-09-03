import React, { useState, useEffect } from 'react';
import { publicService } from '../../services/publicService';
import { useCart } from '../../context/CartContext';
import { CartDrawer } from './CartDrawer';
import { OrderSuccessView } from './OrderSuccessView';
import { CustomerOrderHistoryModal } from './CustomerOrderHistoryModal';
import { VoiceOrderAssistant } from '../ai/VoiceOrderAssistant';
import { convertFromBaseQuantity, convertToBaseQuantity, getQuantityUnitOptions } from '../../utils/quantityUnits';
import { Store, Search, MapPin, ShoppingBag, Plus, Minus, Clock, Sparkles, ArrowRight } from 'lucide-react';

export const PublicStorefront = ({ slug }) => {
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAiVoiceOpen, setIsAiVoiceOpen] = useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { items, totalItemsCount, subTotal, updateQuantity, setQuantity } = useCart();

  const loadStorefront = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catRes, catalogRes] = await Promise.all([
        publicService.getPublicCategories(slug),
        publicService.getPublicCatalog(slug, { categorySlug: selectedCategory, search })
      ]);
      setCategories(catRes.data);
      setStore(catalogRes.data.store);
      setCatalog(catalogRes.data.catalog);
    } catch (err) {
      setError(err.message || 'Store not found or offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadStorefront();
    }
  }, [slug, selectedCategory, search]);

  if (placedOrder) {
    return <OrderSuccessView order={placedOrder} onBackToStore={() => setPlacedOrder(null)} />;
  }

  if (loading && !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-xs text-gray-500 font-bold mt-3">Opening Kirana Storefront...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Store Currently Offline</h3>
          <p className="text-xs text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100/70 pb-28">
      {/* Mobile Header Banner */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-11 h-11 bg-green-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                {store?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-extrabold text-gray-900 truncate leading-tight">{store?.name}</h1>
                <p className="text-[11px] text-gray-500 flex items-center gap-0.5 truncate mt-0.5">
                  <MapPin className="w-3 h-3 text-green-600 shrink-0" />
                  {store?.address?.street}, {store?.address?.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsAiVoiceOpen(true)}
                className="p-2.5 bg-purple-100 text-purple-700 active:scale-95 rounded-xl transition"
                title="AI Voice Search"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsHistoryOpen(true)}
                className="px-2.5 py-2 bg-gray-100 active:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1 transition"
              >
                <Clock className="w-3.5 h-3.5 text-green-700" />
                Orders
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items (e.g. Atta, आटा, Oil)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition"
            />
          </div>

          {/* Category Horizontal Pill Tabs */}
          {categories.length > 0 && (
            <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                  selectedCategory === ''
                    ? 'bg-green-600 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                    selectedCategory === cat.slug
                      ? 'bg-green-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Product Catalog Mobile List */}
      <main className="max-w-md mx-auto p-3.5 sm:p-4 space-y-2.5">
        {catalog.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-200/80 p-6">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No matching items</p>
            <p className="text-xs text-gray-400 mt-1">Try changing category or search terms.</p>
          </div>
        ) : (
          catalog.map((product) => {
            const qty = items[product._id]?.quantity || 0;
            const hasDiscount = product.mrp > product.sellingPrice;
            const displayUnit = selectedUnits[product._id] || product.unit;
            const displayQuantity = convertFromBaseQuantity(qty, displayUnit, product.unit);

            return (
              <div
                key={product._id}
                className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between gap-3 active:bg-gray-50/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{product.name}</h3>
                  {product.regionalName && (
                    <p className="text-xs font-semibold text-green-700 mt-0.5">{product.regionalName}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {product.unitQuantity} {product.unit}
                  </p>

                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-black text-green-700">₹{product.sellingPrice}</span>
                    {hasDiscount && <span className="text-[11px] text-gray-400 line-through">MRP ₹{product.mrp}</span>}
                  </div>
                </div>

                {/* Touch-Friendly Add/Quantity Controls */}
                <div className="shrink-0">
                  {!product.inStock ? (
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">
                      Out of Stock
                    </span>
                  ) : qty === 0 ? (
                    <button
                      onClick={() => updateQuantity(product, 1)}
                      className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 active:bg-green-100 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center bg-green-600 text-white rounded-xl shadow-2xs">
                      <button
                        onClick={() => updateQuantity(product, -convertToBaseQuantity(1, displayUnit, product.unit))}
                        className="p-2.5 active:bg-green-700 rounded-l-xl transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="text"
                        inputMode="decimal"
                        min="0.001"
                        step="0.001"
                        value={quantityDrafts[product._id] ?? displayQuantity}
                        onFocus={() => setQuantityDrafts((prev) => ({ ...prev, [product._id]: String(displayQuantity) }))}
                        onChange={(event) => {
                          if (/^\d*\.?\d*$/.test(event.target.value)) {
                            setQuantityDrafts((prev) => ({ ...prev, [product._id]: event.target.value }));
                          }
                        }}
                        onBlur={(event) => {
                          setQuantity(product, convertToBaseQuantity(event.target.value, displayUnit, product.unit));
                          setQuantityDrafts((prev) => {
                            const next = { ...prev };
                            delete next[product._id];
                            return next;
                          });
                        }}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Quantity for ${product.name}`}
                        className="w-14 bg-transparent text-center text-xs font-black outline-none"
                      />
                      <select
                        value={displayUnit}
                        onChange={(event) => {
                          const nextUnit = event.target.value;
                          setSelectedUnits((prev) => ({ ...prev, [product._id]: nextUnit }));
                          setQuantityDrafts((prev) => ({
                            ...prev,
                            [product._id]: String(convertFromBaseQuantity(qty, nextUnit, product.unit))
                          }));
                        }}
                        aria-label={`Unit for ${product.name}`}
                        className="min-w-16 bg-green-700 text-white border border-green-400 rounded-md px-1.5 py-1 text-[10px] font-black outline-none cursor-pointer"
                      >
                        {getQuantityUnitOptions(product.unit).map(({ unit }) => (
                          <option key={unit} value={unit} className="bg-white text-gray-900">{unit}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateQuantity(product, convertToBaseQuantity(1, displayUnit, product.unit))}
                        className="p-2.5 active:bg-green-700 rounded-r-xl transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Floating Customer Mobile Cart Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-green-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer active:scale-98 transition"
          >
            <div>
              <span className="text-[11px] font-medium text-green-200 block">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in cart
              </span>
              <span className="text-base font-black">₹{subTotal}</span>
            </div>
            <button className="px-3.5 py-2 bg-white text-green-800 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-2xs">
              View Cart <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Slide-Over Drawer */}
      <CartDrawer
        store={store}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderPlaced={(newOrder) => setPlacedOrder(newOrder)}
      />

      {/* Customer Past Orders History Modal */}
      <CustomerOrderHistoryModal slug={slug} isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      {/* AI / Voice Order Parsing Modal */}
      <VoiceOrderAssistant slug={slug} isOpen={isAiVoiceOpen} onClose={() => setIsAiVoiceOpen(false)} />
    </div>
  );
};