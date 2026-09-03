import mongoose from 'mongoose';

const imageLibrarySchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, lowercase: true, maxlength: 100, index: true },
    aliases: [{ type: String, trim: true, lowercase: true, maxlength: 100 }],
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

imageLibrarySchema.index({ label: 'text', aliases: 'text' });

export const ImageLibrary = mongoose.model('ImageLibrary', imageLibrarySchema);
