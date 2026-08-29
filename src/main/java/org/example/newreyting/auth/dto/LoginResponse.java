package org.example.newreyting.auth.dto;

import org.example.newreyting.user.dto.UserResponse;

public record LoginResponse(String token, UserResponse user) {
}
