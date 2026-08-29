package org.example.newreyting.auth;

import jakarta.validation.Valid;
import org.example.newreyting.auth.dto.LoginRequest;
import org.example.newreyting.auth.dto.LoginResponse;
import org.example.newreyting.user.User;
import org.example.newreyting.user.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            var auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.login(), req.password()));
            AppUserDetails principal = (AppUserDetails) auth.getPrincipal();
            User user = principal.getUser();
            String token = jwtService.generateToken(user.getLogin(), user.getRole().name());
            return ResponseEntity.ok(new LoginResponse(token, UserResponse.from(user)));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("Bu hisob faol emas"));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiError("Login yoki parol noto'g'ri"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.ok(UserResponse.from(principal.getUser()));
    }

    public record ApiError(String message) {
    }
}
