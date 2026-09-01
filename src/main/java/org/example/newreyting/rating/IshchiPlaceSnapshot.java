package org.example.newreyting.rating;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Joriy (hali muzlatilmagan) oy uchun ishchining OXIRGI MA'LUM o'rni — bazada saqlanadi,
 * shuning uchun backend qayta ishga tushirilsa/deploy qilinsa ham yo'qolmaydi. Frontenddagi
 * "Bugun/Kecha" trend strelkasi shu yozuv asosida ishlaydi: har jonli hisoblashda "bugun" =
 * shu safargi o'rin, "kecha" = shu yerda saqlangan (oldingi) o'rin. Yozuv har safar emas,
 * faqat {@code updatedAt}dan beri ma'lum vaqt (RatingService.BASELINE_REFRESH_MS) o'tganda
 * yangilanadi — shunda o'zgarish darrov "tekis"ga qaytib ketmay, biroz vaqt ko'rinib turadi.
 */
@Entity
@Table(name = "ishchi_place_snapshot", uniqueConstraints = @UniqueConstraint(columnNames = {"ishchi_id", "oy"}))
public class IshchiPlaceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ishchi_id", nullable = false)
    private Long ishchiId;

    @Column(nullable = false)
    private LocalDate oy;

    @Column(nullable = false)
    private int place;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    protected IshchiPlaceSnapshot() {
    }

    public IshchiPlaceSnapshot(Long ishchiId, LocalDate oy, int place) {
        this.ishchiId = ishchiId;
        this.oy = oy;
        this.place = place;
    }

    public Long getId() {
        return id;
    }

    public Long getIshchiId() {
        return ishchiId;
    }

    public LocalDate getOy() {
        return oy;
    }

    public int getPlace() {
        return place;
    }

    public void setPlace(int place) {
        this.place = place;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
