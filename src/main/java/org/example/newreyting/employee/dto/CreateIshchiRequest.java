package org.example.newreyting.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateIshchiRequest(
        @NotBlank String ism,
        @NotBlank String familiya,
        @NotNull Long filialId,
        /** ADMIN/OPERATOR/MENEJER kiritganda majburiy; SUPERVAYZER kiritganda e'tiborga olinmaydi (o'zi biriktiriladi). */
        Long supervayzerId,
        @NotNull LocalDate ishGaKirganSana
) {
}
