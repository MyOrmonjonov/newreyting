package org.example.newreyting.result.dto;

import org.example.newreyting.result.OylikNatija;

import java.time.LocalDate;

public record NatijaRowResponse(
        Long id,
        Long ishchiId,
        String ishchiFullName,
        Long mahsulotId,
        String mahsulotNomi,
        LocalDate oy,
        int plan,
        int bajarildi
) {
    public static NatijaRowResponse from(OylikNatija n) {
        return new NatijaRowResponse(
                n.getId(),
                n.getIshchi().getId(),
                n.getIshchi().getIsm() + " " + n.getIshchi().getFamiliya(),
                n.getMahsulot().getId(),
                n.getMahsulot().getNomi(),
                n.getOy(),
                n.getPlan(),
                n.getBajarildi()
        );
    }
}
