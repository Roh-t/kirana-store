const unitConversions = {
  KG: [{ unit: 'KG', factor: 1 }, { unit: 'GRAM', factor: 0.001 }],
  GRAM: [{ unit: 'GRAM', factor: 1 }, { unit: 'KG', factor: 1000 }],
  LITRE: [{ unit: 'LITRE', factor: 1 }, { unit: 'ML', factor: 0.001 }],
  ML: [{ unit: 'ML', factor: 1 }, { unit: 'LITRE', factor: 1000 }],
  DOZEN: [{ unit: 'DOZEN', factor: 1 }, { unit: 'PIECE', factor: 1 / 12 }],
  PIECE: [{ unit: 'PIECE', factor: 1 }, { unit: 'DOZEN', factor: 12 }],
  PACKET: [{ unit: 'PACKET', factor: 1 }]
};

export const getQuantityUnitOptions = (baseUnit) => unitConversions[baseUnit] || [{ unit: baseUnit, factor: 1 }];

export const convertToBaseQuantity = (quantity, displayUnit, baseUnit) => {
  const option = getQuantityUnitOptions(baseUnit).find(({ unit }) => unit === displayUnit);
  return Number(quantity) * (option?.factor || 1);
};

export const convertFromBaseQuantity = (quantity, displayUnit, baseUnit) => {
  const option = getQuantityUnitOptions(baseUnit).find(({ unit }) => unit === displayUnit);
  return Number(quantity) / (option?.factor || 1);
};
