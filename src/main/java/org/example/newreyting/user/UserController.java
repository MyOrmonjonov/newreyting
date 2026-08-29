package org.example.newreyting.user;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.user.dto.CreateUserRequest;
import org.example.newreyting.user.dto.ResetPasswordRequest;
import org.example.newreyting.user.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // --- Operatorlar: faqat Admin qo'sha/ko'ra oladi ---

    @GetMapping("/operators")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listOperators() {
        return userService.listByRole(Role.OPERATOR).stream().map(UserResponse::from).toList();
    }

    @PostMapping("/operators")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createOperator(@Valid @RequestBody CreateUserRequest req,
                                        @AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(userService.create(req, Role.OPERATOR, principal.getUser()));
    }

    @PutMapping("/operators/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetOperatorPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest req,
                                       @AuthenticationPrincipal AppUserDetails principal) {
        userService.resetPassword(id, Role.OPERATOR, req.newPassword(), principal.getUser());
    }

    // --- Menejerlar: Admin yoki Operator qo'sha/ko'ra oladi ---

    @GetMapping("/menejers")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public List<UserResponse> listMenejers() {
        return userService.listByRole(Role.MENEJER).stream().map(UserResponse::from).toList();
    }

    @PostMapping("/menejers")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createMenejer(@Valid @RequestBody CreateUserRequest req,
                                       @AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(userService.create(req, Role.MENEJER, principal.getUser()));
    }

    @PutMapping("/menejers/{id}/password")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetMenejerPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest req,
                                      @AuthenticationPrincipal AppUserDetails principal) {
        userService.resetPassword(id, Role.MENEJER, req.newPassword(), principal.getUser());
    }

    // --- Supervayzerlar: Admin yoki Menejer qo'sha/ko'ra oladi ---

    @GetMapping("/supervayzers")
    @PreAuthorize("hasAnyRole('ADMIN','MENEJER','OPERATOR')")
    public List<UserResponse> listSupervayzers() {
        return userService.listByRole(Role.SUPERVAYZER).stream().map(UserResponse::from).toList();
    }

    @PostMapping("/supervayzers")
    @PreAuthorize("hasAnyRole('ADMIN','MENEJER')")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createSupervayzer(@Valid @RequestBody CreateUserRequest req,
                                           @AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(userService.create(req, Role.SUPERVAYZER, principal.getUser()));
    }

    @PutMapping("/supervayzers/{id}/password")
    @PreAuthorize("hasAnyRole('ADMIN','MENEJER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetSupervayzerPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest req,
                                          @AuthenticationPrincipal AppUserDetails principal) {
        userService.resetPassword(id, Role.SUPERVAYZER, req.newPassword(), principal.getUser());
    }
}
