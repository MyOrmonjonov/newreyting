package org.example.newreyting.employee;

import jakarta.persistence.*;
import org.example.newreyting.user.User;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "ishchi")
public class Ishchi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ism;

    @Column(nullable = false)
    private String familiya;

    /** Ishchini boshqaradigan supervayzer (User, role=SUPERVAYZER). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supervayzer_id", nullable = false)
    private User supervayzer;

    @Column(nullable = false)
    private LocalDate ishGaKirganSana;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /** Natija hali kiritilmagan oylar uchun ko'rsatiladigan boshlang'ich liga (null = "rising"). */
    @Enumerated(EnumType.STRING)
    @Column(name = "boshlangich_liga")
    private Liga boshlangichLiga;

    /** Fondan ajratilgan (shaffof) surat — data URL sifatida (masalan "data:image/png;base64,...").
     * E'tibor: @Lob ataylab qo'yilmagan — PostgreSQL'da @Lob String'ni "Large Object" (OID)
     * sifatida saqlaydi, bu esa avtomatik-commit rejimida o'qishda xato beradi. Oddiy TEXT ustun
     * bilan cheklovsiz uzunlikdagi matn muammosiz saqlanadi. */
    @Column(columnDefinition = "TEXT")
    private String rasm;

    protected Ishchi() {
    }

    public Ishchi(String ism, String familiya, User supervayzer, LocalDate ishGaKirganSana, User createdBy) {
        this.ism = ism;
        this.familiya = familiya;
        this.supervayzer = supervayzer;
        this.ishGaKirganSana = ishGaKirganSana;
        this.createdBy = createdBy;
    }

    public Long getId() {
        return id;
    }

    public String getIsm() {
        return ism;
    }

    public void setIsm(String ism) {
        this.ism = ism;
    }

    public String getFamiliya() {
        return familiya;
    }

    public void setFamiliya(String familiya) {
        this.familiya = familiya;
    }

    public User getSupervayzer() {
        return supervayzer;
    }

    public void setSupervayzer(User supervayzer) {
        this.supervayzer = supervayzer;
    }

    public LocalDate getIshGaKirganSana() {
        return ishGaKirganSana;
    }

    public void setIshGaKirganSana(LocalDate ishGaKirganSana) {
        this.ishGaKirganSana = ishGaKirganSana;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Liga getBoshlangichLiga() {
        return boshlangichLiga;
    }

    public void setBoshlangichLiga(Liga boshlangichLiga) {
        this.boshlangichLiga = boshlangichLiga;
    }

    public String getRasm() {
        return rasm;
    }

    public void setRasm(String rasm) {
        this.rasm = rasm;
    }
}
