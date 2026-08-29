package org.example.newreyting.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(@NotBlank String ism, @NotBlank String familiya) {
}
