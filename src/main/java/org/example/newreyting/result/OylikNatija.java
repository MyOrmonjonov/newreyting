package org.example.newreyting.result;

import jakarta.persistence.*;
import org.example.newreyting.employee.Ishchi;
import org.example.newreyting.product.Mahsulot;

import java.time.LocalDate;

/** Diqqat: unikal cheklov (ishchi_id, mahsulot_id, oy) ustunlari shu tartibda indekslanadi —
 * {@code oy} oxirgi ustun bo'lgani uchun, FAQAT {@code oy} bo'yicha filtrlovchi so'rovlar
 * (masalan {@link OylikNatijaRepository#findAllByOy}, natija kiritish/ko'rish sahifasi har
 * oy yuklanganda ishlatadi) bu indeksdan samarali foydalana olmaydi — jadval kattalashgani
 * sari sekinlashib boraveradi. Shuning uchun {@code oy} uchun alohida indeks qo'shilgan. */
@Entity
@Table(name = "oylik_natija", uniqueConstraints = @UniqueConstraint(columnNames = {"ishchi_id", "mahsulot_id", "oy"}),
        indexes = @Index(name = "idx_oylik_natija_oy", columnList = "oy"))
public class OylikNatija {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ishchi_id", nullable = false)
    private Ishchi ishchi;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mahsulot_id", nullable = false)
    private Mahsulot mahsulot;

    /** Oyning 1-kuni sifatida saqlanadi (masalan 2026-07-01). */
    @Column(nullable = false)
    private LocalDate oy;

    @Column(nullable = false)
    private int plan;

    @Column(nullable = false)
    private int bajarildi;

    protected OylikNatija() {
    }

    public OylikNatija(Ishchi ishchi, Mahsulot mahsulot, LocalDate oy, int plan, int bajarildi) {
        this.ishchi = ishchi;
        this.mahsulot = mahsulot;
        this.oy = oy;
        this.plan = plan;
        this.bajarildi = bajarildi;
    }

    public Long getId() {
        return id;
    }

    public Ishchi getIshchi() {
        return ishchi;
    }

    public Mahsulot getMahsulot() {
        return mahsulot;
    }

    public LocalDate getOy() {
        return oy;
    }

    public int getPlan() {
        return plan;
    }

    public void setPlan(int plan) {
        this.plan = plan;
    }

    public int getBajarildi() {
        return bajarildi;
    }

    public void setBajarildi(int bajarildi) {
        this.bajarildi = bajarildi;
    }
}
