package org.example.newreyting.result.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record BulkNatijaRequest(
        @NotNull LocalDate oy,
        @NotEmpty List<@Valid Satr> satrlar
) {
    public record Satr(
            @NotNull Long ishchiId,
            @NotNull Long mahsulotId,
            @Min(0) int plan,
            @Min(0) int bajarildi
    ) {
    }
}
