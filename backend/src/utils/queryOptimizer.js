export const leanSelect = (query, fields) => {
  if (fields) {
    return query.select(fields).lean();
  }
  return query.lean();
};