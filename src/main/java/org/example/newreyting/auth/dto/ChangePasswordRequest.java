package org.example.newreyting.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank String oldPassword,
        @NotBlank @Size(min = 6, message = "Yangi parol kamida 6 belgidan iborat bo'lishi kerak") String newPassword
) {
}
