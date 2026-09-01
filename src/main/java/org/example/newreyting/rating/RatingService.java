package org.example.newreyting.rating;

import org.example.newreyting.employee.Ishchi;
import org.example.newreyting.employee.IshchiRepository;
import org.example.newreyting.employee.Liga;
import org.example.newreyting.rating.dto.AgentResponse;
import org.example.newreyting.rating.dto.RankedUserResponse;
import org.example.newreyting.rating.dto.ScoreboardRowResponse;
import org.example.newreyting.rating.dto.YillikIshchiResponse;
import org.example.newreyting.rating.dto.YillikOyResponse;
import org.example.newreyting.rating.dto.YillikSupervayzerResponse;
import org.example.newreyting.result.OylikNatija;
import org.example.newreyting.result.OylikNatijaRepository;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;

/**
 * Reyting hisoblash — barcha metodlar faqat o'qiydi, hech narsa saqlamaydi.
 * Formulalar frontend/src/lib/micco-data.ts bilan bir xil (pointsForPlace, overallPercent),
 * shunda demo davridagi mezon xatti-harakati saqlanib qoladi.
 */
@Service
@Transactional(readOnly = true)
public class RatingService {

    private static final String[] LEAGUE_KEYS = {"diamond", "gold", "silver", "bronze", "rising"};
    // MICCO Sales League Nizomi VII BOB — har liganing yillik g'olibiga beriladigan unvon.
    private static final Map<String, String> LEAGUE_NOMINATIONS = Map.of(
            "diamond", "Diamond Champion",
            "gold", "Sales King",
            "silver", "Fast Promotion",
            "bronze", "Bronze Champion",
            "rising", "Rising Star"
    );

    private final IshchiRepository ishchiRepository;
    private final OylikNatijaRepository natijaRepository;
    private final UserRepository userRepository;
    private final OylikYakunRepository yakunRepository;
    private final PlaceHistoryService placeHistoryService;

    public RatingService(IshchiRepository ishchiRepository, OylikNatijaRepository natijaRepository,
                          UserRepository userRepository, OylikYakunRepository yakunRepository,
                          PlaceHistoryService placeHistoryService) {
        this.ishchiRepository = ishchiRepository;
        this.natijaRepository = natijaRepository;
        this.userRepository = userRepository;
        this.yakunRepository = yakunRepository;
        this.placeHistoryService = placeHistoryService;
    }

    // Mezon: 1-o'rin = 24, 2 = 22, 3 = 20, 4-22-o'rin = har biriga -1, 23+ = 0
    // (MICCO Supervisor League Nizomi, 1-ilova — supervayzer/menejer reytingida ishlatiladi)
    public static int pointsForPlace(int place) {
        if (place == 1) return 24;
        if (place == 2) return 22;
        if (place == 3) return 20;
        if (place >= 4 && place <= 22) return 23 - place;
        return 0;
    }

    /**
     * Ishchi (agent) ligalari uchun MICCO Sales League Nizomi IV BOB'idagi ball jadvali —
     * har bir liganing o'z 1/2/3-o'rin ballari va pastki "polkasi" bor (jadvaldagi "...N"):
     * diamond 34/31/30...6, gold 33/31/29...5, silver 32/30/28...4, bronze 31/29/27...3,
     * rising 29/27/25...2. 4-o'rindan boshlab har o'ringa -1, "polka"dan pastga tushmaydi
     * (rising doimiy 27 kishilik bo'lmagani uchun muhim — katta ro'yxatda ham 2 balda to'xtaydi).
     */
    static int pointsForLeague(String league, int place) {
        int p1, p2, p3, floor;
        switch (league) {
            case "diamond" -> { p1 = 34; p2 = 31; p3 = 30; floor = 6; }
            case "gold" -> { p1 = 33; p2 = 31; p3 = 29; floor = 5; }
            case "silver" -> { p1 = 32; p2 = 30; p3 = 28; floor = 4; }
            case "bronze" -> { p1 = 31; p2 = 29; p3 = 27; floor = 3; }
            default -> { p1 = 29; p2 = 27; p3 = 25; floor = 2; } // rising
        }
        if (place == 1) return p1;
        if (place == 2) return p2;
        if (place == 3) return p3;
        return Math.max(floor, p3 + 3 - place);
    }

