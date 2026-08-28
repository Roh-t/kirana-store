import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    regionalName: { type: String, trim: true, default: null },
    brand: { type: String, trim: true, default: null, maxlength: 50 },
    sku: { type: String, trim: true, uppercase: true, default: null },
    barcode: { type: String, trim: true, default: null },
    unit: {
      type: String,
      enum: ['KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'PACKET', 'DOZEN'],
      required: true
    },
    unitQuantity: { type: Number, required: true, default: 1, min: 0.001 },
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
productSchema.index({ name: 'text', regionalName: 'text', brand: 'text' });

export const Product = mongoose.model('Product', productSchema);