package org.example.newreyting.branch.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFilialRequest(@NotBlank String nomi) {
}