    /** Umumiy foiz = jami bajarilgan / jami plan * 100 (og'irlikli). */
    public static double overallPercent(int bajarildi, int plan) {
        return plan == 0 ? 0 : (bajarildi * 100.0) / plan;
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }

    // "Bugun/Kecha" uchun oldingi o'rin endi bazada saqlanadi (IshchiPlaceSnapshot orqali,
    // PlaceHistoryService.previousPlace) — backend qayta ishga tushirilsa/deploy qilinsa ham
    // yo'qolmaydi (avval xotirada saqlanardi, shuning uchun har deploy'da tozalanib qolardi).

    private Map<Long, int[]> sumByIshchi(List<OylikNatija> rows) {
        Map<Long, int[]> sums = new HashMap<>();
        for (OylikNatija n : rows) {
            int[] s = sums.computeIfAbsent(n.getIshchi().getId(), k -> new int[2]);
            s[0] += n.getPlan();
            s[1] += n.getBajarildi();
        }
        return sums;
    }

    /**
     * Ishchi reytingi. Agar bu oy allaqachon yakunlangan bo'lsa (finalizeMonth ishlagan —
     * odatda avtomatik, oyning 1-kunida o'tgan oy uchun), MUZLATILGAN natija qaytariladi va
     * qayta hisoblanmaydi (Nizomdagi apellyatsiya jarayoni — e'lon qilingan natija barqaror
     * qolishi kerak). Joriy (hali yakunlanmagan) oy uchun har doim jonli hisoblanadi.
     */
    public List<AgentResponse> computeIshchiReyting(LocalDate oy) {
        LocalDate month = oy.withDayOfMonth(1);
        List<OylikYakun> frozen = yakunRepository.findAllByOy(month);
        if (!frozen.isEmpty()) {
            return frozenToResponse(frozen, month);
        }
        return computeLiveIshchiReyting(month);
    }

    /**
     * Joriy oy uchun har bir ishchining HOZIRGI jonli o'rnini "kechagi" bazaviy qiymat sifatida
     * yozib qo'yadi (DailyPlaceSnapshotScheduler tomonidan har kuni bir marta chaqiriladi).
     * Shundan keyingi "bugun/kecha" solishtiruvi aynan shu — kunlik — farqni ko'rsatadi.
     */
    @Transactional
    public void refreshDailyPlaceSnapshots() {
        LocalDate month = LocalDate.now().withDayOfMonth(1);
        for (AgentResponse r : computeLiveIshchiReyting(month)) {
            updateSnapshotSafe(month, r.id(), r.place());
        }
    }

    /**
     * {@code placeHistoryService.previousPlace}'ni chaqiradi; agar boshqa parallel so'rov ayni shu
     * ishchi uchun oydagi BIRINCHI qatorni bir zumda ilgari yozib ulgurgan bo'lsa (unique
     * constraint to'qnashuvi), bitta marta qayta chaqiradi — endi qator mavjud bo'lgani uchun bu
     * safar shunchaki o'qib qaytaradi. Qayta chaqirish ATAYLAB YANGI tashqi chaqiruv (o'z-o'zini
     * chaqirish emas) — shundagina PlaceHistoryService o'zining REQUIRES_NEW tranzaksiyasini yangi
     * boshlaydi (Postgres'da xato bergan tranzaksiya "aborted" bo'lib qoladi, o'sha tranzaksiya
     * ICHIDA qayta urinish ham xato beradi).
     */
    private int previousPlaceSafe(LocalDate month, Long ishchiId, int place) {
        try {
            return placeHistoryService.previousPlace(month, ishchiId, place);
        } catch (DataIntegrityViolationException raceLost) {
            return placeHistoryService.previousPlace(month, ishchiId, place);
        }
    }

