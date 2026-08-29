package org.example.newreyting.rating.dto;

import java.util.List;

public record ScoreboardRowResponse(
        Long id,
        int place,
        String fullName,
        List<MonthPoint> oylar,
        double ortachaPercent,
        int jamiBall
) {
    public record MonthPoint(String oy, double percent, int ball) {
    }
}
