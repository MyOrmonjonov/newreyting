package org.example.newreyting.rating;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

/**
 * "Bugun/Kecha" trend strelkasi uchun oldingi (kechagi) o'rinni bazada saqlaydi (RatingService
 * o'zi {@code @Transactional(readOnly = true)} bo'lgani uchun bu yozish ishi alohida bean'da,
 * o'z (yozishga ruxsat beruvchi, {@code REQUIRES_NEW}) tranzaksiyasi bilan bajariladi).
 *
 * Saqlangan qiymat faqat {@link #updateSnapshot} orqali (DailyPlaceSnapshotScheduler tomonidan,
 * har kuni bir marta) oldinga suriladi — kun ichida necha marta so'ralmasin, "kecha" qiymati
 * o'zgarmay turadi, "bugun" esa har doim jonli hisoblanadi (RatingService.computeLiveIshchiReyting).
 *
 * DIQQAT: bir ishchi uchun shu oydagi BIRINCHI yozuv bir nechta so'rov bir vaqtda kelganda
 * (masalan bir nechta TV ekrani) ikkalasi ham "hali yo'q" deb topib, ikkalasi ham INSERT qilishga
 * urinishi mumkin — buni (ishchi_id, oy) unique constraint to'sadi va yutgan tomon
 * DataIntegrityViolationException oladi. Bu metodlar buni O'ZI YUTMAYDI (Postgres'da xato bergan
 * tranzaksiya "aborted" holatga o'tadi — o'sha TRANZAKSIYA ICHIDA qayta o'qishga urinish ham xato
 * beradi) — chaqiruvchi (RatingService) xatoni ushlab, shu metodni QAYTA (yangi tranzaksiya bilan)
 * chaqirishi kerak, o'sha safar qator allaqachon mavjud bo'lgani uchun oddiy o'qish bilan tugaydi.
 */
@Service
public class PlaceHistoryService {

    private final IshchiPlaceSnapshotRepository repository;

    public PlaceHistoryService(IshchiPlaceSnapshotRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int previousPlace(LocalDate month, Long ishchiId, int currentPlace) {
        return repository.findByIshchiIdAndOy(ishchiId, month)
                .map(IshchiPlaceSnapshot::getPlace)
                .orElseGet(() -> {
                    repository.save(new IshchiPlaceSnapshot(ishchiId, month, currentPlace));
                    return currentPlace;
                });
    }

    /** Joriy o'rinni "kechagi" bazaviy qiymat sifatida yozadi (har kuni bir marta chaqiriladi). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateSnapshot(LocalDate month, Long ishchiId, int place) {
        var existing = repository.findByIshchiIdAndOy(ishchiId, month);
        if (existing.isPresent()) {
            IshchiPlaceSnapshot snapshot = existing.get();
            snapshot.setPlace(place);
            snapshot.setUpdatedAt(Instant.now());
            repository.save(snapshot);
        } else {
            repository.save(new IshchiPlaceSnapshot(ishchiId, month, place));
        }
    }
}
