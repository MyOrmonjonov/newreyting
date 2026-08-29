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
}
