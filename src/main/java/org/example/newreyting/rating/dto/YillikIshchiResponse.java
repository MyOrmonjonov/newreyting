package org.example.newreyting.rating.dto;

public record YillikIshchiResponse(
        Long id,
        String ism,
        String familiya,
        String fullName,
        String supervisorFullName,
        String rasm,
        String league,
        int place,
        /** Ligadagi 1-o'rin bo'lsa, Nizom VII BOB'idagi nominatsiya unvoni (masalan "Diamond Champion"). */
        String nomination,
        int totalBall,
        int firstPlaces,
        int secondPlaces,
        int thirdPlaces,
        double avgPercent
) {
}
