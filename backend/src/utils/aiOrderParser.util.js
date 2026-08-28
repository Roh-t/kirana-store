export class AiOrderParserUtil {
  static extractQuantity(line) {
    const match = line.match(/(\d+(?:\.\d+)?)\s*(kg|g|gram|litre|ml|packet|piece|pack|kg|doz)?/i);
    if (match) {
      return {
        qty: parseFloat(match[1]),
        unit: match[2] ? match[2].toUpperCase() : null
      };
    }
    return { qty: 1, unit: null };
  }

  static parseTextToListItems(rawText, products) {
    const lines = rawText
      .split(/,|\n|aur|and/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const matchedItems = [];
    const unmatchedNotes = [];

    for (const line of lines) {
      const { qty } = this.extractQuantity(line);

      // Search for best product match in store catalog
      const cleanLine = line.replace(/\d+(?:\.\d+)?/g, '').trim().toLowerCase();

      const matchedProduct = products.find((p) => {
        const pName = p.name.toLowerCase();
        const rName = (p.regionalName || '').toLowerCase();
        return cleanLine.includes(pName) || pName.includes(cleanLine) || (rName && cleanLine.includes(rName));
      });

      if (matchedProduct) {
        matchedItems.push({
          product: matchedProduct,
          quantity: qty,
          lineTotal: qty * matchedProduct.sellingPrice
        });
      } else if (cleanLine.length > 1) {
        unmatchedNotes.push(line);
      }
    }

    return {
      matchedItems,
      unmatchedNotes
    };
  }
}