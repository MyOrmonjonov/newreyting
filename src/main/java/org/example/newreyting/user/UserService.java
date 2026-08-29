package org.example.newreyting.user;

import org.example.newreyting.user.dto.CreateUserRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User create(CreateUserRequest req, Role role, User createdBy) {
        if (userRepository.existsByLoginIgnoreCase(req.login())) {
            throw new IllegalArgumentException("Bu login band: " + req.login());
        }
        User user = new User(
                req.ism().trim(),
                req.familiya().trim(),
                req.login().trim(),
                passwordEncoder.encode(req.password()),
                role,
                createdBy
        );
        return userRepository.save(user);
    }

    public List<User> listByRole(Role role) {
        return userRepository.findByRoleOrderByFamiliyaAsc(role);
    }

    /** Foydalanuvchi o'zining joriy parolini bilib, yangisiga almashtiradi. */
    @Transactional
    public void changeOwnPassword(User user, String oldPassword, String newPassword) {
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Joriy parol noto'g'ri");
        }
        // `user` @AuthenticationPrincipal orqali oldingi (JwtAuthFilter) so'rovda yuklangan,
        // shu tranzaksiya doirasida detached — save() chaqirmasak o'zgarish bazaga yozilmaydi.
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /** Yuqori rol (masalan Admin) quyi rol foydalanuvchisining parolini eskisini bilmasdan yangilaydi. */
    @Transactional
    public void resetPassword(Long userId, Role expectedRole, String newPassword) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getRole() == expectedRole)
                .orElseThrow(() -> new IllegalArgumentException("Foydalanuvchi topilmadi"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }
}
