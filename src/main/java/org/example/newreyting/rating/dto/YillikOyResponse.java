package org.example.newreyting.rating.dto;

public record YillikOyResponse(
        String oy,
        long plan,
        long fakt
) {
}
