package org.example.newreyting.rating;

import org.example.newreyting.rating.dto.AgentResponse;
import org.example.newreyting.rating.dto.IshchiTarixResponse;
import org.example.newreyting.rating.dto.RahbarTarixResponse;
import org.example.newreyting.rating.dto.RankedUserResponse;
import org.example.newreyting.rating.dto.ScoreboardRowResponse;
import org.example.newreyting.rating.dto.YillikIshchiResponse;
import org.example.newreyting.rating.dto.YillikOyResponse;
import org.example.newreyting.rating.dto.YillikSupervayzerResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Hisoblangan reyting — faqat o'qish, login talab qilmaydi (ochiq reyting sahifalari uchun). */
@RestController
@RequestMapping("/api/reyting")
public class RatingController {

    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @GetMapping("/ishchi")
    public List<AgentResponse> ishchi(@RequestParam LocalDate oy) {
        return ratingService.computeIshchiReyting(oy);
    }

    @GetMapping("/supervayzer")
    public List<RankedUserResponse> supervayzer(@RequestParam LocalDate oy) {
        return ratingService.computeSupervayzerReyting(oy);
    }

    @GetMapping("/menejer")
    public List<RankedUserResponse> menejer(@RequestParam LocalDate oy) {
        return ratingService.computeMenejerReyting(oy);
    }

    @GetMapping("/supervayzer/tarix")
    public List<ScoreboardRowResponse> supervayzerTarix(
            @RequestParam(defaultValue = "5") int oyCount,
            @RequestParam(required = false) LocalDate oy) {
        return ratingService.computeSupervayzerTarix(oyCount, oy);
    }

    /** Berilgan yilning barcha 12 oyi — hisobot (dashboard eksport) uchun, {@link RatingService#computeSupervayzerTarixYillik}. */
    @GetMapping("/supervayzer/tarix-yillik")
    public List<ScoreboardRowResponse> supervayzerTarixYillik(@RequestParam int yil) {
        return ratingService.computeSupervayzerTarixYillik(yil);
    }

    @GetMapping("/yillik")
    public List<YillikOyResponse> yillik(@RequestParam int yil) {
        return ratingService.computeYillikStatistika(yil);
    }

    @GetMapping("/ishchi/yillik")
    public List<YillikIshchiResponse> ishchiYillik(@RequestParam int yil) {
        return ratingService.computeYillikIshchiReyting(yil);
    }

    @GetMapping("/supervayzer/yillik")
    public List<YillikSupervayzerResponse> supervayzerYillik(@RequestParam int yil) {
        return ratingService.computeYillikSupervayzerReyting(yil);
    }

    /** 12 oylik tarix jadvali (/reyting/tarix, Agent) — bitta so'rovda, oy sayin 12 marta chaqirish o'rniga. */
    @GetMapping("/ishchi/tarix-yillik-matritsa")
    public List<IshchiTarixResponse> ishchiTarixYillikMatritsa(@RequestParam int yil, @RequestParam String liga) {
        return ratingService.computeIshchiTarixYillik(yil, liga);
    }

    /** 12 oylik tarix jadvali (/reyting/tarix, Supervayzer) — bitta so'rovda. */
    @GetMapping("/supervayzer/tarix-yillik-matritsa")
    public List<RahbarTarixResponse> supervayzerTarixYillikMatritsa(@RequestParam int yil) {
        return ratingService.computeSupervayzerTarixYillikMatritsa(yil);
    }

    /** 12 oylik tarix jadvali (/reyting/tarix, Menejer) — bitta so'rovda. */
    @GetMapping("/menejer/tarix-yillik-matritsa")
    public List<RahbarTarixResponse> menejerTarixYillikMatritsa(@RequestParam int yil) {
        return ratingService.computeMenejerTarixYillikMatritsa(yil);
    }

    /**
     * Oyni qo'lda yakunlash — odatda MonthlySettlementScheduler avtomatik bajaradi
     * (har oyning 1-kunida o'tgan oy uchun), bu esa admin uchun zaxira/qo'lda ishga
     * tushirish imkoniyati (masalan, backend o'sha kuni ishlamagan bo'lsa).
     */
    @PostMapping("/oy-yakunlash")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void oyYakunlash(@RequestParam LocalDate oy) {
        ratingService.finalizeMonth(oy);
    }

    /**
     * "Bugun/Kecha" bazaviy qiymatini qo'lda yangilash — odatda DailyPlaceSnapshotScheduler
     * avtomatik bajaradi (har kuni soat 00:10 da), bu esa admin uchun zaxira/test imkoniyati.
     */
    @PostMapping("/kunlik-orin-yangilash")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void kunlikOrinYangilash() {
        ratingService.refreshDailyPlaceSnapshots();
    }

    /**
     * BIR MARTALIK migratsiya: foiz formulasi o'zgargandan keyin (mahsulot/paket kesimidagi
     * og'irliksiz o'rtacha) allaqachon yakunlangan (MUZLATILGAN) o'tgan oylarni yangi formula
     * bo'yicha qayta hisoblaydi. Liga a'zoligi o'zgarmaydi — faqat foiz/o'rin/ball yangilanadi.
     * Odatiy holatda avtomatik chaqirilmaydi, faqat admin bir marta qo'lda ishga tushiradi.
     */
    @PostMapping("/qayta-hisobla")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void qaytaHisobla() {
        ratingService.recomputeFrozenMonths();
    }
}
