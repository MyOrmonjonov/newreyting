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

## Filial olib tashlandi, ID-scoping va haqiqiy o'chirish (2026-08-30, kechqurun 2)

Foydalanuvchi talabiga ko'ra uchta muhim o'zgarish:

- **Filial butunlay olib tashlandi** — Ishchi endi filialga bog'lanmaydi (avval majburiy edi).
  `Filial` entity/API/DTO'lar butunlay o'chirildi.
- **ID zanjiri bo'yicha ko'rinish/boshqarish** — avval har qanday OPERATOR barcha
  menejerlarni, har qanday MENEJER barcha supervayzerlarni ko'rar edi (butun tashkilot
  bo'ylab). Endi qat'iy: **OPERATOR faqat o'zi yaratgan menejerlarni va ularning
  supervayzerlarini (transitiv, 2 pog'ona)** ko'radi/boshqaradi; **MENEJER faqat o'zi
  yaratgan supervayzerlarni**. Bu `/api/users/menejers`, `/api/users/supervayzers`,
  `/api/ishchilar` — barchasida amalda.
- **Haqiqiy o'chirish (DELETE)** qo'shildi — operator/menejer/supervayzer/ishchi uchun.
  Bog'liq faol ma'lumot bo'lsa (masalan supervayzerga biriktirilgan ishchi, yoki menejerning
  supervayzerlari) 409 bilan bloklanadi — avval bog'liqni o'chirish/ko'chirish kerak.
- **Profilni tahrirlash** (ism/familiya) — `PUT /api/users/{role}/{id}` qo'shildi.
- **AuditLog** endi actor'ni jonli FK sifatida emas, **suratga olingan ism** (`actorNomi`)
  sifatida saqlaydi — shu orqali foydalanuvchi o'chirilgandan keyin ham audit tarixida ismi
  to'g'ri ko'rinadi (avval bu FK muammoga olib kelardi — Mahsulotdagi bugga o'xshab).

**Diqqat**: oylik natija (plan/bajarildi) va undan hisoblanadigan foiz mantiqi (`overallPercent`,
`OylikNatija`) bu o'zgarishlarda **tegilmagan** — avvalgidek ishlaydi.

