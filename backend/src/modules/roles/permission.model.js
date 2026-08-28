import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    module: { type: String, required: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 150 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

permissionSchema.index({ code: 1 });
permissionSchema.index({ module: 1 });

export const Permission = mongoose.model('Permission', permissionSchema);