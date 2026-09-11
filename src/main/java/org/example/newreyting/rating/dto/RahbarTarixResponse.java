package org.example.newreyting.rating.dto;

import java.util.List;

/** Supervayzer/menejer uchun bir yillik 12 oylik o'rin matritsasi qatori — {@code placesByMonth}da yanvar-dekabr, ma'lumot yo'q bo'lsa null. */
public record RahbarTarixResponse(
        Long id,
        String fullName,
        List<Integer> placesByMonth
) {
}
