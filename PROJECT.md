# newreyting — loyiha holati

## Loyiha nima
MICCO uchun xodimlar reytingi (leaderboard) sayti — ishchi, menejer va supervayzer
darajalari bo'yicha filiallar/xodimlarni "league" (diamond/gold/silver/bronze/rising)
tizimida ko'rsatuvchi gamifikatsiya qilingan reyting platformasi.

## Tuzilma
- **Backend**: `src/` — Spring Boot 4.1.1 (Java 17), hozircha bo'sh skelet
  (faqat `NewreytingApplication.java`, hali endpoint/DB yo'q).
- **Frontend**: `frontend/` — TanStack Start (React) + Tailwind v4 + Radix UI,
  Lovable orqali generatsiya qilingan (`.lovable/project.json`).
  - Route'lar: `index`, `jamoa` (jamoa), `mahsulotlar`, `operator`,
    `reyting.ishchi`, `reyting.menejer`, `reyting.supervayzer`, `audit`, `fon-test`.
  - `src/lib/micco-data.ts` — hozircha statik demo ma'lumotlar (prezentatsiya uchun).
  - Fon/rasm bilan ishlash uchun TensorFlow.js background-removal (`bg-removal.ts`,
    `mediapipe-selfie-segmentation-stub.ts`) bor.

## Holat (2026-08-28)
- Loyihada git repo yo'q edi — GitHub'ga birinchi marta yuklandi.
- Lovable'da qayerga bog'langani/live link haqida ma'lumot topilmadi shu sessiyada.
- Backend hali funksional emas (frontend statik demo ma'lumot bilan ishlayapti).

## Keyingi qadamlar (taxminiy)
- [ ] Backend'da real API (xodimlar, filiallar, reyting hisoblash) qo'shish.
- [ ] Frontend'ni statik `micco-data.ts` o'rniga backend API'ga ulash.
- [ ] Deploy qilish va doimiy link olish (Lovable / boshqa hosting).
