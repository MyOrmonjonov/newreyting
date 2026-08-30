package org.example.newreyting.rating;

import jakarta.persistence.*;
import org.example.newreyting.employee.Ishchi;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Bir oy uchun MUZLATILGAN (yakunlangan) ishchi reytingi yozuvi. Oy yakunlangandan keyin
 * (MonthlySettlementService) shu oy uchun qayta hisoblanmaydi — Nizomdagi apellyatsiya
 * jarayoni yakunlangan natijaning barqaror qolishini talab qiladi. Joriy (hali yakunlanmagan)
 * oy uchun bunday yozuv yo'q — RatingService uni har doim jonli hisoblaydi.
 */
@Entity
@Table(name = "oylik_yakun", uniqueConstraints = @UniqueConstraint(columnNames = {"ishchi_id", "oy"}))
public class OylikYakun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ishchi_id", nullable = false)
    private Ishchi ishchi;

    @Column(nullable = false)
    private LocalDate oy;

    /** Ishchi shu oyda musobaqalashgan liga (finalize vaqtidagi holat, keyin o'zgarmaydi). */
    @Column(nullable = false)
    private String liga;

    @Column(nullable = false)
    private int place;

    @Column(nullable = false)
    private int ball;

    @Column(nullable = false)
    private double percent;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected OylikYakun() {
    }

    public OylikYakun(Ishchi ishchi, LocalDate oy, String liga, int place, int ball, double percent) {
        this.ishchi = ishchi;
        this.oy = oy;
        this.liga = liga;
        this.place = place;
        this.ball = ball;
        this.percent = percent;
    }

    public Long getId() {
        return id;
    }

    public Ishchi getIshchi() {
        return ishchi;
    }

    public LocalDate getOy() {
        return oy;
    }

    public String getLiga() {
        return liga;
    }

    public int getPlace() {
        return place;
    }

    public int getBall() {
        return ball;
    }

    public double getPercent() {
        return percent;
    }
}
