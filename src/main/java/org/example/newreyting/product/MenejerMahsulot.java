package org.example.newreyting.product;

import jakarta.persistence.*;
import org.example.newreyting.user.User;

/** Qaysi menejerga qaysi mahsulot(lar) biriktirilgan — bitta mahsulot bir nechta menejerga
 * tegishli bo'lishi mumkin (ko'pdan-ko'p). Menejerning supervayzer/agentlari natija kiritganda
 * faqat shu ro'yxatdagi mahsulotlar ko'rsatiladi (hech narsa biriktirilmagan bo'lsa — hammasi,
 * {@link MenejerMahsulotService#visibleFor} ga qarang, eski xatti-harakatni saqlash uchun). */
@Entity
@Table(name = "menejer_mahsulot", uniqueConstraints = @UniqueConstraint(columnNames = {"menejer_id", "mahsulot_id"}))
public class MenejerMahsulot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menejer_id", nullable = false)
    private User menejer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mahsulot_id", nullable = false)
    private Mahsulot mahsulot;

    protected MenejerMahsulot() {
    }

    public MenejerMahsulot(User menejer, Mahsulot mahsulot) {
        this.menejer = menejer;
        this.mahsulot = mahsulot;
    }

    public Long getId() {
        return id;
    }

    public User getMenejer() {
        return menejer;
    }

    public Mahsulot getMahsulot() {
        return mahsulot;
    }
}
