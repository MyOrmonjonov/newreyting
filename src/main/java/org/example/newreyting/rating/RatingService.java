package org.example.newreyting.rating;

import org.example.newreyting.employee.Ishchi;
import org.example.newreyting.employee.IshchiRepository;
import org.example.newreyting.rating.dto.AgentResponse;
import org.example.newreyting.rating.dto.RankedUserResponse;
import org.example.newreyting.rating.dto.ScoreboardRowResponse;
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

    private final IshchiRepository ishchiRepository;
    private final OylikNatijaRepository natijaRepository;
    private final UserRepository userRepository;

    public RatingService(IshchiRepository ishchiRepository, OylikNatijaRepository natijaRepository, UserRepository userRepository) {
        this.ishchiRepository = ishchiRepository;
        this.natijaRepository = natijaRepository;
        this.userRepository = userRepository;
    }

    // Mezon: 1-o'rin = 24, 2 = 22, 3 = 20, 4-22-o'rin = har biriga -1, 23+ = 0
    public static int pointsForPlace(int place) {
        if (place == 1) return 24;
        if (place == 2) return 22;
        if (place == 3) return 20;
        if (place >= 4 && place <= 22) return 23 - place;
        return 0;
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
        int bucketSize = n == 0 ? 1 : (int) Math.ceil(n / 5.0);

        // Avval global % bo'yicha kvintil bilan liga belgilanadi, so'ng har bir liga o'z ichida
        // mustaqil qayta raqamlanadi (1-o'rin har ligada ham 24 ball) — demo'dagi buildLeague()
        // xatti-harakati bilan bir xil (har liga alohida mustaqil reyting).
        Map<String, List<Scored>> byLeague = new LinkedHashMap<>();
        for (String key : LEAGUE_KEYS) {
            byLeague.put(key, new ArrayList<>());
        }
        for (int idx = 0; idx < n; idx++) {
            String league = LEAGUE_KEYS[Math.min(4, idx / bucketSize)];
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
                        pointsForPlace(place),
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
}
