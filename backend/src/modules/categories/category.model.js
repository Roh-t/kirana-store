import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: null, maxlength: 200 },
    imageUrl: { type: String, default: null },
    sortOrder: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

categorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
categorySchema.index({ storeId: 1, isActive: 1, sortOrder: 1 });

export const Category = mongoose.model('Category', categorySchema);