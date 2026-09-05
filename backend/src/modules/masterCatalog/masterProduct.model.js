import mongoose from 'mongoose';

const masterProductSchema = new mongoose.Schema(
  {
    sourceKey: { type: String, required: true, unique: true, index: true },
    source: { type: String, default: 'ZEPTO', index: true },
    sourceImageUrl: { type: String, trim: true, default: null },
    imageUrl: { type: String, trim: true, default: null },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    alias: { type: String, trim: true, default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterCategory', required: true, index: true },
    categoryName: { type: String, required: true, trim: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

masterProductSchema.index({ name: 'text', alias: 'text', categoryName: 'text' });
masterProductSchema.index({ categoryId: 1, name: 1 });

export const MasterProduct = mongoose.model('MasterProduct', masterProductSchema);
