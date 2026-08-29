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

**Hali ulanmagan**: Bosh dashboard'dagi ba'zi metrikalar (Operatorlar/Menejerlar sonlari
allaqachon real, lekin "Supervayzerlar reytingi — oylik ball" jadvali hamon
`buildSupervisorScoreboard()` demo ma'lumotidan — `/api/reyting/supervayzer/tarix` bilan
almashtirish qoldi, boshqa hech narsa kerak emas).

## Parolni almashtirish/yangilash (2026-08-30)

- **O'zining parolini almashtirish**: `POST /api/auth/change-password` (`{oldPassword,newPassword}`,
  joriy parolni bilish kerak) — `AppShell` chap paneli pastida (login/logout yonida) kalit
  ikonkasi orqali ochiladigan modal (`PasswordDialog.tsx`, `requireOldPassword`).
- **Quyi rol parolini yangilash** (eskisini bilmasdan): `PUT /api/users/operators/{id}/password`
  (ADMIN), `.../menejers/{id}/password` (ADMIN yoki OPERATOR), `.../supervayzers/{id}/password`
  (ADMIN yoki MENEJER) — `/operatorlar` va `/jamoa` sahifalaridagi "Parolni yangilash"
  tugmalari (avval "tez orada" placeholder edi) endi shu endpointlarga ulangan.
- Muhim tuzatilgan xato: `changeOwnPassword` da foydalanuvchi obyekti (`@AuthenticationPrincipal`
  orqali) boshqa so'rovda yuklanib **detached** holatda kelgani uchun `setPasswordHash()`
  chaqirilsa ham `userRepository.save()` qilinmaguncha bazaga yozilmayotgan edi — endi tuzatildi.

## Ishchi/Filial/Mahsulot/Oylik natija + reyting hisoblash + audit + xavfsizlik (2026-08-30)

Katta bosqich — endi tizim uchtadan (login) beshtaga (login + real tashkiliy ma'lumot +
hisoblangan reyting + audit) to'liq ishlaydigan mahsulotga aylandi:

