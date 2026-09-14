const DEVANAGARI_TO_LATIN = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ं': 'n', 'ः': 'h', 'ँ': 'n',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng', 'च': 'ch', 'छ': 'chh',
  'ज': 'j', 'झ': 'jh', 'ञ': 'ny', 'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh',
  'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n', 'प': 'p',
  'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l',
  'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l', 'क्ष': 'ksh',
  'ज्ञ': 'gya', '़': '', '्': '',
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri', 'े': 'e',
  'ै': 'ai', 'ो': 'o', 'ौ': 'au', '्': ''
};

export const transliterateHindi = (value = '') => String(value)
  .replace(/[\u0900-\u097F]/g, (character) => DEVANAGARI_TO_LATIN[character] || character)
  .replace(/\s+/g, ' ')
  .trim();

export const normalizeSearchText = (value = '') => String(value)
  .normalize('NFKC')
  .toLocaleLowerCase('hi-IN')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

export const createSearchAliases = (...values) => [...new Set(values
  .filter((value) => value !== null && value !== undefined && String(value).trim())
  .flatMap((value) => [String(value), transliterateHindi(value)])
  .map(normalizeSearchText)
  .filter(Boolean))].join(' ');
