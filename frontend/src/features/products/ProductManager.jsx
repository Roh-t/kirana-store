import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { adminService } from '../../services/adminService';
import { Package, Plus, Search, Edit2, Trash2, Check, X, Barcode } from 'lucide-react';

export const ProductManager = ({ storeId, catalogVersion = 0 }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [masterSuggestions, setMasterSuggestions] = useState([]);
  const [masterSearch, setMasterSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    regionalName: '',
    categoryId: '',
    unit: 'KG',
    unitQuantity: 1,
    mrp: '',
    sellingPrice: '',
    barcode: '',
    imageUrl: '',
    taxRate: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts(storeId, { search, categoryId: selectedCategory }),
        categoryService.getCategories(storeId)
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      if (masterSearch.trim().length >= 2) {
        const masterRes = await adminService.searchMasterProducts(masterSearch);
        setMasterSuggestions(masterRes.data || []);
      } else {
        setMasterSuggestions([]);
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchData();
    }
  }, [storeId, search, selectedCategory, catalogVersion, masterSearch]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const payload = {
      ...formData,
      mrp: Number(formData.mrp),
      sellingPrice: Number(formData.sellingPrice),
      taxRate: Number(formData.taxRate)
    };

    try {
      if (editingId) {
        await productService.updateProduct(storeId, editingId, payload);
      } else {
        await productService.createProduct(storeId, payload);
      }
      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(storeId, productId);
        fetchData();
      } catch (err) {
        console.error('Failed to delete product', err);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      regionalName: '',
      categoryId: categories[0]?._id || '',
      unit: 'KG',
      unitQuantity: 1,
      mrp: '',
      sellingPrice: '',
      barcode: '',
      imageUrl: '',
      taxRate: 0
    });
  };

  const openEdit = (p) => {
    setEditingId(p._id);
    setFormData({
      name: p.name,
      regionalName: p.regionalName || '',
      categoryId: p.categoryId._id || p.categoryId,
      unit: p.unit,
      unitQuantity: p.unitQuantity,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      barcode: p.barcode || '',
      imageUrl: p.imageUrl || '',
      taxRate: p.taxRate || 0
    });
    setShowModal(true);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Product Catalog</h3>
            <p className="text-[11px] text-gray-500">Items & Selling Prices</p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          disabled={categories.length === 0}
          className="px-3 py-1.5 bg-green-600 active:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>

      {categories.length === 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
          Create at least one category above before adding items.
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl outline-none bg-white font-bold text-gray-700 max-w-32.5"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile Product List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400 font-bold">Loading product catalog...</div>
      ) : products.length === 0 ? (
        <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-bold">No products found in catalog</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {products.map((p) => (
            <div key={p._id} className="p-3 rounded-2xl border border-gray-200/80 bg-white flex items-center justify-between gap-2">
              <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" /> : <Package className="w-5 h-5 text-gray-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">{p.name}</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded-md shrink-0">
                    {p.unitQuantity} {p.unit}
                  </span>
                </div>

                {p.regionalName && <p className="text-xs font-bold text-green-700 truncate">{p.regionalName}</p>}

                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-green-700">₹{p.sellingPrice}</span>
                  {p.mrp > p.sellingPrice && (
                    <span className="text-[10px] text-gray-400 line-through">MRP ₹{p.mrp}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(p)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 active:bg-gray-100"
                  title="Edit Product"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="p-1.5 rounded-lg border border-red-200 text-red-600 active:bg-red-50"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm">{editingId ? 'Edit Item' : 'Add Kirana Item'}</h4>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aashirvaad Shuddh Chakki Atta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Regional Name (Hindi / Local Script)</label>
                <input
                  type="text"
                  placeholder="e.g. आशीर्वाद शुद्ध चक्की आटा"
                  value={formData.regionalName}
                  onChange={(e) => setFormData({ ...formData, regionalName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl outline-none bg-white font-bold"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl outline-none bg-white font-bold text-gray-700"
                  >
                    <option value="KG">KG</option>
                    <option value="GRAM">GRAM</option>
                    <option value="PACKET">PACKET</option>
                    <option value="PIECE">PIECE</option>
                    <option value="LITRE">LITRE</option>
                    <option value="ML">ML</option>
                    <option value="DOZEN">DOZEN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="350"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="320"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-green-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Barcode (Optional)</label>
                <input
                  type="text"
                  placeholder="Scan EAN / UPC code"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Search Shared Product Catalog</label>
                <input
                  type="text"
                  value={masterSearch}
                  onChange={(e) => setMasterSearch(e.target.value)}
                  placeholder="Search product or category, e.g. atta"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
                {masterSearch && masterSuggestions.length > 0 && (
                  <div className="mt-2 space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-2">
                    {masterSuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion._id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            name: suggestion.name,
                            regionalName: suggestion.alias || '',
                            categoryId: categories.find((category) => category.name === suggestion.categoryName)?._id || formData.categoryId,
                            mrp: suggestion.mrp,
                            sellingPrice: suggestion.sellingPrice,
                            imageUrl: suggestion.imageUrl || ''
                          });
                          setMasterSearch(suggestion.name);
                          setMasterSuggestions([]);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white p-1.5 text-left hover:border-green-400"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {suggestion.imageUrl && <img src={suggestion.imageUrl} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-bold text-gray-900">{suggestion.name}</span>
                          <span className="block truncate text-[10px] text-gray-500">
                            {suggestion.categoryName} · ₹{suggestion.sellingPrice}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 active:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};