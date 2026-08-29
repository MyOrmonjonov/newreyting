package org.example.newreyting.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret:}") String configuredSecret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes
    ) {
        if (configuredSecret == null || configuredSecret.isBlank()) {
            // JWT_SECRET berilmagan — hardcode qilingan (demak GitHub'da ochiq) kalit
            // ishlatish o'rniga har ishga tushishda xavfsiz tasodifiy kalit generatsiya
            // qilinadi. Kamchiligi: qayta ishga tushirilganda eski tokenlar bekor bo'ladi —
            // shuning uchun production'da JWT_SECRET muhit o'zgaruvchisi albatta berilishi kerak.
            this.key = Jwts.SIG.HS384.key().build();
            log.warn("JWT_SECRET muhit o'zgaruvchisi berilmagan — vaqtinchalik tasodifiy kalit "
                    + "generatsiya qilindi. Production'da JWT_SECRET'ni albatta o'rnating, aks holda "
                    + "har qayta ishga tushirilganda barcha foydalanuvchilar tizimdan chiqarib yuboriladi.");
        } else {
            this.key = Keys.hmacShaKeyFor(configuredSecret.getBytes(StandardCharsets.UTF_8));
        }
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(String login, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(login)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
                .signWith(key)
                .compact();
    }

    public String extractLogin(String token) {
        return parse(token).getSubject();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
