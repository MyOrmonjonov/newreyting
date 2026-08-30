package org.example.newreyting.rating;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Har oyning 1-kunida o'tgan oyni avtomatik yakunlaydi (RatingService.finalizeMonth) —
 * Nizom V BOB'idagi liga almashish qoidasini qo'llaydi va o'tgan oy natijasini muzlatadi.
 * Har kuni soat 00:05 da tekshiradi (faqat oyning 1-kunida ish bajaradi); finalizeMonth
 * o'zi ikki marta chaqirilishdan himoyalangan (allaqachon yakunlangan oyni qayta ishlamaydi).
 */
@Component
public class MonthlySettlementScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonthlySettlementScheduler.class);

    private final RatingService ratingService;

    public MonthlySettlementScheduler(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @Scheduled(cron = "0 5 0 * * *")
    public void checkAndFinalizePreviousMonth() {
        LocalDate today = LocalDate.now();
        if (today.getDayOfMonth() != 1) {
            return;
        }
        LocalDate previousMonth = today.minusMonths(1).withDayOfMonth(1);
        log.info("Oylik yakunlash: {} oyi avtomatik yakunlanmoqda", previousMonth);
        try {
            ratingService.finalizeMonth(previousMonth);
            log.info("Oylik yakunlash: {} oyi muvaffaqiyatli yakunlandi", previousMonth);
        } catch (Exception e) {
            // finalizeMonth @Transactional — xato bo'lsa hech narsa yarim saqlanmaydi (butunlay
            // orqaga qaytadi), shuning uchun keyingi kunlarda admin /api/reyting/oy-yakunlash
            // orqali qo'lda qayta urinib ko'rishi mumkin. Bu yerda xatoni yutib yuborish — bitta
            // oy yakunlanmay qolishi butun backend/keyingi kunlik tekshiruvlarni to'xtatib
            // qo'ymasligi uchun muhim.
            log.error("Oylik yakunlash: {} oyini yakunlashda xatolik — keyinroq /api/reyting/oy-yakunlash orqali qo'lda urinib ko'ring", previousMonth, e);
        }
    }
}
