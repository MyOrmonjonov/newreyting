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

## Backend + login tizimi (2026-08-29)

Backend endi **funksional** — Spring Boot + H2 (fayl bazasi, `./data/newreyting.mv.db`,
o'rnatishsiz ishlaydi) + Spring Security + JWT.

**Ishga tushirish**: `cd D:\newreyting && ./mvnw.cmd spring-boot:run` → http://localhost:8080
Birinchi marta ishga tushganda avtomatik ADMIN hisobi yaratiladi:
**login: `admin` / parol: `admin123`** — DIQQAT: production'ga chiqishdan oldin bu parolni
albatta almashtirish kerak (hozircha parolni o'zgartirish endpoint'i yo'q, keyingi qadam).

**Rol ierarxiyasi (backend'da amalda tekshiriladi, faqat frontendda emas)**:
`ADMIN` → `OPERATOR` yaratadi → `MENEJER` yaratadi → `SUPERVAYZER` yaratadi.
Ishchi (agent) hali login olmaydi — u faqat ochiq reyting sahifasini ko'radi (o'zgarmadi).

**API** (`org.example.newreyting`):
- `POST /api/auth/login` `{login,password}` → `{token, user}`
- `GET /api/auth/me` — joriy foydalanuvchi (token bilan)
- `GET/POST /api/users/operators` — faqat ADMIN
- `GET/POST /api/users/menejers` — ADMIN yoki OPERATOR
- `GET/POST /api/users/supervayzers` — ADMIN yoki MENEJER
- Parollar BCrypt bilan xeshlanadi, JWT `app.jwt.secret`dan (application.properties,
  production'da `JWT_SECRET` muhit o'zgaruvchisi orqali berilishi kerak).

**Frontend ulanishi**:
- `frontend/src/lib/api.ts` — fetch wrapper, tokenni localStorage'dan qo'shadi
- `frontend/src/lib/auth-context.tsx` — `AuthProvider`/`useAuth()`, `__root.tsx`da ulangan
- `frontend/src/routes/login.tsx` — yangi login sahifasi
- `AppShell` endi kirilmagan bo'lsa avtomatik `/login`ga yo'naltiradi, pastda haqiqiy
  foydalanuvchi ismi + chiqish (logout) tugmasi bor
- `/operatorlar` va `/jamoa` sahifalari endi **real API**ga ulangan (`@tanstack/react-query`
  bilan): ro'yxat backend'dan keladi, forma haqiqiy foydalanuvchi yaratadi, ruxsati
  yo'q rolga sahifa "Ruxsat cheklangan" ko'rsatadi (masalan Operator "Operatorlar"ni
  ko'ra olmaydi, Jamoa sahifasida faqat "Menejerlar" tabini ko'radi)
- To'liq test qilindi: login → operator yaratish → o'sha operator sifatida kirish →
  faqat menejer yaratish huquqi borligini tasdiqlash — hammasi ishladi.

**Hali ulanmagan** (frontend hamon statik demo ma'lumot bilan ishlaydi):
- Bosh dashboard'dagi metrikalar (Operatorlar/Menejerlar/... soni) — hali `micco-data.ts`dan
- Ishchilarni kiritish (`/operator`), Mahsulotlar, Audit log — bular hali real backend'ga
  ulanmagan (xodim/mahsulot/audit uchun entity/API yo'q)
- Reyting sahifalari (`/reyting/*`) — hamon `micco-data.ts` statik/tasodifiy ma'lumot

## Keyingi qadamlar (taxminiy)
- [ ] Parolni o'zgartirish endpoint'i (hozir birinchi kirishdan keyin admin paroli
      o'zgarmasdan qolaveradi — xavfsizlik uchun muhim).
- [ ] Ishchi (agent), Filial, Mahsulot, Oylik natija uchun entity + API — shundan keyin
      `/operator` va `/mahsulotlar` sahifalarini ham real backend'ga ulash mumkin bo'ladi.
- [ ] Reyting sahifalarini (`/reyting/*`) real oylik natijalar API'siga ulash — hozircha
      `buildSupervisorScoreboard()`, `buildLeague()` kabi funksiyalar hali demo ma'lumot beradi.
- [ ] Audit log'ni real qilish (hozir statik ro'yxat) — har bir foydalanuvchi yaratilganda
      backend avtomatik yozib borsa bo'ladi (`createdBy` allaqachon saqlanyapti).
- [ ] Production uchun: H2 o'rniga PostgreSQL, JWT_SECRET'ni muhit o'zgaruvchisiga o'tkazish.
- [ ] Deploy qilish va doimiy link olish (backend + frontend) — shunda "Avto rejim"
      haqiqatan ham ofis TV ekraniga qo'yiladigan bo'ladi.