    /** {@link #previousPlaceSafe} bilan bir xil mulohaza — {@code updateSnapshot} uchun. */
    private void updateSnapshotSafe(LocalDate month, Long ishchiId, int place) {
        try {
            placeHistoryService.updateSnapshot(month, ishchiId, place);
        } catch (DataIntegrityViolationException raceLost) {
            placeHistoryService.updateSnapshot(month, ishchiId, place);
        }
    }

    private List<AgentResponse> frozenToResponse(List<OylikYakun> frozen, LocalDate month) {
        Map<Long, Integer> trophiesByIshchi = computeTrophies(month);
        Map<String, List<OylikYakun>> byLeague = new LinkedHashMap<>();
        for (String key : LEAGUE_KEYS) {
            byLeague.put(key, new ArrayList<>());
        }
        for (OylikYakun y : frozen) {
            byLeague.get(y.getLiga()).add(y);
        }
        List<AgentResponse> result = new ArrayList<>();
        for (String league : LEAGUE_KEYS) {
            List<OylikYakun> group = byLeague.get(league).stream()
                    .sorted(Comparator.comparingInt(OylikYakun::getPlace))
                    .toList();
            for (OylikYakun y : group) {
                Ishchi i = y.getIshchi();
                int years = Period.between(i.getIshGaKirganSana(), LocalDate.now()).getYears();
                result.add(new AgentResponse(
                        i.getId(), y.getPlace(), i.getIsm(), i.getFamiliya(),
                        i.getIsm() + " " + i.getFamiliya(), i.getSupervayzer().getFullName(),
                        round1(y.getPercent()), y.getBall(), y.getPlace(), y.getPlace(),
                        trophiesByIshchi.getOrDefault(i.getId(), 0), years, y.getLiga(), i.getRasm()
                ));
            }
        }
        return result;
    }

    /**
     * Jonli hisoblash: har bir ishchi o'zining HOZIRGI (saqlangan) ligasi ichida raqobat
     * qiladi — Nizomga ko'ra liga faqat oy yakunlanganda (finalizeMonth) top-5/bottom-5
     * qoidasi bilan o'zgaradi, har safar global % bo'yicha qayta taqsimlanmaydi.
     */
    private List<AgentResponse> computeLiveIshchiReyting(LocalDate month) {
        List<Ishchi> ishchilar = ishchiRepository.findAllWithRefs();
        Map<Long, int[]> sums = sumByIshchi(natijaRepository.findAllByOy(month));
        Map<Long, Integer> trophiesByIshchi = computeTrophies(month);

        record Scored(Ishchi ishchi, double percent, boolean hasData) {
        }

        Map<String, List<Scored>> byLeague = new LinkedHashMap<>();
        for (String key : LEAGUE_KEYS) {
            byLeague.put(key, new ArrayList<>());
        }
        for (Ishchi i : ishchilar) {
            String league = i.getBoshlangichLiga() != null ? i.getBoshlangichLiga().key() : "rising";
            boolean hasData = sums.containsKey(i.getId());
            int[] s = sums.getOrDefault(i.getId(), new int[2]);
            byLeague.get(league).add(new Scored(i, overallPercent(s[1], s[0]), hasData));
        }
        for (List<Scored> group : byLeague.values()) {
            // Natija kiritilgan ishchilar avval (% bo'yicha), hali natija kiritilmaganlar
            // oxirida — shunda ular shu oy uchun ball olmagan holda ham ro'yxatda ko'rinadi
            // (Nizom: reyting faqat kiritilgan KPI natijalari asosida tuziladi).
            group.sort(Comparator.comparing((Scored s) -> !s.hasData())
                    .thenComparing(Comparator.comparingDouble(Scored::percent).reversed()));
        }

        List<AgentResponse> result = new ArrayList<>();
        for (String league : LEAGUE_KEYS) {
            int place = 0;
            for (Scored s : byLeague.get(league)) {
                place++;
                int years = Period.between(s.ishchi().getIshGaKirganSana(), LocalDate.now()).getYears();
                int points = s.hasData() ? pointsForLeague(league, place) : 0;
                int yesterday = previousPlaceSafe(month, s.ishchi().getId(), place);
                result.add(new AgentResponse(
                        s.ishchi().getId(),
                        place,
                        s.ishchi().getIsm(),
                        s.ishchi().getFamiliya(),
                        s.ishchi().getIsm() + " " + s.ishchi().getFamiliya(),
                        s.ishchi().getSupervayzer().getFullName(),
                        round1(s.percent()),
                        points,
                        place,
                        yesterday,
                        trophiesByIshchi.getOrDefault(s.ishchi().getId(), 0),
                        years,
                        league,
                        s.ishchi().getRasm()
                ));
            }
        }
        return result;
    }

