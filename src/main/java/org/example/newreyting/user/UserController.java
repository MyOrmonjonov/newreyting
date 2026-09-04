package org.example.newreyting.user;

import jakarta.validation.Valid;
import org.example.newreyting.auth.AppUserDetails;
import org.example.newreyting.user.dto.CreateUserRequest;
import org.example.newreyting.user.dto.ResetPasswordRequest;
import org.example.newreyting.user.dto.UpdateActiveRequest;
import org.example.newreyting.user.dto.UpdateProfileRequest;
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

    @PutMapping("/operators/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setOperatorActive(@PathVariable Long id, @Valid @RequestBody UpdateActiveRequest req,
                                   @AuthenticationPrincipal AppUserDetails principal) {
        userService.setActive(id, Role.OPERATOR, req.active(), principal.getUser());
    }

    @PutMapping("/operators/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateOperator(@PathVariable Long id, @Valid @RequestBody UpdateProfileRequest req,
                                        @AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(userService.updateProfile(id, Role.OPERATOR, req.ism(), req.familiya(), principal.getUser()));
    }

    @DeleteMapping("/operators/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOperator(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        userService.delete(id, Role.OPERATOR, principal.getUser());
    }

    // --- Menejerlar: Admin yoki Operator qo'sha/ko'ra oladi (Operator faqat o'zinikini) ---

    @GetMapping("/menejers")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public List<UserResponse> listMenejers(@AuthenticationPrincipal AppUserDetails principal) {
        return userService.listByRoleVisibleTo(Role.MENEJER, principal.getUser()).stream().map(UserResponse::from).toList();
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

    @PutMapping("/menejers/{id}/active")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setMenejerActive(@PathVariable Long id, @Valid @RequestBody UpdateActiveRequest req,
                                  @AuthenticationPrincipal AppUserDetails principal) {
        userService.setActive(id, Role.MENEJER, req.active(), principal.getUser());
    }

    @PutMapping("/menejers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public UserResponse updateMenejer(@PathVariable Long id, @Valid @RequestBody UpdateProfileRequest req,
                                       @AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(userService.updateProfile(id, Role.MENEJER, req.ism(), req.familiya(), principal.getUser()));
    }

    @DeleteMapping("/menejers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMenejer(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        userService.delete(id, Role.MENEJER, principal.getUser());
    }

    // --- Supervayzerlar: Admin, Menejer (o'ziniki) yoki Operator (ishchi biriktirish uchun, o'ziniki) ---

    @GetMapping("/supervayzers")
    @PreAuthorize("hasAnyRole('ADMIN','MENEJER','OPERATOR')")
    public List<UserResponse> listSupervayzers(@AuthenticationPrincipal AppUserDetails principal) {
        return userService.listByRoleVisibleTo(Role.SUPERVAYZER, principal.getUser()).stream().map(UserResponse::from).toList();
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

    @PutMapping("/supervayzers/{id}/active")
    @PreAuthorize("hasAnyRole('ADMIN','MENEJER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setSupervayzerActive(@PathVariable Long id, @Valid @RequestBody UpdateActiveRequest req,
                                      @AuthenticationPrincipal AppUserDetails principal) {
        userService.setActive(id, Role.SUPERVAYZER, req.active(), principal.getUser());
    }

    @PutMapping("/supervayzers/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MENEJER')")
    public UserResponse updateSupervayzer(@PathVariable Long id, @Valid @RequestBody UpdateProfileRequest req,
                                           @AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(userService.updateProfile(id, Role.SUPERVAYZER, req.ism(), req.familiya(), principal.getUser()));
    }

    // Diqqat: MENEJER supervayzer qo'sha/tahrirlay/faolsizlantira oladi, lekin o'chira olmaydi
    // (faqat ADMIN o'chira oladi) — buyurtma bo'yicha ataylab shunday cheklangan.
    @DeleteMapping("/supervayzers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSupervayzer(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        userService.delete(id, Role.SUPERVAYZER, principal.getUser());
    }
}
