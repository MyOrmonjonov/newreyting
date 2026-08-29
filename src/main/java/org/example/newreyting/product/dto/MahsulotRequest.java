package org.example.newreyting.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record MahsulotRequest(
        @NotBlank String nomi,
        @NotBlank String birlik,
        @Min(0) int standartPlan
) {
}
