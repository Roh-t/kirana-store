import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { Tags, Plus, Edit2, Trash2, Eye, EyeOff, Check, X, FileSpreadsheet, Download, Upload } from 'lucide-react';

export const CategoryManager = ({ storeId, onCategoryChanged }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', sortOrder: 0 });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState({ categories: [], products: [] });
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);

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

  const downloadImportTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const categoriesSheet = XLSX.utils.json_to_sheet([
      { name: 'Atta & Flour', description: 'Flour and grains', sortOrder: 1 }
    ]);
    const productsSheet = XLSX.utils.json_to_sheet([
      {
        name: 'Aashirvaad Atta',
        regionalName: '',
        categoryName: 'Atta & Flour',
        unit: 'KG',
        unitQuantity: 5,
        mrp: 350,
        sellingPrice: 320,
        purchasePrice: 300,
        taxRate: 5,
        barcode: '',
        sku: '',
        brand: '',
        imageUrl: ''
      }
    ]);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
    XLSX.writeFile(workbook, 'kirana-catalog-template.xlsx');
  };

  const parseImportPrice = (rawValue) => {
    if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null;
    const normalized = String(rawValue ?? '').replace(/[^0-9.-]/g, '');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeImportProduct = (row) => {
    const value = (...keys) => {
      const key = Object.keys(row).find((candidate) => keys.some((name) => candidate.toLowerCase().trim() === name.toLowerCase()));
      return key ? row[key] : '';
    };
    const quantityText = String(value('Quantity', 'Pack Size', 'Unit Quantity')).trim();
    const quantityMatch = quantityText.match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|g|gm|gram|grams|l|litre|litres|liter|liters|ml|millilitre|millilitres|piece|pieces|pc|pcs|packet|packets|pack|dozen|dozens)?$/i);
    const quantityUnit = quantityMatch?.[2]?.toLowerCase();
    const unitMap = {
      kg: 'KG', kgs: 'KG', kilogram: 'KG', kilograms: 'KG',
      g: 'GRAM', gm: 'GRAM', gram: 'GRAM', grams: 'GRAM',
      l: 'LITRE', litre: 'LITRE', litres: 'LITRE', liter: 'LITRE', liters: 'LITRE',
      ml: 'ML', millilitre: 'ML', millilitres: 'ML',
      piece: 'PIECE', pieces: 'PIECE', pc: 'PIECE', pcs: 'PIECE',
      packet: 'PACKET', packets: 'PACKET', pack: 'PACKET',
      dozen: 'DOZEN', dozens: 'DOZEN'
    };

    return {
      name: String(value('Name', 'Product Name')).trim(),
      regionalName: String(value('Regional Name', 'RegionalName')).trim(),
      categoryName: String(value('Category Name', 'CategoryName', 'Category', 'Alias')).trim(),
      unit: unitMap[quantityUnit] || 'PIECE',
      unitQuantity: quantityMatch ? Number(quantityMatch[1]) : 1,
      mrp: parseImportPrice(value('Original Price', 'MRP')),
      sellingPrice: parseImportPrice(value('Price', 'Selling Price')),
      barcode: String(value('Barcode', 'EAN', 'UPC')).trim(),
      imageUrl: String(value('Image', 'Image URL', 'ImageUrl')).trim(),
      taxRate: value('Tax Rate', 'TaxRate') || 0
    };
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const readSheet = (name) => {
        const sheetName = workbook.SheetNames.find((item) => item.toLowerCase() === name.toLowerCase());
        return sheetName ? XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }) : [];
      };
      const productsSheet = workbook.SheetNames.find((item) => item.toLowerCase() === 'products') || workbook.SheetNames[0];
      const rawProducts = productsSheet
        ? XLSX.utils.sheet_to_json(workbook.Sheets[productsSheet], { defval: '' })
        : [];
      const nextData = {
        categories: readSheet('Categories'),
        products: rawProducts.map(normalizeImportProduct)
      };
      if (nextData.categories.length === 0 && nextData.products.length === 0) {
        throw new Error('Add rows to the Categories or Products sheet before uploading.');
      }
      setImportFile(file);
      setImportData(nextData);
      setImportError(null);
    } catch (err) {
      setImportFile(null);
      setImportData({ categories: [], products: [] });
      setImportError(err.message || 'Could not read this Excel file');
    }
  };

  const handleBulkImport = async () => {
    if (!importFile || isImporting) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const res = await productService.importCatalog(storeId, importData);
      setImportFile(null);
      setImportData({ categories: [], products: [] });
      await fetchCategories();
      onCategoryChanged?.();
      if (res.data.skippedRows?.length) {
        setImportResult(res.data);
      } else {
        setShowImportModal(false);
        window.alert(`Imported ${res.data.categoriesCreated} categories and ${res.data.productsCreated} products.`);
      }
    } catch (err) {
      const details = err.details?.map((detail) => detail.reason || detail.message).join('; ');
      setImportError(details ? `${err.message}: ${details}` : err.message || 'Import failed. No products were added.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <Tags className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Categories</h3>
            <p className="text-[11px] text-gray-500">Store Sections</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => {
              setImportError(null);
              setImportResult(null);
              setShowImportModal(true);
            }}
            className="px-2.5 py-1.5 border border-green-200 text-green-700 bg-green-50 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Import Excel
          </button>
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

      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Import Categories & Products</h4>
                <p className="text-xs text-gray-500 mt-0.5">One workbook for your complete store catalog.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-green-50 border border-green-100 p-3 space-y-2">
              <p className="text-xs text-green-900 font-semibold">Use the template so column names stay correct.</p>
              <button type="button" onClick={downloadImportTemplate} className="text-xs font-bold text-green-700 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download Excel template
              </button>
            </div>

            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl p-5 cursor-pointer hover:border-green-400 hover:bg-green-50/40">
              <Upload className="w-5 h-5 text-green-600" />
              <span className="text-xs font-bold text-gray-700">{importFile ? importFile.name : 'Choose completed .xlsx file'}</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleImportFile} className="hidden" />
            </label>

            {importFile && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                  <strong className="block text-lg text-gray-900">{importData.categories.length}</strong>
                  <span className="text-[11px] text-gray-500 font-semibold">Categories ready</span>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                  <strong className="block text-lg text-gray-900">{importData.products.length}</strong>
                  <span className="text-[11px] text-gray-500 font-semibold">Products ready</span>
                </div>
              </div>
            )}

            {importError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{importError}</div>}
            {importResult && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1.5">
                <p className="font-bold">
                  Imported {importResult.productsCreated} products. Skipped {importResult.skippedRows.length} row(s).
                </p>
                {importResult.skippedRows.map((item) => (
                  <p key={item.row}><strong>Excel row {item.row}:</strong> {item.reason}</p>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">Cancel</button>
              <button type="button" onClick={handleBulkImport} disabled={!importFile || isImporting} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 disabled:opacity-50">
                {isImporting ? 'Importing...' : <><Upload className="w-3.5 h-3.5" /> Import Catalog</>}
              </button>
            </div>
          </div>
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