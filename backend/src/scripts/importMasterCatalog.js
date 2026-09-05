import fs from 'node:fs';
import crypto from 'node:crypto';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { MasterCategory } from '../modules/masterCatalog/masterCategory.model.js';
import { MasterProduct } from '../modules/masterCatalog/masterProduct.model.js';

const SOURCE = 'ZEPTO';
const BATCH_SIZE = 500;
const inputPath = process.argv[2];

const requiredHeaders = ['Image', 'Name', 'Price', 'Original Price', 'Alias'];

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

const cleanText = (value) => String(value ?? '').trim();

const parsePrice = (value) => {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const getSourceKey = ({ imageUrl, name, categoryName, sellingPrice, mrp }) => crypto
  .createHash('sha256')
  .update([SOURCE, imageUrl, name.toLowerCase(), categoryName.toLowerCase(), sellingPrice, mrp].join('|'))
  .digest('hex');

const importCatalog = async () => {
  if (!inputPath || !fs.existsSync(inputPath)) {
    throw new Error('Usage: npm run import:master-catalog -- "D:\\grocery_products_final.xlsx"');
  }

  const workbook = xlsx.readFile(inputPath, { cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(firstSheet, { defval: '', raw: true });
  const headers = Object.keys(rows[0] || {});
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  await mongoose.connect(env.mongoUri, { maxPoolSize: 10 });
  console.log(`[MASTER CATALOG] Importing ${rows.length} rows from ${inputPath}`);

  const categoryNames = [...new Set(rows.map((row) => cleanText(row.Alias) || 'Uncategorized'))];
  const categoryOperations = categoryNames.map((name) => ({
    updateOne: {
      filter: { source: SOURCE, slug: slugify(name) },
      update: { $set: { name, isActive: true }, $setOnInsert: { source: SOURCE, slug: slugify(name) } },
      upsert: true
    }
  }));
  await MasterCategory.bulkWrite(categoryOperations, { ordered: false });

  const categories = await MasterCategory.find({ source: SOURCE, slug: { $in: categoryNames.map(slugify) } })
    .select('_id name slug')
    .lean();
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

  let imported = 0;
  let skipped = 0;
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BATCH_SIZE);
    const operations = [];

    for (const row of batch) {
      const imageUrl = cleanText(row.Image);
      const name = cleanText(row.Name);
      const categoryName = cleanText(row.Alias) || 'Uncategorized';
      const sellingPrice = parsePrice(row.Price);
      const mrp = parsePrice(row['Original Price']);
      const category = categoryBySlug.get(slugify(categoryName));

      if (!name || sellingPrice === null || mrp === null || !category) {
        skipped += 1;
        continue;
      }

      const sourceKey = getSourceKey({ imageUrl, name, categoryName, sellingPrice, mrp });
      operations.push({
        updateOne: {
          filter: { sourceKey },
          update: {
            $set: {
              source: SOURCE,
              sourceImageUrl: imageUrl || null,
              imageUrl: imageUrl || null,
              name,
              alias: categoryName,
              categoryId: category._id,
              categoryName,
              sellingPrice,
              mrp,
              isActive: true
            }
          },
          upsert: true
        }
      });
    }

    if (operations.length > 0) {
      await MasterProduct.bulkWrite(operations, { ordered: false });
      imported += operations.length;
    }

    console.log(`[MASTER CATALOG] ${Math.min(offset + batch.length, rows.length)}/${rows.length} rows processed`);
  }

  console.log(`[MASTER CATALOG] Complete. Upserted ${imported} rows; skipped ${skipped} invalid rows.`);
};

try {
  await importCatalog();
} catch (error) {
  console.error(`[MASTER CATALOG] Import failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
