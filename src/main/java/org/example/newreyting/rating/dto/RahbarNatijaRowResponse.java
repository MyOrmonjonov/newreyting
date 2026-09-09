package org.example.newreyting.rating.dto;

import org.example.newreyting.rating.RahbarOylikNatija;

public record RahbarNatijaRowResponse(Long userId, double percent, int ball) {
    public static RahbarNatijaRowResponse from(RahbarOylikNatija n) {
        return new RahbarNatijaRowResponse(n.getUser().getId(), n.getPercent(), n.getBall());
    }
}
