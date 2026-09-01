package org.example.newreyting.rating;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Har kuni soat 00:10 da har bir ishchining shu kungacha bo'lgan jonli o'rnini "kechagi" bazaviy
 * qiymat sifatida yozib qo'yadi (PlaceHistoryService), shunda "Bugun/Kecha" trend strelkasi
 * ANIQ kunlik farqni ko'rsatadi: masalan, biror ishchi kecha 7-o'rinda bo'lib, bugun 2-o'ringa
 * chiqsa, "kecha" ustuni 7 bo'lib, "bugun" ustuni jonli hisoblanib 2 bo'lib qoladi — ertaga soat
 * 00:10 da esa "kecha" ham 2 ga yangilanadi. MonthlySettlementScheduler (00:05) bilan
 * to'qnashmasligi uchun 5 daqiqa keyinroq ishga tushadi.
 */
@Component
public class DailyPlaceSnapshotScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyPlaceSnapshotScheduler.class);

    private final RatingService ratingService;

    public DailyPlaceSnapshotScheduler(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @Scheduled(cron = "0 10 0 * * *")
    public void refreshDailySnapshots() {
        try {
            ratingService.refreshDailyPlaceSnapshots();
            log.info("Kunlik o'rin bazaviy qiymati (bugun/kecha) muvaffaqiyatli yangilandi");
        } catch (Exception e) {
            // Xato bo'lsa ham keyingi kunlik tekshiruvlar to'xtab qolmasligi uchun yutib yuboriladi
            // (MonthlySettlementScheduler'dagi bilan bir xil mulohaza).
            log.error("Kunlik o'rin bazaviy qiymatini yangilashda xatolik", e);
        }
    }
}
