import { PRODUCT_SEARCH_SYNONYMS } from './productSearchSynonyms.js';

const SEARCH_FIELDS = [
  ['name', 12],
  ['hinglishName', 11],
  ['hindiName', 10],
  ['catalogName', 9],
  ['regionalName', 9],
  ['brand', 7],
  ['exactCategory', 5],
  ['subCategory', 4],
  ['sourceCategory', 3],
  ['indianCategory', 3],
  ['indianSubCategory', 3],
  ['categoryName', 3]
];

const normalize = (value) => String(value || '').toLocaleLowerCase().trim();
const tokenize = (value) => normalize(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const levenshtein = (first, second) => {
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= second.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (first[row - 1] === second[column - 1] ? 0 : 1)
      );
    }
    for (let column = 0; column <= second.length; column += 1) previous[column] = current[column];
  }
  return previous[second.length];
};

const allowedDistance = (word) => (word.length <= 3 ? 1 : word.length <= 7 ? 2 : 3);

const scoreToken = (queryToken, fieldTokens) => {
  if (!queryToken || fieldTokens.length === 0) return 0;
  let best = 0;
  for (const fieldToken of fieldTokens) {
    if (fieldToken === queryToken) best = Math.max(best, 100);
    else if (fieldToken.startsWith(queryToken)) best = Math.max(best, 75);
    else if (fieldToken.includes(queryToken)) best = Math.max(best, 55);
    else if (queryToken.length >= 3 && levenshtein(queryToken, fieldToken) <= allowedDistance(queryToken)) {
      best = Math.max(best, 30);
    }
  }
  return best;
};

export const rankProducts = (products, query) => {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return products;

  const expandedTokens = queryTokens.flatMap((token) => [
    { token, weight: 1 },
    ...(PRODUCT_SEARCH_SYNONYMS[token] || []).map((synonym) => ({ token: normalize(synonym), weight: 0.8 }))
  ]);

  return products
    .map((product, index) => {
      const fields = SEARCH_FIELDS.map(([field, weight]) => ({
        tokens: tokenize(field === 'categoryName' ? product.categoryName : product[field]),
        weight
      }));
      const score = expandedTokens.reduce(
        (total, queryPart) => total + Math.max(...fields.map((field) => scoreToken(queryPart.token, field.tokens) * field.weight)) * queryPart.weight,
        0
      );
      return { product, score, index };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score || first.index - second.index)
    .map(({ product }) => product);
};
