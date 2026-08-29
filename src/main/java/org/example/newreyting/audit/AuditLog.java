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

    /**
     * Actor'ning to'liq ismi va roli harakat vaqtida "suratga olinadi" (snapshot) — jonli
     * foreign key emas. Shunda actor keyinchalik o'chirilsa ham audit tarixi buzilmaydi va
     * o'sha paytdagi ism/rol saqlanib qoladi.
     */
    @Column(nullable = false)
    private String actorNomi;

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
        this.actorNomi = actor.getFullName();
        this.actorRoleSnapshot = actor.getRole();
        this.harakat = harakat;
        this.maqsad = maqsad;
    }

    public Long getId() {
        return id;
    }

    public String getActorNomi() {
        return actorNomi;
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
