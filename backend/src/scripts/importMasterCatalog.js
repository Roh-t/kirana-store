import fs from 'node:fs';
import crypto from 'node:crypto';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { MasterCategory } from '../modules/masterCatalog/masterCategory.model.js';
import { MasterProduct } from '../modules/masterCatalog/masterProduct.model.js';
import { createSearchAliases } from '../utils/indianSearch.js';

const SOURCE = 'INDIAN_GROCERY';
const BATCH_SIZE = 500;
const inputPath = process.argv[2];
const requiredHeaders = [
  'Image', 'Name', 'Price', 'Original Price', 'Quantity', 'Sub-Category',
  'Category', 'Hindi Name', 'Hinglish Name', 'Indian Category', 'Indian Sub-Category'
];

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^\p{L}\p{N}\s-]/gu, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const cleanText = (value) => String(value ?? '').trim();

const parsePrice = (value) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseQuantity = (value) => {
  const match = String(value ?? '').trim().match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|g|gm|gram|grams|l|litre|litres|liter|liters|ml|millilitre|millilitres|piece|pieces|pc|pcs|packet|packets|pack|dozen|dozens)$/i);
  if (!match) return { unitQuantity: 1, unit: 'PIECE' };

  const unit = match[2].toLowerCase();
  const unitMap = {
    kg: 'KG', kgs: 'KG', kilogram: 'KG', kilograms: 'KG',
    g: 'GRAM', gm: 'GRAM', gram: 'GRAM', grams: 'GRAM',
    l: 'LITRE', litre: 'LITRE', litres: 'LITRE', liter: 'LITRE', liters: 'LITRE',
    ml: 'ML', millilitre: 'ML', millilitres: 'ML',
    piece: 'PIECE', pieces: 'PIECE', pc: 'PIECE', pcs: 'PIECE',
    packet: 'PACKET', packets: 'PACKET', pack: 'PACKET', packs: 'PACKET',
    dozen: 'DOZEN', dozens: 'DOZEN'
  };
  return { unitQuantity: Number(match[1]), unit: unitMap[unit] || 'PIECE' };
};

const getSourceKey = (row, index) => crypto
  .createHash('sha256')
  .update([SOURCE, row.Image, row.Name, row['Hinglish Name'], row['Indian Sub-Category'], row.Quantity, row.Price, index].join('|'))
  .digest('hex');

const importCatalog = async () => {
  if (!inputPath || !fs.existsSync(inputPath)) {
    throw new Error('Usage: npm run import:master-catalog -- "D:\\Indian_Grocery_Database_Final.xlsx"');
  }

  const workbook = xlsx.readFile(inputPath, { cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(firstSheet, { defval: '', raw: true });
  const headers = Object.keys(rows[0] || {});
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const validRows = rows.filter((row) => cleanText(row['Hinglish Name'] || row.Name)
    && cleanText(row['Indian Sub-Category'])
    && parsePrice(row.Price) !== null
    && parsePrice(row['Original Price']) !== null);
  if (validRows.length === 0) throw new Error('No valid grocery rows found in the workbook');

  await mongoose.connect(env.mongoUri, { maxPoolSize: 10 });
  console.log(`[MASTER CATALOG] Replacing catalog with ${validRows.length} rows from ${inputPath}`);

  // This is a full replacement import by design; it removes the previous 16K catalog.
  await MasterProduct.deleteMany({});
  await MasterCategory.deleteMany({});

  const categoryNames = [...new Set(validRows.map((row) => cleanText(row['Indian Sub-Category'])))]
    .filter(Boolean);
  await MasterCategory.bulkWrite(categoryNames.map((name) => ({
    updateOne: {
      filter: { source: SOURCE, slug: slugify(name) },
      update: { $set: { name, isActive: true }, $setOnInsert: { source: SOURCE, slug: slugify(name) } },
      upsert: true
    }
  })), { ordered: false });

  const categories = await MasterCategory.find({ source: SOURCE })
    .select('_id name slug')
    .lean();
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  let imported = 0;
  let skipped = rows.length - validRows.length;
  for (let offset = 0; offset < validRows.length; offset += BATCH_SIZE) {
    const batch = validRows.slice(offset, offset + BATCH_SIZE);
    const operations = batch.map((row, batchIndex) => {
      const imageUrl = cleanText(row.Image);
      const catalogName = cleanText(row.Name);
      const hinglishName = cleanText(row['Hinglish Name']) || catalogName;
      const hindiName = cleanText(row['Hindi Name']);
      const categoryName = cleanText(row['Indian Sub-Category']);
      const category = categoryBySlug.get(slugify(categoryName));
      const { unit, unitQuantity } = parseQuantity(row.Quantity);
      const sellingPrice = parsePrice(row.Price);
      const mrp = parsePrice(row['Original Price']);
      const searchText = createSearchAliases(
        hinglishName, catalogName, hindiName, categoryName, row['Indian Category'], row['Category'], row['Sub-Category']
      );

      return {
        updateOne: {
          filter: { sourceKey: getSourceKey(row, offset + batchIndex) },
          update: {
            $set: {
              source: SOURCE,
              sourceImageUrl: imageUrl || null,
              imageUrl: imageUrl || null,
              name: hinglishName,
              catalogName,
              hindiName: hindiName || null,
              hinglishName,
              alias: hindiName || null,
              categoryId: category._id,
              categoryName,
              indianCategory: cleanText(row['Indian Category']) || null,
              indianSubCategory: categoryName,
              searchText,
              unit,
              unitQuantity,
              sellingPrice,
              mrp,
              isActive: true
            }
          },
          upsert: true
        }
      };
    });

    await MasterProduct.bulkWrite(operations, { ordered: false });
    imported += operations.length;
    console.log(`[MASTER CATALOG] ${Math.min(offset + batch.length, validRows.length)}/${validRows.length} rows processed`);
  }

  console.log(`[MASTER CATALOG] Complete. Imported ${imported} rows; skipped ${skipped} invalid rows.`);
};

try {
  await importCatalog();
} catch (error) {
  console.error(`[MASTER CATALOG] Import failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
