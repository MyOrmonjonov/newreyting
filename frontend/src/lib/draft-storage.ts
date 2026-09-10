/**
 * Hali saqlanmagan (backend'ga yuborilmagan) forma qoralamalarini localStorage orqali
 * browser refresh'dan omon qoldirish uchun yordamchi. Saqlangandan yoki modal ataylab
 * yopilgandan keyin clearDraft chaqirilishi kerak — aks holda eski qoralama keyingi
 * safar noto'g'ri qayta tiklanadi.
 */
export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveDraft<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage yo'q yoki to'lgan bo'lishi mumkin — jim o'tkazib yuboriladi.
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // xatoni e'tiborsiz qoldiramiz
  }
}
