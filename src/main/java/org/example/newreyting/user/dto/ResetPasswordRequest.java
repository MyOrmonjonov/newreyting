package org.example.newreyting.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(min = 6, message = "Parol kamida 6 belgidan iborat bo'lishi kerak") String newPassword
) {
}
