// Native <input type="date"> ko'rinishi brauzer/OS tiliga qarab o'zgaradi (ba'zi
// foydalanuvchida mm/dd/yyyy, ba'zisida dd/mm/yyyy chiqadi) — shu sabab bir xil
// ma'lumot turli odamlarga turlicha ko'rinadi. Bu komponent ko'rinishni doim
// qk/oo/yyyy qilib ko'rsatadi, forma esa ichkarida ISO (yyyy-mm-dd) saqlaydi.

function isoToDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

function displayToIso(display: string): string {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, d, mo, y] = m;
  const day = Number(d);
  const month = Number(mo);
  const year = Number(y);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const check = new Date(year, month - 1, day);
  if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return "";
  return `${y}-${mo}-${d}`;
}

function formatAsYouType(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}

export function DateFieldDDMMYYYY({
  value,
  onChange,
  required,
  className = "field",
}: {
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  className?: string;
}) {
  // value ISO (yyyy-mm-dd) bo'lsa ko'rsatish uchun aylantiriladi; hali to'liq
  // kiritilmagan oraliq matn (masalan "12/0") bo'lsa o'zi ko'rsatiladi.
  const displayValue = isoToDisplay(value) || value;

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="kk/oo/yyyy"
      className={className}
      value={displayValue}
      required={required}
      onChange={(e) => {
        const formatted = formatAsYouType(e.target.value);
        const iso = displayToIso(formatted);
        onChange(iso || formatted);
      }}
    />
  );
}

export { isoToDisplay as formatDateDDMMYYYY };
