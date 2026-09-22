import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { Tags, Check, X, FileSpreadsheet, Download, Upload, ChevronDown, CheckCircle2, ExternalLink } from 'lucide-react';

const ITEM_LIBRARY_URL = 'https://kirana-link.onrender.com/';
const IMPORT_COLUMNS = [
  'Image',
  'Name',
  'Exact Category',
  'Price',
  'Original Price',
  'Quantity',
  'Sub-Category',
  'Category',
  'Hindi Name',
  'Hinglish Name',
  'Indian Category',
  'Indian Sub-Category'
];

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
    const productsSheet = XLSX.utils.json_to_sheet([
      {
        Image: '',
        Name: 'Aashirvaad Atta - Superior MP Whole Wheat',
        'Exact Category': 'Atta & Flour',
        Price: 320,
        'Original Price': 350,
        Quantity: '5 kg',
        'Sub-Category': 'Atta',
        Category: 'Atta, Rice, Oil & Dals',
        'Hindi Name': 'Aashirvaad गेहूं का आटा',
        'Hinglish Name': 'Aashirvaad atta MP gehu',
        'Indian Category': 'Atta, Rice & Dal',
        'Indian Sub-Category': 'आटा'
      }
    ]);
    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Clean Database');
    XLSX.writeFile(workbook, 'products-template.xlsx');
  };

  const parseImportPrice = (rawValue) => {
    if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null;
    const normalized = String(rawValue ?? '').replace(/[^0-9.-]/g, '');
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeImportProduct = (row) => {
    const quantityText = String(row.Quantity ?? '').trim();
    const quantityMatch = quantityText.match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|g|gm|gram|grams|l|litre|litres|liter|liters|ml|millilitre|millilitres|piece|pieces|pc|pcs|packet|packets|pack|combo|combos|set|sets|dozen|dozens|tablet|tablets)?/i);
    const quantityUnit = quantityMatch?.[2]?.toLowerCase();
    const unitMap = {
      kg: 'KG', kgs: 'KG', kilogram: 'KG', kilograms: 'KG',
      g: 'GRAM', gm: 'GRAM', gram: 'GRAM', grams: 'GRAM',
      l: 'LITRE', litre: 'LITRE', litres: 'LITRE', liter: 'LITRE', liters: 'LITRE',
      ml: 'ML', millilitre: 'ML', millilitres: 'ML',
      piece: 'PIECE', pieces: 'PIECE', pc: 'PIECE', pcs: 'PIECE',
      packet: 'PACKET', packets: 'PACKET', pack: 'PACKET', combo: 'PACKET', combos: 'PACKET',
      set: 'PACKET', sets: 'PACKET', tablet: 'PIECE', tablets: 'PIECE',
      dozen: 'DOZEN', dozens: 'DOZEN'
    };

    return {
      name: String(row['Hinglish Name'] || row.Name || '').trim(),
      catalogName: String(row.Name || '').trim(),
      regionalName: String(row['Hindi Name'] || '').trim(),
      categoryName: String(row['Exact Category'] || '').trim(),
      sourceName: String(row.Name || '').trim(),
      sourceImage: String(row.Image || '').trim(),
      sourcePrice: row.Price,
      sourceOriginalPrice: row['Original Price'],
      sourceQuantity: quantityText,
      exactCategory: String(row['Exact Category'] || '').trim(),
      subCategory: String(row['Sub-Category'] || '').trim(),
      sourceCategory: String(row.Category || '').trim(),
      hindiName: String(row['Hindi Name'] || '').trim(),
      hinglishName: String(row['Hinglish Name'] || '').trim(),
      indianCategory: String(row['Indian Category'] || '').trim(),
      indianSubCategory: String(row['Indian Sub-Category'] || '').trim(),
      unit: unitMap[quantityUnit] || 'PIECE',
      unitQuantity: quantityMatch ? Number(quantityMatch[1]) : 1,
      mrp: parseImportPrice(row['Original Price']) ?? parseImportPrice(row.Price),
      sellingPrice: parseImportPrice(row.Price),
      imageUrl: String(row.Image || '').trim(),
      taxRate: 0
    };
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('The workbook must contain at least one worksheet.');
      }

      const sheet = workbook.Sheets[sheetName];
      const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, blankrows: false })[0] || [];
      const hasExactColumns = IMPORT_COLUMNS.length === headerRow.length
        && IMPORT_COLUMNS.every((column, index) => headerRow[index] === column);
      if (!hasExactColumns) {
        throw new Error(`Use the products column format. Required columns: ${IMPORT_COLUMNS.join(', ')}`);
      }

      const rawProducts = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const nextData = {
        categories: [],
        products: rawProducts.map(normalizeImportProduct)
      };
      const categoryNames = [...new Set(nextData.products.map((product) => product.categoryName).filter(Boolean))];
      nextData.categories = categoryNames.map((name, sortOrder) => ({ name, sortOrder }));
      if (nextData.products.length === 0) {
        throw new Error('Add product rows to the worksheet before uploading.');
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
      setImportResult(res.data);
    } catch (err) {
      const rawDetails = err.details;
      const detailItems = Array.isArray(rawDetails)
        ? rawDetails
        : rawDetails && typeof rawDetails === 'object'
          ? Object.entries(rawDetails).map(([field, detail]) => ({
            message: `${field}: ${typeof detail === 'string' ? detail : detail?.message || JSON.stringify(detail)}`
          }))
          : [];
      const details = detailItems
        .map((detail) => detail?.reason || detail?.message || String(detail))
        .filter(Boolean)
        .join('; ');
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
          <a
            href={ITEM_LIBRARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-green-600 active:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Browse Item Library
          </a>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400 font-bold">Loading categories...</div>
      ) : (
        <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4 text-center">
          <strong className="block text-3xl font-black text-green-800">{categories.length}</strong>
          <span className="text-xs font-bold text-green-900">
            {categories.length === 1 ? 'category' : 'categories'} in your catalog
          </span>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Import Catalog Items</h4>
                <p className="text-xs text-gray-500 mt-0.5">Use the products format for your complete store catalog.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-green-50 border border-green-100 p-3 space-y-2">
              <p className="text-xs text-green-900 font-semibold">Any Excel filename and worksheet name is accepted. Keep the required columns in order.</p>
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
                  <span className="text-[11px] text-gray-500 font-semibold">Categories detected</span>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                  <strong className="block text-lg text-gray-900">{importData.products.length}</strong>
                  <span className="text-[11px] text-gray-500 font-semibold">Products ready</span>
                </div>
              </div>
            )}

            {isImporting && (
              <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-800 text-xs rounded-xl font-medium">
                Large catalog import is processing. Please keep this window open; 33,000 products can take a few minutes.
              </div>
            )}
            {importError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{importError}</div>}
            {importResult && (
              <div className="bg-green-50 border border-green-200 text-green-900 rounded-xl text-xs">
                <div className="flex items-start gap-2.5 p-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-green-900">Import completed</p>
                    <p className="mt-0.5 text-green-800">
                      {importResult.productsCreated} products added successfully.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-200/70 px-2 py-1 text-[10px] font-extrabold">
                    {importResult.skippedRows.length} skipped
                  </span>
                </div>
                {importResult.skippedRows.length > 0 && <details className="group border-t border-green-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 font-bold text-green-800">
                    <span>View skipped rows</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto border-t border-green-200/70 px-3 py-2.5">
                    {importResult.skippedRows.map((item) => (
                      <div key={item.row} className="flex gap-2 leading-4">
                        <strong className="shrink-0">Row {item.row}</strong>
                        <span>{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </details>}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              {importResult ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Done
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">Cancel</button>
                  <button type="button" onClick={handleBulkImport} disabled={!importFile || isImporting} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 disabled:opacity-50">
                    {isImporting ? 'Importing...' : <><Upload className="w-3.5 h-3.5" /> Import Catalog</>}
                  </button>
                </>
              )}
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