package org.example.newreyting.user.dto;

import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;

import java.time.Instant;

public record UserResponse(
        Long id,
        String ism,
        String familiya,
        String login,
        Role role,
        boolean active,
        String createdByFullName,
        Instant createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(),
                u.getIsm(),
                u.getFamiliya(),
                u.getLogin(),
                u.getRole(),
                u.isActive(),
                u.getCreatedBy() != null ? u.getCreatedBy().getFullName() : null,
                u.getCreatedAt()
        );
    }
}
