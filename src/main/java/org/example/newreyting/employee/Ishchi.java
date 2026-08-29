package org.example.newreyting.employee;

import jakarta.persistence.*;
import org.example.newreyting.branch.Filial;
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "filial_id", nullable = false)
    private Filial filial;

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

    protected Ishchi() {
    }

    public Ishchi(String ism, String familiya, Filial filial, User supervayzer, LocalDate ishGaKirganSana, User createdBy) {
        this.ism = ism;
        this.familiya = familiya;
        this.filial = filial;
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

    public String getFamiliya() {
        return familiya;
    }

    public Filial getFilial() {
        return filial;
    }

    public User getSupervayzer() {
        return supervayzer;
    }

    public LocalDate getIshGaKirganSana() {
        return ishGaKirganSana;
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
}
