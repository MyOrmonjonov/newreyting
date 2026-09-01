package org.example.newreyting.rating.dto;

public record YillikSupervayzerResponse(
        Long id,
        String fullName,
        int place,
        /** 1-o'rin bo'lsa "Supervisor of the Year | Elite Supervisor" (Nizom). */
        String nomination,
        int totalBall,
        int firstPlaces,
        int secondPlaces,
        int thirdPlaces,
        double avgPercent
) {
}
