package org.example.newreyting.employee.dto;

import org.example.newreyting.employee.Ishchi;

import java.time.LocalDate;

public record IshchiResponse(
        Long id,
        String ism,
        String familiya,
        Long supervayzerId,
        String supervayzerFullName,
        LocalDate ishGaKirganSana,
        boolean active
) {
    public static IshchiResponse from(Ishchi i) {
        return new IshchiResponse(
                i.getId(),
                i.getIsm(),
                i.getFamiliya(),
                i.getSupervayzer().getId(),
                i.getSupervayzer().getFullName(),
                i.getIshGaKirganSana(),
                i.isActive()
        );
    }
}
