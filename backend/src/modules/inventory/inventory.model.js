import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
    stockQuantity: { type: Number, required: true, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    reorderPoint: { type: Number, default: 5, min: 0 },
    trackInventory: { type: Boolean, default: true },
    lastRestockedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

inventorySchema.index({ storeId: 1, stockQuantity: 1 });

export const Inventory = mongoose.model('Inventory', inventorySchema);