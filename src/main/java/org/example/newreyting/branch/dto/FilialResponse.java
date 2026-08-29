package org.example.newreyting.branch.dto;

import org.example.newreyting.branch.Filial;

public record FilialResponse(Long id, String nomi) {
    public static FilialResponse from(Filial f) {
        return new FilialResponse(f.getId(), f.getNomi());
    }
}
