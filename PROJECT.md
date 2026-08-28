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
- Loyihada git repo yo'q edi — GitHub'ga birinchi marta yuklandi: https://github.com/MyOrmonjonov/newreyting
- Lovable'da qayerga bog'langani/live link haqida ma'lumot topilmadi shu sessiyada.
- Backend hali funksional emas (frontend statik demo ma'lumot bilan ishlayapti).
- Frontend dev server lokal ishga tushirildi: `cd frontend && npm run dev` → http://localhost:5173
- Yangi bo'lim qo'shildi: **Operatorlar** (`/operatorlar`) — alohida ro'yxat + "Operator qo'shish"
  formasi (Ismi/Familiyasi/Login/Parol). "Ishchilarni kiritish" (`/operator`) bo'limi o'zgartirilmadi.
- Bosh dashboard'ga **"Supervayzerlar reytingi — oylik ball"** jadvali qo'shildi (yillik statistika
  grafigidan pastda): har oy supervayzerlar umumiy ko'rsatgichi (%) bo'yicha saralanadi va mezonga
  ko'ra ball beriladi (1-o'rin=24, 2=22, 3=20, 4-22=har biriga -1, 22-o'rin=1) — bu mezon
  `micco-data.ts`dagi `pointsForPlace()` funksiyasida allaqachon mavjud edi, endi
  `buildSupervisorScoreboard()` shu funksiyadan foydalanib real oylik % asosida haqiqiy o'rinlarni
  hisoblab, jadval sifatida chiqaradi. Hozircha ma'lumot demo (statik/seeded random) — backend
  ulanganda shu joyga real API javobi qo'yiladi.

- **Ochiq (login talab qilmaydigan) reyting sahifalari** endi alohida qobiqqa ega:
  `frontend/src/components/PublicShell.tsx` — admin sidebar'siz, faqat MICCO logotipi,
  uchta tab (`Ishchi / Supervayzer / Menejer reytingi`) va **"Avto rejim"** tugmasi bor.
  Avto rejim yoqilsa, sahifa har 12 soniyada uchta reyting orasida o'zi almashtirib turadi
  (ofis TV/monitor ekrani uchun) — holat `localStorage`da saqlanadi. `reyting.ishchi.tsx`,
  `reyting.menejer.tsx`, `reyting.supervayzer.tsx` endi `AppShell` emas, `PublicShell`
  ichida ishlaydi.

- **Ishchi reytingi'ga bosib to'liq ma'lumot ko'rish** — `/reyting/ishchi` sahifasida
  har bir qatorga (yoki 1-o'rin kartasiga) bosilganda pastdan chiqadigan panel (mobil) /
  markazdagi modal (desktop) ochiladi: rasm, ism-familiya, reyting ball, bugun/kecha,
  foizi, nechta kubok (chempionat g'olibliklari) va necha yildan beri ishlashi. Bu
  `micco-data.ts`dagi `Agent` tipiga qo'shilgan `trophies`/`yearsActive` maydonlaridan
  foydalanadi (hozircha demo/tasodifiy qiymat). Modal `createPortal` orqali
  `document.body`ga chiqariladi (aks holda `PublicShell`dagi animatsiya transformi
  `position: fixed`ni buzib qo'yardi).
- **Telefon (mobil) ko'rinishi yaxshilandi**: barcha reyting sahifalarida (`ishchi`,
  `supervayzer`, `menejer`) qatorlar mobilda kichikroq shrift/o'lcham bilan chiqadi,
  ism-familiya endi kesilib ketmaydi; `PublicShell` tab-navigatsiyasi va liga tanlagichi
  endi wrap qilinmay, gorizontal skroll qiladi (`.scrollbar-none` utility qo'shildi).

- **Animatsiya kutubxonasi**: loyihada `animejs` (v4, https://github.com/juliangarnier/anime)
  allaqachon o'rnatilgan va `RaceBackground.tsx`da fon effektlari uchun ishlatilgan edi.
  Endi shu kutubxona bilan yana ikkita joyda animatsiya qo'shildi:
  1. **Ishchi reytingi qatorlari "jim turmasligi"** — har bir avatar rasmiga sekin,
     tartibsiz (staggered) "suzish/nafas olish" animatsiyasi berildi (`translateY`
     loop, `stagger()` bilan), shunda ro'yxat statik ko'rinmaydi.
  2. **AgentDetailModal ochilish/yopilish** — CSS keyframe o'rniga `animate()` bilan
     backdrop fade + karta scale/translateY animatsiyasi. Muhim: yopilish `onComplete`
     callback'iga bog'langan, LEKIN sahifa fonga o'tib animatsiya kadri to'xtab qolsa
     panel "yopilmay qolib ketmasin" deb qo'shimcha `setTimeout(onClose, 260)` zaxira
     sifatida qo'yilgan.

- **"Orqaga" tugmasi** — `PublicShell` header'iga qo'shildi (chap tomonda, MICCO
  logotipidan oldin): reyting sahifalaridan Bosh dashboard (`/`)ga qaytish uchun.
  Mobilda faqat strelka+"Orqaga" ko'rinadi, MICCO matni joy tejash uchun yashiriladi.

- **Supervayzer va menejer reytingi'da ham avatar rasm** qo'shildi (avval faqat ishchi
  reytingida bor edi). `buildSupervisors()`/`buildManagers()` endi `avatar` maydonini
  ham qaytaradi (dicebear, ism asosida seed qilingan — `buildLeague()`dagi bilan bir xil uslub).

## Keyingi qadamlar (taxminiy)
- [ ] Backend'da real API (xodimlar, filiallar, reyting hisoblash) qo'shish.
- [ ] Autentifikatsiya/rol tizimi (Admin/Operator/Menejer/Supervayzer login) — hozircha
      loyihada login/parol formalari faqat demo (haqiqiy auth yo'q, AppShell doim ochiq).
- [ ] Frontend'ni statik `micco-data.ts` o'rniga backend API'ga ulash — xususan
      `buildSupervisorScoreboard()` o'rniga backend'dan oylik % va ball qaytaradigan endpoint.
- [ ] Deploy qilish va doimiy link olish (Lovable / boshqa hosting) — shunda "Avto rejim"
      haqiqatan ham ofis TV ekraniga qo'yiladigan bo'ladi.
