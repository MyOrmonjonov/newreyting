package org.example.newreyting.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank String ism,
        @NotBlank String familiya,
        @NotBlank String login,
        @NotBlank @Size(min = 6, message = "Parol kamida 6 belgidan iborat bo'lishi kerak") String password
) {
}