- **Yangi entity/API'lar**: `Filial` (`/api/filiallar`), `Mahsulot` (`/api/mahsulotlar`, to'liq
  CRUD), `Ishchi` (`/api/ishchilar` — rolga qarab ko'rinish/ruxsat: ADMIN/OPERATOR hammasini,
  MENEJER o'z supervayzerlariga tegishlilarni, SUPERVAYZER faqat o'zinikini ko'radi/boshqaradi),
  `OylikNatija` (`/api/natijalar`, `/api/natijalar/bulk` — ishchi×mahsulot×oy bo'yicha
  plan/bajarildi, upsert).
- **`RatingService`** — `/api/reyting/{ishchi,menejer,supervayzer,supervayzer/tarix}` (barchasi
  **permitAll**, `PublicShell` login talab qilmaydi): `pointsForPlace`/`overallPercent`
  frontend'dagi bilan bir xil formula; liga (diamond/gold/silver/bronze/rising) global %
  bo'yicha **kvintil** bilan belgilanadi, so'ng har bir liga **mustaqil** qayta raqamlanadi
  (har ligada ham 1-o'rin 24 ball — demo'dagi `buildLeague()` xatti-harakati bilan bir xil).
  Trophies — tarixiy (o'tgan oylarda necha marta umumiy 1-o'rin bo'lgani, hisoblanadi, saqlanmaydi);
  yearsActive — `ishGaKirganSana`dan hisoblanadi; kunlik/kechagi granulyatsiya yo'q (bilinen
  soddalashtirish, joriy oylik o'ringa teng qo'yiladi).
- Frontend: `operator.tsx` (ishchi qo'shish + oylik natija kiritish, mavjud natija avtomatik
  prefill bilan), `mahsulotlar.tsx` (real CRUD), `reyting.ishchi/menejer/supervayzer.tsx`
  (endi real API'dan, `micco-data.ts` generatorlari ishlatilmaydi).
- **Audit log**: `AuditLog` entity + `AuditService.record()` — foydalanuvchi/ishchi/mahsulot
  yaratish, parol almashtirish/yangilash, oylik natija saqlash va login har birida yozib
  boriladi. `GET /api/audit` (barcha login rollariga ochiq), `audit.tsx` endi shu API'ga ulangan.
- **Infratuzilma**: H2 fayl bazasidan lokal **PostgreSQL**ga o'tildi (baza nomi: `micco`,
  ulanish `POSTGRES_URL`/`POSTGRES_USER`/`POSTGRES_PASSWORD` muhit o'zgaruvchilari orqali —
  parol endi faylga yozilmaydi, **backend'ni ishga tushirishdan oldin
  `$env:POSTGRES_PASSWORD = '...'` o'rnatish kerak**, aks holda ishga tushmaydi).
- **Xavfsizlik tuzatishlari** (avvalgi hisobotda topilgan muammolar):
  - `JWT_SECRET` uchun ochiq/hardcoded fallback olib tashlandi — endi berilmasa `JwtService`
    har ishga tushishda xavfsiz tasodifiy kalit generatsiya qiladi (log'da ogohlantirish bilan;
    kamchiligi — qayta ishga tushirilganda hamma tizimdan chiqadi, shuning uchun production'da
    `JWT_SECRET` albatta muhit o'zgaruvchisi orqali berilishi kerak).
  - `/api/auth/me` va `/api/auth/change-password` endi haqiqiy autentifikatsiya talab qiladi
    (avval butun `/api/auth/**` `permitAll` edi — token'siz so'rov `NullPointerException`
    (500) tashlar edi, endi to'g'ri 403 qaytadi). Faqat `/api/auth/login` ochiq qoldi.
  - Login endpointiga **rate-limiting** qo'shildi (`LoginRateLimiter`, xotirada saqlanadigan
    oddiy hisoblagich): bir login uchun 15 daqiqada 5 tadan ortiq noto'g'ri urinishdan keyin
    429 qaytadi.
  - H2 konsoli sozlamasi olib tashlandi (endi ishlatilmaydi).

**Hali qolgan (bilinen, keyingi safar uchun)**: refresh-token/logout-invalidation yo'q (token
12 soat amal qiladi); HTTPS hali yo'q (lokal HTTP); production uchun hosting/deploy hali yo'q.

Shu bilan **Bosh dashboard'dagi "Supervayzerlar reytingi — oylik ball" jadvali** ham
`/api/reyting/supervayzer/tarix?oyCount=5`ga ulandi (`index.tsx`) — endi butun loyihada
`micco-data.ts`dagi demo generatorlarga tayangan yagona joy qolmadi (statik ro'yxatlar —
`LEAGUES`, `MONTHS` kabi UI konstantalari — hali ishlatiladi, bular demo emas).

## Topilgan kamchiliklar va tuzatishlar (2026-08-30, kechqurun)

"Loyihada kamchilik qolmadimi" deb so'ralganda topilgan va tuzatilgan narsalar:

- **Bug (tuzatildi)**: oylik natija bog'langan mahsulotni o'chirishga urinilsa PostgreSQL FK
  cheklovi ishlab, boshqarilmagan `DataIntegrityViolationException` (tushunarsiz xato) tashlar
  edi. Endi oldindan tekshiriladi, tushunarli 409 xabar qaytadi.
- **Ishchini tahrirlash** (`PUT /api/ishchilar/{id}`) qo'shildi — ism/familiya/filial/supervayzer/
  ishga kirgan sana/faol holatini o'zgartirish mumkin (`operator.tsx`da "Tahrirlash" tugmasi,
  forma tahrirlash rejimiga o'tadi).
- **Foydalanuvchini faollashtirish/faolsizlantirish** (`PUT /api/users/{role}/{id}/active`) —
  ishdan ketgan operator/menejer/supervayzer hisobini yopish mumkin endi (`operatorlar.tsx`,
  `jamoa.tsx`dagi tugmalar). Faolsizlantirilgan foydalanuvchi keyingi so'rovda avtomatik
  tizimdan chiqariladi (`JwtAuthFilter` `isEnabled()`ni tekshiradi).
- Barchasi backend darajasida `curl` bilan to'liq tasdiqlandi (deactivate → login bloklanishi →
  reactivate → login qayta ishlashi; ishchi tahrirlash → barcha maydon o'zgarishi).

**Hali ataylab qilinmagan (chunki so'ralmadi yoki alohida qaror kerak)**:
- Filial qo'shish uchun frontendda forma yo'q (faqat backend API bor) — foydalanuvchi
  "keyinroq" deb qoldirdi.
- Filial va Foydalanuvchi uchun ham xuddi Mahsulotdagi kabi "bog'langan ma'lumot bo'lsa
  o'chirmaslik" himoyasi hali yo'q (hozircha ularda umuman o'chirish endpointi yo'q, faqat
  foydalanuvchini faolsizlantirish bor — bu xavfsizroq yo'l).
- Refresh-token/logout-invalidation yo'q (token 12 soat amal qiladi); HTTPS hali yo'q (lokal
  HTTP); production uchun hosting/deploy hali yo'q; avtomatlashtirilgan testlar yo'q (hammasi
  qo'lda curl/brauzer bilan tekshirilgan).

## Keyingi qadamlar (taxminiy)
- [ ] Filial qo'shish formasi (frontend) — hozircha yangi filialni faqat API orqali qo'shish
      mumkin.
- [ ] Deploy qilish va doimiy link olish (backend + frontend, + Postgres serverga ko'chirish) —
      shunda "Avto rejim" haqiqatan ham ofis TV ekraniga qo'yiladigan bo'ladi.
- [ ] Refresh-token/logout-invalidation, HTTPS — production'ga chiqishdan oldin.
