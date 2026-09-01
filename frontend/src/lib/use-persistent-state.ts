import { useEffect, useState } from "react";

/**
 * useState, lekin qiymati localStorage'da saqlanadi — sahifa yangilansa ham yo'qolmaydi.
 *
 * DIQQAT: bu ilova SSR (server-side render) qiladi — serverda `localStorage` mavjud emas.
 * Shuning uchun boshlang'ich render (server VA klientning birinchi/hydration render'i) doim
 * `initial`dan boshlanadi (ikkalasi bir xil bo'lib, React hydration xatosiga olib kelmaydi);
 * saqlangan qiymat faqat mount bo'lgandan KEYIN (useEffect'da, faqat brauzerda) o'qiladi va
 * kerak bo'lsa holat shu qiymatga yangilanadi.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* localStorage yo'q bo'lishi mumkin (masalan xususiy rejim) */
    }
    // Faqat mount'da bir marta o'qiladi — key o'zgarishi bu hook ishlatilishida kutilmaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* localStorage yo'q bo'lishi mumkin (masalan xususiy rejim) */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
