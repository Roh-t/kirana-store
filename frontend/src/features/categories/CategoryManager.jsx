import React, { useState, useEffect } from 'react';
import { categoryService } from '../../services/categoryService';
import { Tags, Plus, Edit2, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';

export const CategoryManager = ({ storeId, onCategoryChanged }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', sortOrder: 0 });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories(storeId);
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchCategories();
    }
  }, [storeId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingId) {
        await categoryService.updateCategory(storeId, editingId, formData);
      } else {
        await categoryService.createCategory(storeId, formData);
      }
      setShowModal(false);
      setFormData({ name: '', description: '', sortOrder: 0 });
      setEditingId(null);
      await fetchCategories();
      onCategoryChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await categoryService.updateCategory(storeId, cat._id, { isActive: !cat.isActive });
      await fetchCategories();
      onCategoryChanged?.();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDelete = async (catId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(storeId, catId);
        await fetchCategories();
        onCategoryChanged?.();
      } catch (err) {
        console.error('Failed to delete category', err);
      }
    }
  };

  const openEdit = (cat) => {
    setEditingId(cat._id);
    setFormData({ name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder || 0 });
    setShowModal(true);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <Tags className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Categories</h3>
            <p className="text-[11px] text-gray-500">Store Sections</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', sortOrder: categories.length });
            setShowModal(true);
          }}
          className="px-3 py-1.5 bg-green-600 active:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400 font-bold">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="py-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-bold">No categories added</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                cat.isActive ? 'bg-white border-gray-200/80' : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">{cat.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-md">
                    {cat.slug}
                  </span>
                </div>
                {cat.description && <p className="text-[11px] text-gray-500 truncate mt-0.5">{cat.description}</p>}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`p-1.5 rounded-lg border text-xs ${
                    cat.isActive ? 'text-green-700 border-green-200 hover:bg-green-50' : 'text-gray-400 border-gray-200'
                  }`}
                  title={cat.isActive ? 'Hide Category' : 'Show Category'}
                >
                  {cat.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 active:bg-gray-100"
                  title="Edit Category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-1.5 rounded-lg border border-red-200 text-red-600 active:bg-red-50"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm">{editingId ? 'Edit Category' : 'Add New Category'}</h4>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atta & Flours"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh wheat flour, rice flour"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      Save
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