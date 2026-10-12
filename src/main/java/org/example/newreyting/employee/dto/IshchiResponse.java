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
        boolean active,
        String boshlangichLiga,
        String rasm,
        String viloyat
) {
    public static IshchiResponse from(Ishchi i) {
        return new IshchiResponse(
                i.getId(),
                i.getIsm(),
                i.getFamiliya(),
                i.getSupervayzer().getId(),
                i.getSupervayzer().getFullName(),
                i.getIshGaKirganSana(),
                i.isActive(),
                i.getBoshlangichLiga() != null ? i.getBoshlangichLiga().key() : null,
                i.getRasm(),
                i.getViloyat() != null ? i.getViloyat().key() : null
        );
    }

    /** Ro'yxat uchun — {@code rasm} to'liq base64 o'rniga keshlanadigan URL'ga almashtiriladi
     * (xuddi {@code RatingService.rasmPath} kabi), aks holda ko'p agentli ro'yxat javobi
     * o'nlab megabaytga yetib, admin panelni sekinlashtirar/qotirar edi. */
    public static IshchiResponse listItem(Ishchi i) {
        String rasm = i.getRasm();
        String rasmUrl = (rasm == null || rasm.isBlank()) ? null : "/api/reyting/ishchi/" + i.getId() + "/rasm";
        return new IshchiResponse(
                i.getId(),
                i.getIsm(),
                i.getFamiliya(),
                i.getSupervayzer().getId(),
                i.getSupervayzer().getFullName(),
                i.getIshGaKirganSana(),
                i.isActive(),
                i.getBoshlangichLiga() != null ? i.getBoshlangichLiga().key() : null,
                rasmUrl,
                i.getViloyat() != null ? i.getViloyat().key() : null
        );
    }
}
