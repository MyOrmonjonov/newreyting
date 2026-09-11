package org.example.newreyting.rating.dto;

import java.util.List;

/** Ishchi uchun bir yillik 12 oylik o'rin matritsasi qatori — {@code placesByMonth}da yanvar-dekabr, ma'lumot yo'q bo'lsa null. */
public record IshchiTarixResponse(
        Long id,
        String fullName,
        String rasm,
        List<Integer> placesByMonth
) {
}
