package org.example.newreyting.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdateIshchiRequest(
        @NotBlank String ism,
        @NotBlank String familiya,
        @NotNull Long filialId,
        /** ADMIN/OPERATOR/MENEJER uchun majburiy; SUPERVAYZER uchun e'tiborga olinmaydi (o'zi qoladi). */
        Long supervayzerId,
        @NotNull LocalDate ishGaKirganSana,
        boolean active
) {
}