**Hali ataylab qilinmagan**:
- Filial qo'shish uchun frontendda forma yo'q edi, endi esa Filial tushunchasi umuman yo'q.
- Refresh-token/logout-invalidation yo'q (token 12 soat amal qiladi); HTTPS hali yo'q (lokal
  HTTP); production uchun hosting/deploy hali yo'q; avtomatlashtirilgan testlar yo'q (hammasi
  qo'lda curl/brauzer bilan tekshirilgan).

## Keyingi qadamlar (taxminiy)
- [ ] Foydalanuvchidan aniqlashtirish: har bir rol (Operator/Menejer/Supervayzer) uchun
      to'liq ko'rish/qila olish matritsasi TZ'ga mos keladimi — tasdiqlash kerak.
- [x] Deploy qilish va doimiy link olish (backend + frontend) — 2026-08-31 da AWS Elastic
      Beanstalk'ga chiqarildi (pastga qarang).
- [ ] Refresh-token/logout-invalidation, HTTPS — production'ga chiqishdan oldin.

## AWS'ga deploy qilingan — manzillar va qayta deploy qilish (2026-08-31 dan beri)

**Live manzillar** (AWS akkaunt: `205080700819`, region `ap-south-1`):
- Backend: `http://micco-backend.eba-ghcr2miv.ap-south-1.elasticbeanstalk.com`
- Frontend: `http://micco-frontend.eba-2rxbbi3w.ap-south-1.elasticbeanstalk.com`
- EB application nomlari: backend — `micco` (env: `micco-backend`), frontend — `micco-frontend`
  (env: `micco-frontend`). S3 bundle bucket: `elasticbeanstalk-ap-south-1-205080700819`.

**Qayta deploy qilish** (Windows Git Bash'da, AWS CLI sozlangan bo'lishi kerak — `aws sts
get-caller-identity` orqali tekshiriladi):

Backend (jar versiyasini +1 oshirib, masalan v6):
```bash
./mvnw.cmd -q clean package -DskipTests
aws s3 cp target/newreyting-0.0.1-SNAPSHOT.jar s3://elasticbeanstalk-ap-south-1-205080700819/micco-v6.jar
aws elasticbeanstalk create-application-version --application-name micco --version-label v6 \
  --source-bundle S3Bucket=elasticbeanstalk-ap-south-1-205080700819,S3Key=micco-v6.jar
aws elasticbeanstalk update-environment --environment-name micco-backend --version-label v6
```

Frontend (`frontend/` papkasida, versiyani +1 oshirib, masalan v8):
```bash
VITE_API_BASE=http://micco-backend.eba-ghcr2miv.ap-south-1.elasticbeanstalk.com npm run build
# .output/package.json avtomatik yaratilmaydi — har build'dan keyin qo'lda yozish kerak:
#   {"name":"micco-frontend","private":true,"type":"module","scripts":{"start":"node server/index.mjs"}}
# ZIP albatta Python bilan (PowerShell Compress-Archive backslash ishlatadi — Linux'da unzip xato beradi):
python3 -c "
import zipfile, os
zf = zipfile.ZipFile('micco-frontend-v8.zip', 'w', zipfile.ZIP_DEFLATED)
for root, dirs, files in os.walk('.output'):
    for f in files:
        full = os.path.join(root, f)
        zf.write(full, os.path.relpath(full, '.output').replace(os.sep, '/'))
"
aws s3 cp micco-frontend-v8.zip s3://elasticbeanstalk-ap-south-1-205080700819/micco-frontend-v8.zip
aws elasticbeanstalk create-application-version --application-name micco-frontend --version-label v8 \
  --source-bundle S3Bucket=elasticbeanstalk-ap-south-1-205080700819,S3Key=micco-frontend-v8.zip
aws elasticbeanstalk update-environment --environment-name micco-frontend --version-label v8
```

Holatni kuzatish: `aws elasticbeanstalk describe-environments --environment-names micco-backend
micco-frontend --query "Environments[].[EnvironmentName,Status,Health,VersionLabel]" --output table`
— `Ready` + `Green` bo'lguncha kutish kerak (odatda 1-3 daqiqa).

**Deploy tarixi**: backend v1-v6, frontend v1-v10 (oxirgi: backend v6 — quyidagi ikki xatolik
tuzatildi; frontend v10 — podium (top-3) dizayni to'liq yangilandi, quyida batafsil).

## To'liq audit — 2026-09-01 (statistika/bugun-kecha xatoliklarini tekshirish)

Foydalanuvchi so'rovi bilan `RatingService`/`PlaceHistoryService` chuqur qayta ko'rib chiqildi.
Ikkita haqiqiy xatolik topildi va tuzatildi (backend v6):

1. **"Bugun/Kecha" musobaqa sharoiti (race condition)** — bir ishchi uchun oydagi BIRINCHI
   `ishchi_place_snapshot` qatori bir nechta so'rov bir vaqtda kelganda (masalan bir nechta TV
   ekrani bir daqiqada yangilansa, yoki `/ishchi` va `/ishchi/yillik` bir vaqtda so'ralsa) ikkalasi
   ham "hali yo'q" deb topib, ikkalasi ham yozishga urinardi — biri (ishchi_id, oy) unique
   constraint'ga urilib `DataIntegrityViolationException` olardi, bu esa BUTUN `/api/reyting/ishchi`
   so'rovini xato bilan qulatib, frontendda ma'lumot vaqtincha yo'q bo'lib qolgandek ko'rinardi.
   Tuzatish: `RatingService.previousPlaceSafe`/`updateSnapshotSafe` — xato ushlanadi va
   `PlaceHistoryService` metodiga YANGI tashqi chaqiruv bilan qayta murojaat qilinadi (Postgres'da
   xato bergan tranzaksiya "aborted" bo'lib qolgani uchun xuddi o'sha tranzaksiya ichida qayta
   urinish ishlamaydi — shuning uchun qayta chaqiruv alohida, tashqi chaqiruv bo'lishi shart).
2. **Liga ko'tarilish/tushirish chegaraviy xatosi** (`finalizeMonth`) — juda kichik liga (masalan
   test ma'lumotidagi 1-2 kishilik GOLD) bo'lsa, bitta ishchi bir vaqtning o'zida ham pastki
   liganing TOP-5'i sifatida ko'tarilishga, ham yuqori liganing BOTTOM-5'i sifatida tushirilishga
   loyiq chiqib, keyingi (demote) yozuv avvalgi (promote) yozuvni bosib, ko'tarilish yo'qolib
   qolardi. Tuzatish: `promoted` to'plami — bir marta ko'tarilgan ishchi shu oy ichida boshqa
   yo'nalishda qayta harakatlantirilmaydi.

**Tekshirilib, TO'G'RI deb topilgan joylar** (o'zgartirilmadi): `pointsForLeague`/`pointsForPlace`
jadvallari backend/frontend'da bir xil; `overallPercent`, yillik/oylik yig'indilar, teng ball
tartib-qoidasi (jami ball → 1-o'rin → 2-o'rin → 3-o'rin → o'rtacha %) Nizomga mos; `OylikNatija`
saqlashda (ishchi_id, mahsulot_id, oy) unique constraint bor — ikki marta bir xil natija
yozilmaydi.

**Past darajali, TUZATILMAGAN topilma**: `OylikNatijaService.saveBulk` operator natija
kiritganda ham (nazariy jihatdan) xuddi shunga o'xshash race bo'lishi mumkin — ikki operator
AYNAN bir ishchi+mahsulot+oy uchun bir soniyada natija kiritsa. Ehtimoli juda past (bitta
operator, ketma-ket ish oqimi) va tuzatish ko'proq o'zgartirish talab qiladi (butun bulk-saqlash
bitta tranzaksiya ichida), shuning uchun hozircha tegilmadi — kerak bo'lsa alohida so'rang.

**Serverga SSH orqali qo'lda kirish** hozircha sozlanmagan (key-pair yo'q, EB muhitlariga
SSH ulanish o'chirilgan holatda turibdi — standart EB xavfsizlik sozlamasi). Buni yoqish uchun
ikki yo'l bor: (1) EC2 key-pair yaratib EB muhitiga biriktirish va xavfsizlik guruhida 22-portni
ochish — oddiy, lekin production serverga doimiy SSH eshigini ochiq qoldiradi; (2) AWS Systems
Manager Session Manager — key-pair yoki ochiq port kerak emas, IAM orqali ruxsat beriladi,
xavfsizroq. Bu ikkalasi ham productionning xavfsizlik holatini o'zgartiradigani uchun foydalanuvchi
tanlovi kutilmoqda (qaysi usulni xohlashi) — tasdiqlanmaguncha amalga oshirilmagan.

## Podium (top-3) dizayni yangilandi (2026-09-01, mijoz rasm-namunasi bo'yicha)

`frontend/src/components/Podium.tsx` to'liq qayta yozildi — endi rounded-rectangle karta va
pedestal (3D silindr) shakllari umuman yo'q, faqat: gradient halqali avatar (rang liga
bo'yicha EMAS, doim medal bo'yicha — 1-o'rin oltin, 2-o'rin kumush, 3-o'rin bronza,
`medalPalette()` funksiyasida), 1-o'rin uchun toj avatar bilan bir xil `.podium-pulse`
animatsiyasida (sinxron pulsatsiya), doira o'rniga yulduzcha nishon (ichida o'rin raqami), va
avatar atrofidan doimiy tarqaladigan spark zarrachalar (`.podium-spark`, rangiga mos,
opacity 100%dan 0%ga). Yangi `--accent-silver` CSS o'zgaruvchisi qo'shildi. `PodiumSlot`'ning
`ringColor`/`glowColor` propslari olib tashlandi (endi ichkarida `rank`dan hisoblanadi) — barcha
3 sahifa (ishchi/menejer/supervayzer) shunga moslab yangilandi. Deploy: frontend v10.

## MUHIM: React hydration xatosi topildi va tuzatildi (frontend v11)

v10 deploy qilingandan keyin production konsolida har sahifa yuklanganda **React error #418**
(hydration mismatch) chiqayotgani aniqlandi — sabab ilgariroq qo'shilgan `usePersistentState`
(filtrlarni localStorage'da saqlash) edi: bu ilova SSR qiladi, serverda `localStorage` yo'q, shu
sabab server "diamond" bilan render qilib yuborgan HTML'ni klient darhol localStorage'dagi
("gold" kabi) qiymat bilan almashtirib yuborardi — React buni matn nomuvofiqligi deb hisoblab,
butun sahifani qayta render qilardi (foydalanuvchi buni qisqa "bo'sh/eski holat" miltillashi
sifatida ko'rgan bo'lishi mumkin). Tuzatish: `usePersistentState` endi HAR DOIM `initial`dan
boshlanadi (server va klientning birinchi render'i bir xil bo'ladi), saqlangan qiymat faqat
mount'dan KEYIN (`useEffect`da, faqat brauzerda) o'qib qo'llaniladi. Production'da localhost
SSR build orqali sinovdan o'tkazildi (localStorage'da boshqa qiymat bo'lsa ham hydration xatosi
yo'q) va keyin haqiqiy productionda konsolda xatosiz ekanligi tasdiqlandi. Deploy: frontend v11.

## AWS deploy kalitlari haqida eslatma (2026-09-01)

Deploy'lar (`aws s3 cp`, `elasticbeanstalk create-application-version`/`update-environment`)
shu kompyuterda AWS CLI uchun oldindan sozlangan kalit orqali ishlaydi:

- IAM foydalanuvchi: **`micco-deploy`** (Account: `205080700819`), `aws sts get-caller-identity`
  orqali tasdiqlangan.
- Kalit (Access Key ID + Secret Access Key) `C:\Users\DELL\.aws\credentials` faylida saqlanadi
  — bu AWS CLI uchun standart, xavfsiz joy. **Bu faylning o'zi yoki undagi qiymatlar hech qachon
  git repo ichiga yoki boshqa `.md`/matn fayliga yozilmasligi kerak** (git tarixiga tushsa,
  keyin o'chirib bo'lmaydi).
- Bu SSH kirish EMAS — serverning ichiga (OS/fayl darajasida) kirish huquqi yo'q va yo'q ham
  bo'ladi (yuqoridagi "Serverga SSH orqali qo'lda kirish" bo'limiga qarang). Kalit faqat AWS'ning
  boshqaruv API'siga (S3'ga fayl yuklash, EB'ga "shu versiyani ishga tushir" buyrug'i berish)
  ruxsat beradi — bajarilishini AWS'ning o'zi amalga oshiradi.
- **Diqqat**: bu kalit bir marta suhbat chatiga ochiq matn sifatida yozilgan edi — xavfsizlik
  nuqtai nazaridan AWS IAM konsolida almashtirish (rotate) tavsiya etiladi.
