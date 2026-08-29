package org.example.newreyting.audit.dto;

import org.example.newreyting.audit.AuditLog;
import org.example.newreyting.user.Role;

import java.time.Instant;

public record AuditEntryResponse(
        Long id,
        Instant vaqt,
        String actorFullName,
        String role,
        String harakat,
        String maqsad
) {
    public static AuditEntryResponse from(AuditLog log) {
        return new AuditEntryResponse(
                log.getId(),
                log.getVaqt(),
                log.getActor() != null ? log.getActor().getFullName() : "Tizim",
                capitalize(log.getActorRoleSnapshot()),
                log.getHarakat().getLabel(),
                log.getMaqsad()
        );
    }

    private static String capitalize(Role role) {
        String name = role.name().toLowerCase();
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }
}
