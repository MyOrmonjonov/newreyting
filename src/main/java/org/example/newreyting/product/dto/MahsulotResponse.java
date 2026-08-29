package org.example.newreyting.product.dto;

import org.example.newreyting.product.Mahsulot;

public record MahsulotResponse(Long id, String nomi, String birlik, int standartPlan) {
    public static MahsulotResponse from(Mahsulot m) {
        return new MahsulotResponse(m.getId(), m.getNomi(), m.getBirlik(), m.getStandartPlan());
    }
}
