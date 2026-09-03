import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { convertFromBaseQuantity, convertToBaseQuantity, getQuantityUnitOptions } from '../../utils/quantityUnits';
import { X, ShoppingBag, Plus, Minus, Trash2, MapPin, Phone, User, Check } from 'lucide-react';

export const CartDrawer = ({ store, isOpen, onClose, onOrderPlaced }) => {
  const {
    slug,
    itemList,
    totalItemsCount,
    subTotal,
    orderType,
    setOrderType,
    customerDetails,
    setCustomerDetails,
    notes,
    setCustomerNotes,
    updateQuantity,
    setQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});

  if (!isOpen) return null;

  const minOrderValue = store?.businessConfig?.minOrderValue || 0;
  const isBelowMin = subTotal < minOrderValue;

  const handleCheckoutValidation = async () => {
    setValidationError(null);

    if (itemList.length === 0) {
      setValidationError('Your cart is empty.');
      return;
    }

    if (isBelowMin) {
      setValidationError(`Minimum order value for this store is ₹${minOrderValue}`);
      return;
    }

    if (!customerDetails.name || customerDetails.name.trim().length < 2) {
      setValidationError('Please enter your full name');
      return;
    }

    const cleanPhone = customerDetails.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setValidationError('Please enter a valid 10-digit Indian mobile number (starts with 6-9)');
      return;
    }

    if (orderType === 'DELIVERY' && (!customerDetails.deliveryAddress || customerDetails.deliveryAddress.trim().length < 5)) {
      setValidationError('Please enter complete delivery address/landmark');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        orderType,
        customerDetails: {
          name: customerDetails.name.trim(),
          phone: `+91${cleanPhone}`,
          deliveryAddress: customerDetails.deliveryAddress || null
        },
        items: itemList.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        notes
      };

      const res = await orderService.createPublicOrder(slug, payload);
      clearCart();
      onClose();
      onOrderPlaced(res.data);
    } catch (err) {
      setValidationError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-700" />
            <h3 className="font-bold text-gray-900 text-base">Your Order Cart</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {totalItemsCount}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              {validationError}
            </div>
          )}

          {itemList.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1">Browse products and add items to your cart.</p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl p-3 bg-white space-y-2">
                {itemList.map(({ product, quantity, lineTotal }) => (
                  (() => {
                    const displayUnit = selectedUnits[product._id] || product.unit;
                    const displayQuantity = convertFromBaseQuantity(quantity, displayUnit, product.unit);

                    return (
                  <div key={product._id} className="pt-2 pb-2 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">{product.name}</h4>
                      <p className="text-[11px] text-gray-500">₹{product.sellingPrice} per {product.unit}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-gray-100 rounded-lg">
                        <button
                          onClick={() => updateQuantity(product, -convertToBaseQuantity(1, displayUnit, product.unit))}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded-l-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
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
                          aria-label={`Quantity for ${product.name}`}
                          className="w-10 bg-transparent text-center text-xs font-bold outline-none appearance-none"
                        />
                        <select
                          value={displayUnit}
                          onChange={(event) => {
                            const nextUnit = event.target.value;
                            setSelectedUnits((prev) => ({ ...prev, [product._id]: nextUnit }));
                            setQuantityDrafts((prev) => ({
                              ...prev,
                              [product._id]: String(convertFromBaseQuantity(quantity, nextUnit, product.unit))
                            }));
                          }}
                          aria-label={`Unit for ${product.name}`}
                          className="bg-white text-green-700 border border-green-200 rounded-md px-1 py-0.5 text-[10px] font-black outline-none cursor-pointer"
                        >
                          {getQuantityUnitOptions(product.unit).map(({ unit }) => (
                            <option key={unit} value={unit} className="bg-white text-gray-900">{unit}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => updateQuantity(product, convertToBaseQuantity(1, displayUnit, product.unit))}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded-r-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-gray-900 w-12 text-right">₹{lineTotal}</span>

                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>

              {/* Order Type Toggle */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">Fulfillment Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('PICKUP')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      orderType === 'PICKUP'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Self Pickup at Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('DELIVERY')}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      orderType === 'DELIVERY'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Home Delivery
                  </button>
                </div>
              </div>

              {/* Customer Info Form */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-800 block">Customer Details</span>

                <div>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Mobile Number (e.g. 9876543210)"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white outline-none"
                    />
                  </div>
                </div>

                {orderType === 'DELIVERY' && (
                  <div>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="House No, Street, Landmark"
                        value={customerDetails.deliveryAddress}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, deliveryAddress: e.target.value })}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    placeholder="Instructions / Notes for Kirana Shopkeeper"
                    value={notes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-xl bg-white outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Summary */}
        {itemList.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subTotal}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1 border-t">
                <span>Grand Total</span>
                <span className="text-green-700">₹{subTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutValidation}
              disabled={submitting}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Placing Order...' : 'Submit Digital Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};