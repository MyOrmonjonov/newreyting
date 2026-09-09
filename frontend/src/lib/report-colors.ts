// Excel/Word hisobotlarida ishlatiladigan rang kodlari (hex, ARGB emas — har
// eksport helperi kerakli formatga o'zi moslaydi). CSS'dagi oklch ranglarga
// yaqin, lekin Office fayl formatlari oklch'ni tushunmagani uchun hex qilib
// qattiq belgilangan.
export const BRAND = "168DFF";
export const BRAND_SOFT = "E8F3FF";
export const GOLD = "FFC928";
export const GOLD_SOFT = "FFF3CC";
export const SILVER = "C7C9D1";
export const SILVER_SOFT = "F0F1F3";
export const BRONZE = "C97A3D";
export const BRONZE_SOFT = "F3E1D2";
export const WHITE = "FFFFFF";
export const INK = "1A1F2B";
export const BORDER = "D8DEE8";

export const LEAGUE_COLOR: Record<string, string> = {
  diamond: "5AC8E8",
  gold: GOLD,
  silver: SILVER,
  bronze: BRONZE,
  rising: "4ADE80",
};

export function placeRowColor(place: number): string | null {
  if (place === 1) return GOLD_SOFT;
  if (place === 2) return SILVER_SOFT;
  if (place === 3) return BRONZE_SOFT;
  return null;
}