    /**
     * Oyni rasman yakunlaydi (MonthlySettlementScheduler tomonidan avtomatik chaqiriladi):
     * shu oy uchun jonli natijani MUZLATILGAN holda saqlaydi (keyin qayta hisoblanmaydi) va
     * Nizom V BOB'idagi qoida bo'yicha ligalarni almashtiradi — har chegarada pastdagi eng
     * yaxshi 5 tasi yuqoriga, yuqoridagi eng past 5 tasi pastga tushadi. Ikki marta
     * chaqirilsa (masalan backend qayta ishga tushsa) hech narsa qilmaydi.
     */
    @Transactional
    public void finalizeMonth(LocalDate oy) {
        LocalDate month = oy.withDayOfMonth(1);
        if (yakunRepository.existsByOy(month)) {
            return;
        }
        List<AgentResponse> live = computeLiveIshchiReyting(month);
        Map<Long, Ishchi> ishchiById = ishchiRepository.findAllWithRefs().stream()
                .collect(java.util.stream.Collectors.toMap(Ishchi::getId, i -> i));

        for (AgentResponse a : live) {
            yakunRepository.save(new OylikYakun(ishchiById.get(a.id()), month, a.league(), a.place(), a.points(), a.percent()));
        }

        Map<String, List<AgentResponse>> byLeague = live.stream()
                .collect(java.util.stream.Collectors.groupingBy(AgentResponse::league));
        Map<Long, String> nextLeague = new HashMap<>();
        for (AgentResponse a : live) {
            nextLeague.put(a.id(), a.league());
        }
        // Juda kichik liga (masalan test ma'lumotida bir necha kishilik guruh) bo'lsa, bitta ishchi
        // shu bir finalizeMonth chaqiruvida ham ko'tarilishga (pastki liganing top-5'i sifatida),
        // ham tushirilishga (yuqori liganing bottom-5'i sifatida, keyingi juftlikda) loyiq chiqishi
        // mumkin. `promoted` shu ishchilarni belgilab, keyinroq tushirilishini oldini oladi — aks
        // holda oxirgi (demote) yozuv avvalgi (promote) yozuvni bosib, ko'tarilish yo'qolib qolardi.
        Set<Long> promoted = new HashSet<>();
        for (int i = 0; i < LEAGUE_KEYS.length - 1; i++) {
            String upper = LEAGUE_KEYS[i];
            String lower = LEAGUE_KEYS[i + 1];
            List<AgentResponse> upperGroup = byLeague.getOrDefault(upper, List.of());
            List<AgentResponse> lowerGroup = byLeague.getOrDefault(lower, List.of());

            int promoteCount = Math.min(5, lowerGroup.size());
            for (AgentResponse a : lowerGroup) {
                if (a.place() <= promoteCount) {
                    nextLeague.put(a.id(), upper);
                    promoted.add(a.id());
                }
            }
            int demoteCount = Math.min(5, upperGroup.size());
            int demoteThreshold = upperGroup.size() - demoteCount;
            for (AgentResponse a : upperGroup) {
                if (a.place() > demoteThreshold && !promoted.contains(a.id())) {
                    nextLeague.put(a.id(), lower);
                }
            }
        }
        for (Map.Entry<Long, String> e : nextLeague.entrySet()) {
            ishchiById.get(e.getKey()).setBoshlangichLiga(Liga.valueOf(e.getValue().toUpperCase()));
        }
    }

