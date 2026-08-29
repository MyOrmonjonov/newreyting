package org.example.newreyting.auth;

import jakarta.validation.Valid;
import org.example.newreyting.audit.AuditService;
import org.example.newreyting.audit.HarakatTuri;
import org.example.newreyting.auth.dto.ChangePasswordRequest;
import org.example.newreyting.auth.dto.LoginRequest;
import org.example.newreyting.auth.dto.LoginResponse;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserService;
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
    private final UserService userService;
    private final AuditService auditService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService,
                           AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            var auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.login(), req.password()));
            AppUserDetails principal = (AppUserDetails) auth.getPrincipal();
            User user = principal.getUser();
            String token = jwtService.generateToken(user.getLogin(), user.getRole().name());
            auditService.record(user, HarakatTuri.KIRDI, "Tizimga kirish");
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

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest req,
                                @AuthenticationPrincipal AppUserDetails principal) {
        userService.changeOwnPassword(principal.getUser(), req.oldPassword(), req.newPassword());
    }

    public record ApiError(String message) {
    }
}
