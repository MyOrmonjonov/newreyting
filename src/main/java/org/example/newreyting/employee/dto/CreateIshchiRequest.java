package org.example.newreyting.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateIshchiRequest(
        @NotBlank String ism,
        @NotBlank String familiya,
        /** ADMIN/OPERATOR/MENEJER kiritganda majburiy; SUPERVAYZER kiritganda e'tiborga olinmaydi (o'zi biriktiriladi). */
        Long supervayzerId,
        @NotNull LocalDate ishGaKirganSana,
        /** Natija hali kiritilmagan oylar uchun ko'rsatiladigan boshlang'ich liga: diamond/gold/silver/bronze/rising. Ixtiyoriy — bo'sh bo'lsa "rising". */
        String boshlangichLiga
) {
}
