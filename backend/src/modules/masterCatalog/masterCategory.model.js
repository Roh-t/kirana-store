import mongoose from 'mongoose';

const masterCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    source: { type: String, default: 'ZEPTO', index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

masterCategorySchema.index({ source: 1, slug: 1 }, { unique: true });

export const MasterCategory = mongoose.model('MasterCategory', masterCategorySchema);
