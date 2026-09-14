import mongoose from 'mongoose';

const masterProductSchema = new mongoose.Schema(
  {
    sourceKey: { type: String, required: true, unique: true, index: true },
    source: { type: String, default: 'ZEPTO', index: true },
    sourceImageUrl: { type: String, trim: true, default: null },
    imageUrl: { type: String, trim: true, default: null },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    catalogName: { type: String, trim: true, default: null, maxlength: 250 },
    hindiName: { type: String, trim: true, default: null, maxlength: 250 },
    hinglishName: { type: String, trim: true, default: null, maxlength: 200 },
    alias: { type: String, trim: true, default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterCategory', required: true, index: true },
    categoryName: { type: String, required: true, trim: true },
    indianCategory: { type: String, trim: true, default: null },
    indianSubCategory: { type: String, trim: true, default: null },
    searchText: { type: String, trim: true, default: '', index: true },
    unit: { type: String, enum: ['KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'PACKET', 'DOZEN'], default: 'KG' },
    unitQuantity: { type: Number, min: 0.001, default: 1 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

masterProductSchema.index({
  name: 'text',
  catalogName: 'text',
  hindiName: 'text',
  hinglishName: 'text',
  alias: 'text',
  categoryName: 'text',
  searchText: 'text'
});
masterProductSchema.index({ categoryId: 1, name: 1 });

export const MasterProduct = mongoose.model('MasterProduct', masterProductSchema);
