package org.example.newreyting.rating;

import org.example.newreyting.employee.Ishchi;
import org.example.newreyting.employee.IshchiRepository;
import org.example.newreyting.rating.dto.AgentResponse;
import org.example.newreyting.rating.dto.RankedUserResponse;
import org.example.newreyting.rating.dto.ScoreboardRowResponse;
import org.example.newreyting.rating.dto.YillikOyResponse;
import org.example.newreyting.result.OylikNatija;
import org.example.newreyting.result.OylikNatijaRepository;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
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
    // MICCO Sales League Nizomi II BOB: "Har bir liga ishtirokchilari 27 nafar agentdan iborat".
    private static final int FIXED_LEAGUE_SIZE = 27;

    private final IshchiRepository ishchiRepository;
    private final OylikNatijaRepository natijaRepository;
    private final UserRepository userRepository;

    public RatingService(IshchiRepository ishchiRepository, OylikNatijaRepository natijaRepository, UserRepository userRepository) {
        this.ishchiRepository = ishchiRepository;
        this.natijaRepository = natijaRepository;
        this.userRepository = userRepository;
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

    private Map<Long, int[]> sumByIshchi(List<OylikNatija> rows) {
        Map<Long, int[]> sums = new HashMap<>();
        for (OylikNatija n : rows) {
            int[] s = sums.computeIfAbsent(n.getIshchi().getId(), k -> new int[2]);
            s[0] += n.getPlan();
            s[1] += n.getBajarildi();
        }
        return sums;
    }

    public List<AgentResponse> computeIshchiReyting(LocalDate oy) {
        LocalDate month = oy.withDayOfMonth(1);
        List<Ishchi> ishchilar = ishchiRepository.findAllWithRefs();
        Map<Long, int[]> sums = sumByIshchi(natijaRepository.findAllByOy(month));
        Map<Long, Integer> trophiesByIshchi = computeTrophies(month);

        record Scored(Ishchi ishchi, double percent) {
        }

        // Shu oy uchun natija kiritilgan ishchilar — real % bo'yicha kvintil bilan ligaga bo'linadi.
        // Natija hali kiritilmagan ishchilar (masalan, endigina qo'shilgan, tajribali xodim) — real
        // % hisoblanmagani uchun global reytingga aralashtirilmaydi, o'rniga ularning qo'lda belgilangan
        // `boshlangichLiga`si (yoki standart "rising") bo'yicha o'sha liganing oxiriga qo'shiladi.
        List<Ishchi> hasData = new ArrayList<>();
        List<Ishchi> noData = new ArrayList<>();
        for (Ishchi i : ishchilar) {
            if (sums.containsKey(i.getId())) hasData.add(i); else noData.add(i);
        }

        List<Scored> scored = hasData.stream()
                .map(i -> {
                    int[] s = sums.get(i.getId());
                    return new Scored(i, overallPercent(s[1], s[0]));
                })
                .sorted(Comparator.comparingDouble(Scored::percent).reversed())
                .toList();

        int n = scored.size();

        // MICCO Sales League Nizomi II BOB: har bir liga (diamond/gold/silver/bronze) qat'iy
        // 27 nafar agentdan iborat, kvintil (n/5) emas — global % bo'yicha saralangan ro'yxatdan
        // ketma-ket 27 tadan bo'lib olinadi, qolgani (odatda eng past %) rising ligaga tushadi.
        Map<String, List<Scored>> byLeague = new LinkedHashMap<>();
        for (String key : LEAGUE_KEYS) {
            byLeague.put(key, new ArrayList<>());
        }
        for (int idx = 0; idx < n; idx++) {
            int leagueIdx = Math.min(4, idx / FIXED_LEAGUE_SIZE);
            String league = LEAGUE_KEYS[leagueIdx];
            byLeague.get(league).add(scored.get(idx));
        }
        for (Ishchi i : noData) {
            String league = i.getBoshlangichLiga() != null ? i.getBoshlangichLiga().key() : "rising";
            byLeague.get(league).add(new Scored(i, 0.0));
        }

        List<AgentResponse> result = new ArrayList<>();
        for (String league : LEAGUE_KEYS) {
            int place = 0;
            for (Scored s : byLeague.get(league)) {
                place++;
                int years = Period.between(s.ishchi().getIshGaKirganSana(), LocalDate.now()).getYears();
                result.add(new AgentResponse(
                        s.ishchi().getId(),
                        place,
                        s.ishchi().getIsm(),
                        s.ishchi().getFamiliya(),
                        s.ishchi().getIsm() + " " + s.ishchi().getFamiliya(),
                        s.ishchi().getSupervayzer().getFullName(),
                        round1(s.percent()),
                        pointsForLeague(league, place),
                        place,
                        place,
                        trophiesByIshchi.getOrDefault(s.ishchi().getId(), 0),
                        years,
                        league,
                        s.ishchi().getRasm()
                ));
            }
        }
        return result;
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
        record Scored(User user, double percent) {
        }
        List<Scored> scored = users.stream()
                .map(u -> {
                    int[] s = sums.getOrDefault(u.getId(), new int[2]);
                    return new Scored(u, overallPercent(s[1], s[0]));
                })
                .sorted(Comparator.comparingDouble(Scored::percent).reversed())
                .toList();

        List<RankedUserResponse> result = new ArrayList<>();
        for (int idx = 0; idx < scored.size(); idx++) {
            Scored s = scored.get(idx);
            int place = idx + 1;
            result.add(new RankedUserResponse(s.user().getId(), place, s.user().getFullName(),
                    round1(s.percent()), place, pointsForPlace(place)));
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
            List<Map.Entry<Long, Double>> ranked = percents.entrySet().stream()
                    .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                    .toList();
            Map<Long, Integer> points = new HashMap<>();
            for (int idx = 0; idx < ranked.size(); idx++) {
                points.put(ranked.get(idx).getKey(), pointsForPlace(idx + 1));
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
}
