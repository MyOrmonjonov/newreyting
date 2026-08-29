package org.example.newreyting.rating.dto;

/** Menejer va Supervayzer reytingi uchun umumiy shakl (roll-up hisoblangan). */
public record RankedUserResponse(
        Long id,
        int place,
        String fullName,
        double percent,
        int yesterday,
        int monthPoints
) {
}
