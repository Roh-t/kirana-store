import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 400 },
    catalogName: { type: String, trim: true, default: null, maxlength: 400 },
    regionalName: { type: String, trim: true, default: null, maxlength: 400 },
    sourceName: { type: String, trim: true, default: null, maxlength: 400 },
    sourceImage: { type: String, trim: true, default: null },
    sourcePrice: { type: Number, default: null, min: 0 },
    sourceOriginalPrice: { type: Number, default: null, min: 0 },
    sourceQuantity: { type: String, trim: true, default: null, maxlength: 100 },
    exactCategory: { type: String, trim: true, default: null, maxlength: 100 },
    subCategory: { type: String, trim: true, default: null, maxlength: 100 },
    sourceCategory: { type: String, trim: true, default: null, maxlength: 150 },
    hindiName: { type: String, trim: true, default: null, maxlength: 400 },
    hinglishName: { type: String, trim: true, default: null, maxlength: 400 },
    indianCategory: { type: String, trim: true, default: null, maxlength: 150 },
    indianSubCategory: { type: String, trim: true, default: null, maxlength: 150 },
    brand: { type: String, trim: true, default: null, maxlength: 50 },
    sku: { type: String, trim: true, uppercase: true, default: null },
    barcode: { type: String, trim: true, default: null },
    unit: {
      type: String,
      enum: ['KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'PACKET', 'DOZEN'],
      required: true
    },
    unitQuantity: { type: Number, required: true, default: 1, min: 0.001 },
    allowPartialSale: { type: Boolean, default: false },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 28 },
    hsnCode: { type: String, trim: true, default: null },
    imageUrl: { type: String, default: null },
    isAvailable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, barcode: 1 }, { sparse: true });
productSchema.index({ storeId: 1, sku: 1 }, { sparse: true });
productSchema.index({ storeId: 1, categoryId: 1, isActive: 1, isAvailable: 1 });
productSchema.index({ name: 'text', catalogName: 'text', regionalName: 'text', brand: 'text' });

export const Product = mongoose.model('Product', productSchema);