    /** Har bir o'tgan oy uchun umumiy 1-o'rinni egallagan ishchi(lar)ga bittadan trophy qo'shiladi. */
    private Map<Long, Integer> computeTrophies(LocalDate currentOy) {
        List<LocalDate> pastMonths = natijaRepository.findDistinctPastMonths(currentOy);
        Map<Long, Integer> trophies = new HashMap<>();
        for (LocalDate month : pastMonths) {
            Map<Long, int[]> sums = sumByIshchi(natijaRepository.findAllByOy(month));
            double best = -1;
            List<Long> winners = new ArrayList<>();
            for (Map.Entry<Long, int[]> e : sums.entrySet()) {
                double percent = overallPercent(e.getValue()[1], e.getValue()[0]);
                if (percent > best) {
                    best = percent;
                    winners.clear();
                    winners.add(e.getKey());
                } else if (percent == best) {
                    winners.add(e.getKey());
                }
            }
            for (Long w : winners) {
                trophies.merge(w, 1, Integer::sum);
            }
        }
        return trophies;
    }

    public List<RankedUserResponse> computeSupervayzerReyting(LocalDate oy) {
        List<User> supervayzerlar = userRepository.findByRoleOrderByFamiliyaAsc(Role.SUPERVAYZER);
        Map<Long, int[]> sums = new HashMap<>();
        for (OylikNatija n : natijaRepository.findAllByOy(oy.withDayOfMonth(1))) {
            Long supId = n.getIshchi().getSupervayzer().getId();
            int[] s = sums.computeIfAbsent(supId, k -> new int[2]);
            s[0] += n.getPlan();
            s[1] += n.getBajarildi();
        }
        return rankUsers(supervayzerlar, sums);
    }

    public List<RankedUserResponse> computeMenejerReyting(LocalDate oy) {
        List<User> menejerlar = userRepository.findByRoleOrderByFamiliyaAsc(Role.MENEJER);
        Map<Long, int[]> sums = new HashMap<>();
        for (OylikNatija n : natijaRepository.findAllByOy(oy.withDayOfMonth(1))) {
            User createdBy = n.getIshchi().getSupervayzer().getCreatedBy();
            if (createdBy == null) continue;
            int[] s = sums.computeIfAbsent(createdBy.getId(), k -> new int[2]);
            s[0] += n.getPlan();
            s[1] += n.getBajarildi();
        }
        return rankUsers(menejerlar, sums);
    }

    private List<RankedUserResponse> rankUsers(List<User> users, Map<Long, int[]> sums) {
        record Scored(User user, double percent, boolean hasData) {
        }
        List<Scored> scored = users.stream()
                .map(u -> {
                    boolean hasData = sums.containsKey(u.getId());
                    int[] s = sums.getOrDefault(u.getId(), new int[2]);
                    return new Scored(u, overallPercent(s[1], s[0]), hasData);
                })
                .sorted(Comparator.comparing((Scored s) -> !s.hasData())
                        .thenComparing(Comparator.comparingDouble(Scored::percent).reversed()))
                .toList();

        List<RankedUserResponse> result = new ArrayList<>();
        for (int idx = 0; idx < scored.size(); idx++) {
            Scored s = scored.get(idx);
            int place = idx + 1;
            int points = s.hasData() ? pointsForPlace(place) : 0;
            result.add(new RankedUserResponse(s.user().getId(), place, s.user().getFullName(),
                    round1(s.percent()), place, points));
        }
        return result;
    }

