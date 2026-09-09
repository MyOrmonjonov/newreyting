package org.example.newreyting.rating;

import jakarta.persistence.*;
import org.example.newreyting.user.User;

import java.time.LocalDate;

/**
 * Menejer/Supervayzer uchun QO'LDA kiritilgan tarixiy oylik natija (ball + foiz). Tizimda
 * menejer/supervayzer'ning o'z "natijasi" degan narsa yo'q — odatda ularning foizi tagidagi
 * agentlarning OylikNatija satrlaridan avtomatik hisoblanadi (RatingService.rankUsers). Bu
 * jadval faqat tizimdan OLDINGI (eski, qog'ozdagi) oylar uchun — o'sha oyda agent kesimida
 * ma'lumot yo'q, lekin supervayzer/menejerning o'zi uchun tayyor ball/foiz ma'lum bo'lsa —
 * shuni to'g'ridan-to'g'ri saqlash uchun. Mavjud bo'lsa, RatingService hisoblashda buni ustun
 * qo'yadi (agentlar yig'indisi o'rniga); yangi/joriy oylar uchun bunday yozuv kiritilmaydi va
 * hisoblash avvalgidek — eski formula bo'yicha — davom etadi.
 */
@Entity
@Table(name = "rahbar_oylik_natija", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "oy"}))
public class RahbarOylikNatija {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate oy;

    @Column(nullable = false)
    private double percent;

    @Column(nullable = false)
    private int ball;

    protected RahbarOylikNatija() {
    }

    public RahbarOylikNatija(User user, LocalDate oy, double percent, int ball) {
        this.user = user;
        this.oy = oy;
        this.percent = percent;
        this.ball = ball;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public LocalDate getOy() {
        return oy;
    }

    public double getPercent() {
        return percent;
    }

    public void setPercent(double percent) {
        this.percent = percent;
    }

    public int getBall() {
        return ball;
    }

    public void setBall(int ball) {
        this.ball = ball;
    }
}
