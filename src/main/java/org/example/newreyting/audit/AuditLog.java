package org.example.newreyting.audit;

import jakarta.persistence.*;
import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;

import java.time.Instant;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    /** Actor'ning harakat vaqtidagi roli — keyinchalik actor roli o'zgarsa ham tarix to'g'ri qolishi uchun. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role actorRoleSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HarakatTuri harakat;

    @Column(nullable = false)
    private String maqsad;

    @Column(nullable = false, updatable = false)
    private Instant vaqt = Instant.now();

    protected AuditLog() {
    }

    public AuditLog(User actor, HarakatTuri harakat, String maqsad) {
        this.actor = actor;
        this.actorRoleSnapshot = actor.getRole();
        this.harakat = harakat;
        this.maqsad = maqsad;
    }

    public Long getId() {
        return id;
    }

    public User getActor() {
        return actor;
    }

    public Role getActorRoleSnapshot() {
        return actorRoleSnapshot;
    }

    public HarakatTuri getHarakat() {
        return harakat;
    }

    public String getMaqsad() {
        return maqsad;
    }

    public Instant getVaqt() {
        return vaqt;
    }
}
