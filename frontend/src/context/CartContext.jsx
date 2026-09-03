import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ slug, children }) => {
  const storageKey = `kf_cart_${slug || 'default'}`;

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [orderType, setOrderType] = useState('PICKUP'); // 'PICKUP' | 'DELIVERY'
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    deliveryAddress: ''
  });
  const [notes, setCustomerNotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart state', e);
    }
  }, [items, storageKey]);

  const updateQuantity = (product, delta) => {
    setItems((prev) => {
      const existing = prev[product._id];
      const currentQty = existing ? existing.quantity : 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[product._id];
        return copy;
      }

      return {
        ...prev,
        [product._id]: {
          product,
          quantity: newQty,
          lineTotal: newQty * product.sellingPrice
        }
      };
    });
  };

  const setQuantity = (product, quantity) => {
    const nextQuantity = Number(quantity);

    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) return;

    setItems((prev) => ({
      ...prev,
      [product._id]: {
        product,
        quantity: nextQuantity,
        lineTotal: nextQuantity * product.sellingPrice
      }
    }));
  };

  const removeFromCart = (productId) => {
    setItems((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const clearCart = () => {
    setItems({});
    localStorage.removeItem(storageKey);
  };

  const itemList = Object.values(items);
  const totalItemsCount = itemList.length;
  const subTotal = itemList.reduce((sum, i) => sum + i.lineTotal, 0);

  return (
    <CartContext.Provider
      value={{
        slug,
        items,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);