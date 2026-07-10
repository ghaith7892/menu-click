export interface CurrencyOption {
  code: string;
  symbol: string;
  label_ar: string;
  label_en: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "SAR", symbol: "ر.س", label_ar: "ريال سعودي", label_en: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", label_ar: "درهم إماراتي", label_en: "UAE Dirham" },
  { code: "SYP", symbol: "ل.س", label_ar: "ليرة سورية", label_en: "Syrian Pound" },
];

export const DEFAULT_CURRENCY = "SAR";

export function getCurrencySymbol(code?: string | null): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? CURRENCIES[0].symbol;
}