    /** So'nggi `oyCount` oy bo'yicha supervayzerlar scoreboard'i (oxirgi oy joriy oy hisoblanadi). */
    public List<ScoreboardRowResponse> computeSupervayzerTarix(int oyCount) {
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        List<LocalDate> months = new ArrayList<>();
        for (int i = oyCount - 1; i >= 0; i--) {
            months.add(currentMonth.minusMonths(i));
        }
        List<User> supervayzerlar = userRepository.findByRoleOrderByFamiliyaAsc(Role.SUPERVAYZER);

        Map<LocalDate, Map<Long, Double>> percentByMonth = new LinkedHashMap<>();
        Map<LocalDate, Map<Long, Integer>> pointsByMonth = new LinkedHashMap<>();
        for (LocalDate month : months) {
            Map<Long, int[]> sums = new HashMap<>();
            for (OylikNatija n : natijaRepository.findAllByOy(month)) {
                Long supId = n.getIshchi().getSupervayzer().getId();
                int[] s = sums.computeIfAbsent(supId, k -> new int[2]);
                s[0] += n.getPlan();
                s[1] += n.getBajarildi();
            }
            Map<Long, Double> percents = new HashMap<>();
            for (User u : supervayzerlar) {
                int[] s = sums.getOrDefault(u.getId(), new int[2]);
                percents.put(u.getId(), overallPercent(s[1], s[0]));
            }
            // Faqat shu oy uchun haqiqiy natija kiritilganlar ballanadi va joy oladi —
            // natija kiritilmagan supervayzer 0% bo'lib ko'rinadi, lekin ball olmaydi.
            List<Long> withData = supervayzerlar.stream()
                    .map(User::getId)
                    .filter(sums::containsKey)
                    .sorted(Comparator.comparingDouble((Long id) -> percents.get(id)).reversed())
                    .toList();
            Map<Long, Integer> points = new HashMap<>();
            for (int idx = 0; idx < withData.size(); idx++) {
                points.put(withData.get(idx), pointsForPlace(idx + 1));
            }
            percentByMonth.put(month, percents);
            pointsByMonth.put(month, points);
        }

        List<ScoreboardRowResponse> rows = new ArrayList<>();
        for (User u : supervayzerlar) {
            List<ScoreboardRowResponse.MonthPoint> monthPoints = new ArrayList<>();
            double percentSum = 0;
            int totalPoints = 0;
            for (LocalDate month : months) {
                double percent = percentByMonth.get(month).getOrDefault(u.getId(), 0.0);
                int ball = pointsByMonth.get(month).getOrDefault(u.getId(), 0);
                monthPoints.add(new ScoreboardRowResponse.MonthPoint(month.toString(), round1(percent), ball));
                percentSum += percent;
                totalPoints += ball;
            }
            rows.add(new ScoreboardRowResponse(u.getId(), 0, u.getFullName(), monthPoints,
                    round1(percentSum / Math.max(1, months.size())), totalPoints));
        }
        rows.sort(Comparator.comparingInt(ScoreboardRowResponse::jamiBall).reversed());

        List<ScoreboardRowResponse> withPlace = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            ScoreboardRowResponse r = rows.get(i);
            withPlace.add(new ScoreboardRowResponse(r.id(), i + 1, r.fullName(), r.oylar(), r.ortachaPercent(), r.jamiBall()));
        }
        return withPlace;
    }

    /** Berilgan yilning 12 oyi bo'yicha jami plan/bajarildi (barcha ishchilar kesimida) — dashboard grafigi uchun. */
    public List<YillikOyResponse> computeYillikStatistika(int yil) {
        List<YillikOyResponse> result = new ArrayList<>();
        for (int oy = 1; oy <= 12; oy++) {
            LocalDate month = LocalDate.of(yil, oy, 1);
            int plan = 0;
            int fakt = 0;
            for (OylikNatija n : natijaRepository.findAllByOy(month)) {
                plan += n.getPlan();
                fakt += n.getBajarildi();
            }
            result.add(new YillikOyResponse(month.toString(), plan, fakt));
        }
        return result;
    }

    /**
     * Yillik yakuniy reyting (Nizom "Atamalar" — Yillik reyting, XIII BOB, VII BOB nominatsiyalari):
     * har ishchining 12 oylik ballari jamlanadi, har ishchi o'zining HOZIRGI (yil oxiridagi) ligasi
     * ichida X BOB'dagi teng ball tartibi bo'yicha saralanadi — jami ball, so'ng ko'proq 1-o'rin,
     * so'ng ko'proq 2-o'rin, so'ng ko'proq 3-o'rin, so'ng o'rtacha % (barchasi teng bo'lsa yakuniy
     * qaror Tashkilotchiga qoladi — bu avtomatlashtirilmaydi). Liga ichidagi 1-o'rin shu liganing
     * yillik nominatsiya g'olibi hisoblanadi.
     */
    public List<YillikIshchiResponse> computeYillikIshchiReyting(int yil) {
        List<Ishchi> ishchilar = ishchiRepository.findAllWithRefs();

        Map<Long, Integer> totalBall = new HashMap<>();
        Map<Long, Integer> firstPlaces = new HashMap<>();
        Map<Long, Integer> secondPlaces = new HashMap<>();
        Map<Long, Integer> thirdPlaces = new HashMap<>();
        Map<Long, Double> percentSum = new HashMap<>();

        for (int oy = 1; oy <= 12; oy++) {
            LocalDate month = LocalDate.of(yil, oy, 1);
            for (AgentResponse a : computeIshchiReyting(month)) {
                totalBall.merge(a.id(), a.points(), Integer::sum);
                percentSum.merge(a.id(), a.percent(), Double::sum);
                // Ma'lumot bo'lmagan oyda ham "1-o'rin" bo'lib chiqishi mumkin (masalan liga bo'sh
                // bo'lsa), lekin bu haqiqiy g'alaba emas — shuning uchun faqat ball>0 (haqiqiy
                // natija bo'lgan) oylardagi o'rinlar teng ball tartibida hisobga olinadi.
                if (a.points() > 0) {
                    if (a.place() == 1) firstPlaces.merge(a.id(), 1, Integer::sum);
                    else if (a.place() == 2) secondPlaces.merge(a.id(), 1, Integer::sum);
                    else if (a.place() == 3) thirdPlaces.merge(a.id(), 1, Integer::sum);
                }
            }
        }

        record Scored(Ishchi ishchi, int total, int firsts, int seconds, int thirds, double avgPercent) {
        }

        Map<String, List<Scored>> byLeague = new LinkedHashMap<>();
        for (String key : LEAGUE_KEYS) {
            byLeague.put(key, new ArrayList<>());
        }
        for (Ishchi i : ishchilar) {
            String league = i.getBoshlangichLiga() != null ? i.getBoshlangichLiga().key() : "rising";
            double avg = percentSum.getOrDefault(i.getId(), 0.0) / 12.0;
            byLeague.get(league).add(new Scored(
                    i,
                    totalBall.getOrDefault(i.getId(), 0),
                    firstPlaces.getOrDefault(i.getId(), 0),
                    secondPlaces.getOrDefault(i.getId(), 0),
                    thirdPlaces.getOrDefault(i.getId(), 0),
                    avg
            ));
        }
        for (List<Scored> group : byLeague.values()) {
            group.sort(Comparator.comparingInt(Scored::total).reversed()
                    .thenComparing(Comparator.comparingInt(Scored::firsts).reversed())
                    .thenComparing(Comparator.comparingInt(Scored::seconds).reversed())
                    .thenComparing(Comparator.comparingInt(Scored::thirds).reversed())
                    .thenComparing(Comparator.comparingDouble(Scored::avgPercent).reversed()));
        }

        List<YillikIshchiResponse> result = new ArrayList<>();
        for (String league : LEAGUE_KEYS) {
            int place = 0;
            for (Scored s : byLeague.get(league)) {
                place++;
                String nomination = place == 1 && s.total() > 0 ? LEAGUE_NOMINATIONS.get(league) : null;
                result.add(new YillikIshchiResponse(
                        s.ishchi().getId(),
                        s.ishchi().getIsm(),
                        s.ishchi().getFamiliya(),
                        s.ishchi().getIsm() + " " + s.ishchi().getFamiliya(),
                        s.ishchi().getSupervayzer().getFullName(),
                        s.ishchi().getRasm(),
                        league,
                        place,
                        nomination,
                        s.total(),
                        s.firsts(),
                        s.seconds(),
                        s.thirds(),
                        round1(s.avgPercent())
                ));
            }
        }
        return result;
    }

    /**
     * Yillik yakuniy Supervayzer reytingi (MICCO Supervisor League Nizomi — "Yillik nominatsiya"
     * va "Teng ball" bo'limlari): 12 oylik ballari jamlanadi, teng ball bo'lsa Nizomdagi tartib
     * bilan ajratiladi — ko'proq 1-o'rin, so'ng ko'proq 2-o'rin, so'ng ko'proq 3-o'rin, so'ng
     * o'rtacha KPI foizi yuqoriroq bo'lgan supervayzer ustun turadi (liga tushunchasi yo'q,
     * yagona reyting). 1-o'rin — "Supervisor of the Year | Elite Supervisor" nomzodi.
     */
    public List<YillikSupervayzerResponse> computeYillikSupervayzerReyting(int yil) {
        List<User> supervayzerlar = userRepository.findByRoleOrderByFamiliyaAsc(Role.SUPERVAYZER);

        Map<Long, Integer> totalBall = new HashMap<>();
        Map<Long, Integer> firstPlaces = new HashMap<>();
        Map<Long, Integer> secondPlaces = new HashMap<>();
        Map<Long, Integer> thirdPlaces = new HashMap<>();
        Map<Long, Double> percentSum = new HashMap<>();

        for (int oy = 1; oy <= 12; oy++) {
            LocalDate month = LocalDate.of(yil, oy, 1);
            for (RankedUserResponse r : computeSupervayzerReyting(month)) {
                totalBall.merge(r.id(), r.monthPoints(), Integer::sum);
                percentSum.merge(r.id(), r.percent(), Double::sum);
                // Faqat haqiqiy ball olingan oydagi o'rin hisobga olinadi (bo'sh oyda "1-o'rin"
                // bo'lib chiqishi mumkin, lekin bu haqiqiy g'alaba emas).
                if (r.monthPoints() > 0) {
                    if (r.place() == 1) firstPlaces.merge(r.id(), 1, Integer::sum);
                    else if (r.place() == 2) secondPlaces.merge(r.id(), 1, Integer::sum);
                    else if (r.place() == 3) thirdPlaces.merge(r.id(), 1, Integer::sum);
                }
            }
        }

        record Scored(User user, int total, int firsts, int seconds, int thirds, double avgPercent) {
        }

        List<Scored> scored = supervayzerlar.stream()
                .map(u -> new Scored(
                        u,
                        totalBall.getOrDefault(u.getId(), 0),
                        firstPlaces.getOrDefault(u.getId(), 0),
                        secondPlaces.getOrDefault(u.getId(), 0),
                        thirdPlaces.getOrDefault(u.getId(), 0),
                        percentSum.getOrDefault(u.getId(), 0.0) / 12.0
                ))
                .sorted(Comparator.comparingInt(Scored::total).reversed()
                        .thenComparing(Comparator.comparingInt(Scored::firsts).reversed())
                        .thenComparing(Comparator.comparingInt(Scored::seconds).reversed())
                        .thenComparing(Comparator.comparingInt(Scored::thirds).reversed())
                        .thenComparing(Comparator.comparingDouble(Scored::avgPercent).reversed()))
                .toList();

        List<YillikSupervayzerResponse> result = new ArrayList<>();
        int place = 0;
        for (Scored s : scored) {
            place++;
            String nomination = place == 1 && s.total() > 0 ? "Supervisor of the Year | Elite Supervisor" : null;
            result.add(new YillikSupervayzerResponse(
                    s.user().getId(), s.user().getFullName(), place, nomination,
                    s.total(), s.firsts(), s.seconds(), s.thirds(), round1(s.avgPercent())
            ));
        }
        return result;
    }
}
