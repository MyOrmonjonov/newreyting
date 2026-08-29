package org.example.newreyting.config;

import org.example.newreyting.user.Role;
import org.example.newreyting.user.User;
import org.example.newreyting.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEFAULT_ADMIN_LOGIN = "admin";
    private static final String DEFAULT_ADMIN_PASSWORD = "admin123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            return;
        }
        User admin = new User(
                "Admin",
                "MICCO",
                DEFAULT_ADMIN_LOGIN,
                passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD),
                Role.ADMIN,
                null
        );
        userRepository.save(admin);
        log.warn("=====================================================================");
        log.warn(" Dastlabki ADMIN hisobi yaratildi — login: '{}', parol: '{}'", DEFAULT_ADMIN_LOGIN, DEFAULT_ADMIN_PASSWORD);
        log.warn(" MUHIM: birinchi kirishdan so'ng parolni albatta almashtiring!");
        log.warn("=====================================================================");
    }
}
