package org.example.newreyting.rating.dto;

public record AgentResponse(
        Long id,
        int place,
        String ism,
        String familiya,
        String fullName,
        String filialNomi,
        String supervisorFullName,
        double percent,
        int points,
        int today,
        int yesterday,
        int trophies,
        int yearsActive,
        String league
) {
}
